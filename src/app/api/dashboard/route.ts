import { NextResponse } from 'next/server';
import axios from 'axios';
import { validateAndSyncUser } from '@/lib/auth-server';
import { query } from '@/lib/db';
import { logActivity, getClientDetails } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;
    const udid = request.headers.get('x-udid') || '';

    if (!token) {
      return NextResponse.json({ status: 0, error: 'Token is required' }, { status: 400 });
    }

    // Validate and sync user locally
    const localUser = await validateAndSyncUser(token, udid);

    const base = process.env.NEXT_PUBLIC_API_BASE || 'https://insantangguh-bulog.darwinbox.com';
    const targetUrl = `${base}/attendance/AttendanceMobileApi/DashboardClockinCheckin`;

    // 1. Fetch current dashboard status from Darwinbox
    const response = await axios.post(
      targetUrl,
      { token },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    let attendanceData = response.data;

    // 2. Retrieve user settings from database
    const dbRes = await query(
      `SELECT default_image, cutoff_clockin, cutoff_checkout, auto_attendance 
       FROM users WHERE employee_no = $1`,
      [localUser.employee_no]
    );

    const userSettings = dbRes.rows[0];

    // 3. Process Automatic Clock-In / Clock-Out if enabled
    if (
      userSettings && 
      userSettings.auto_attendance && 
      userSettings.default_image && 
      attendanceData.status === 1 && 
      attendanceData.message
    ) {
      const todayData = attendanceData.message;

      // Determine current time in Makassar timezone (Asia/Makassar)
      const makassarTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar', hour12: false });
      const timePart = makassarTimeStr.split(', ')[1] || '';
      const [hourStr, minuteStr] = timePart.split(':');
      const currentHour = parseInt(hourStr || '0', 10);
      const currentMinute = parseInt(minuteStr || '0', 10);
      const currentMinutes = currentHour * 60 + currentMinute;

      // Parse cutoff configurations
      const cutoffIn = userSettings.cutoff_clockin || '07:30';
      const cutoffOut = userSettings.cutoff_checkout || '17:00';
      const [ciH, ciM] = cutoffIn.split(':').map(Number);
      const [coH, coM] = cutoffOut.split(':').map(Number);
      const ciMinutes = ciH * 60 + ciM;
      const coMinutes = coH * 60 + coM;

      let triggerAuto = false;
      let checkAction: 1 | 2 = 1; // 1 = Check In, 2 = Check Out
      
      const hasCheckedIn = todayData.check_in_time !== null || todayData.first_check_in_time !== null;
      const hasCheckedOut = todayData.check_out_time !== null;

      if (!hasCheckedIn && currentMinutes >= ciMinutes) {
        // Trigger Automatic Clock In
        triggerAuto = true;
        checkAction = 1;
      } else if (hasCheckedIn && !hasCheckedOut && currentMinutes >= coMinutes) {
        // Trigger Automatic Clock Out
        triggerAuto = true;
        checkAction = 2;
      }

      if (triggerAuto) {
        console.log(`[AUTO ATTENDANCE] Triggering auto ${checkAction === 1 ? 'CLOCK IN' : 'CLOCK OUT'} for employee ${localUser.employee_no}`);
        
        try {
          // A. Fetch first active location for coordinate pairing
          const locRes = await query('SELECT name, latitude, longitude, address FROM locations WHERE is_active = true LIMIT 1');
          if (locRes.rowCount === 0) {
            throw new Error('Tidak ada lokasi aktif di database untuk melakukan auto-absen');
          }
          const defaultLoc = locRes.rows[0];
          const latlng = `${defaultLoc.latitude},${defaultLoc.longitude}`;
          const locationBase64 = Buffer.from(defaultLoc.name).toString('base64');

          // B. Request face verification with stored default image
          const faceVerifyUrl = `${base}/attendance/attendanceMobileApi/verifyFace`;
          const faceVerifyRes = await axios.post(
            faceVerifyUrl,
            { token, image: userSettings.default_image },
            {
              headers: { 'Content-Type': 'application/json' },
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
              timeout: 45000,
            }
          );

          const faceData = faceVerifyRes.data;
          if (!faceData || faceData.status !== 1 || !faceData.verification_id) {
            throw new Error(faceData.message || 'Verifikasi wajah otomatis gagal');
          }

          // C. Perform check-in/check-out post
          const checkInPostUrl = `${base}/Mobileapi/CheckInPost`;
          const checkInRes = await axios.post(
            checkInPostUrl,
            {
              latlng,
              verification_id: faceData.verification_id,
              in_out: checkAction,
              location_type: '1',
              location: locationBase64,
              message: 'Auto attendance generated by system',
              udid,
              token,
              checkin_id: todayData.id
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 30000,
            }
          );

          if (checkInRes.data && checkInRes.data.status === 1) {
            console.log(`[AUTO ATTENDANCE] Auto ${checkAction === 1 ? 'CLOCK IN' : 'CLOCK OUT'} completed successfully.`);
            
            // Record activity log
            const { ip, userAgent } = getClientDetails(request);
            const actionLabel = checkAction === 1 ? 'CLOCK_IN_AUTO' : 'CLOCK_OUT_AUTO';
            await logActivity(
              localUser.employee_no,
              actionLabel,
              `Auto ${checkAction === 1 ? 'Clock In' : 'Clock Out'} sukses di: ${defaultLoc.name} (${latlng})`,
              ip,
              userAgent
            );

            // D. Refresh dashboard status data
            const refreshedRes = await axios.post(
              targetUrl,
              { token },
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000,
              }
            );
            if (refreshedRes.data && refreshedRes.data.status === 1) {
              attendanceData = refreshedRes.data;
            }
          } else {
            throw new Error(checkInRes.data?.message || 'Gagal memposting status absensi ke Darwinbox');
          }

        } catch (autoErr: any) {
          console.error('[AUTO ATTENDANCE] Error during automatic process:', autoErr.message);
          const { ip, userAgent } = getClientDetails(request);
          const actionLabel = checkAction === 1 ? 'AUTO_CLOCK_IN_FAILED' : 'AUTO_CLOCK_OUT_FAILED';
          await logActivity(
            localUser.employee_no,
            actionLabel,
            `Absen otomatis gagal: ${autoErr.message}`,
            ip,
            userAgent
          );
        }
      }
    }

    return NextResponse.json({
      ...attendanceData,
      user: localUser,
    });
  } catch (error: any) {
    console.error('API Dashboard Proxy Error:', error.message);
    const status = error.statusCode || error.response?.status || 500;
    const errorData = error.response?.data || { success: false, message: error.message || 'Terjadi kesalahan pada server proxy' };
    return NextResponse.json(errorData, { status });
  }
}
