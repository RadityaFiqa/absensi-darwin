import axios from 'axios';
import { query } from './db';
import { logActivity } from './logger';

export async function runAutoAttendanceCron() {
  console.log('[CRON] Running auto attendance check at:', new Date().toISOString());
  try {
    // 1. Fetch all active users with auto attendance and credentials configured
    const usersRes = await query(
      `SELECT id, employee_no, token, udid, default_image, cutoff_clockin, cutoff_checkout, preferred_location_id 
       FROM users 
       WHERE auto_attendance = true 
         AND default_image IS NOT NULL 
         AND default_image != '' 
         AND token IS NOT NULL 
         AND token != ''`
    );

    if (usersRes.rowCount === 0) {
      console.log('[CRON] No users configured for auto attendance.');
      return;
    }

    console.log(`[CRON] Found ${usersRes.rowCount} user(s) configured for auto attendance.`);

    const base = process.env.NEXT_PUBLIC_API_BASE || 'https://insantangguh-bulog.darwinbox.com';
    const checkinStatusUrl = `${base}/attendance/AttendanceMobileApi/DashboardClockinCheckin`;

    // Location details will be fetched per-user in the loop dynamically

    // Determine current time in Makassar timezone (Asia/Makassar)
    const makassarTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar', hour12: false });
    const timePart = makassarTimeStr.split(', ')[1] || '';
    const [hourStr, minuteStr] = timePart.split(':');
    const currentHour = parseInt(hourStr || '0', 10);
    const currentMinute = parseInt(minuteStr || '0', 10);
    const currentMinutes = currentHour * 60 + currentMinute;

    for (const user of usersRes.rows) {
      try {
        console.log(`[CRON] Checking status for employee ${user.employee_no}...`);
        
        // A. Fetch current dashboard data from Darwinbox
        const res = await axios.post(
          checkinStatusUrl,
          { token: user.token },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 20000,
          }
        );

        const attendanceData = res.data;
        if (!attendanceData || attendanceData.status !== 1 || !attendanceData.message) {
          console.warn(`[CRON] Invalid response from Darwinbox for ${user.employee_no}:`, attendanceData);
          continue;
        }

        const todayData = attendanceData.message;
        const cutoffIn = user.cutoff_clockin || '07:30';
        const cutoffOut = user.cutoff_checkout || '17:00';

        const [ciH, ciM] = cutoffIn.split(':').map(Number);
        const [coH, coM] = cutoffOut.split(':').map(Number);
        const ciMinutes = ciH * 60 + ciM;
        const coMinutes = coH * 60 + coM;

        const hasCheckedIn = todayData.check_in_time !== null || todayData.first_check_in_time !== null;
        const hasCheckedOut = todayData.check_out_time !== null;

        let checkAction: 1 | 2 = 1;
        let shouldTrigger = false;

        if (!hasCheckedIn && currentMinutes >= ciMinutes) {
          shouldTrigger = true;
          checkAction = 1; // Clock In
        } else if (hasCheckedIn && !hasCheckedOut && currentMinutes >= coMinutes) {
          shouldTrigger = true;
          checkAction = 2; // Clock Out
        }

        if (shouldTrigger) {
          const actionLabel = checkAction === 1 ? 'CLOCK_IN' : 'CLOCK_OUT';
          console.log(`[CRON] Auto-triggering ${actionLabel} for employee ${user.employee_no}`);

          // Fetch location configuration (preferred or first active)
          let targetLoc = null;
          if (user.preferred_location_id) {
            const locRes = await query(
              'SELECT name, latitude, longitude FROM locations WHERE id = $1 AND is_active = true',
              [user.preferred_location_id]
            );
            if (locRes.rowCount > 0) {
              targetLoc = locRes.rows[0];
            }
          }
          
          if (!targetLoc) {
            const locRes = await query('SELECT name, latitude, longitude FROM locations WHERE is_active = true LIMIT 1');
            if (locRes.rowCount === 0) {
              throw new Error('Tidak ada lokasi aktif di database untuk melakukan auto-absen');
            }
            targetLoc = locRes.rows[0];
          }

          const latlng = `${targetLoc.latitude},${targetLoc.longitude}`;
          const locationBase64 = Buffer.from(targetLoc.name).toString('base64');

          // B. Execute face verification
          const faceVerifyUrl = `${base}/attendance/attendanceMobileApi/verifyFace`;
          const faceVerifyRes = await axios.post(
            faceVerifyUrl,
            { token: user.token, image: user.default_image },
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
              message: 'Auto attendance generated by background cronjob',
              udid: user.udid,
              token: user.token,
              checkin_id: todayData.id
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 30000,
            }
          );

          if (checkInRes.data && checkInRes.data.status === 1) {
            console.log(`[CRON] Auto ${actionLabel} succeeded for user ${user.employee_no}`);
            await logActivity(
              user.employee_no,
              checkAction === 1 ? 'CLOCK_IN_AUTO' : 'CLOCK_OUT_AUTO',
              `Auto ${checkAction === 1 ? 'Clock In' : 'Clock Out'} sukses (via background) di: ${targetLoc.name}`,
              '127.0.0.1',
              'Background Cron Worker'
            );
          } else {
            throw new Error(checkInRes.data?.message || 'Gagal posting absensi ke Darwinbox');
          }
        } else {
          console.log(`[CRON] Employee ${user.employee_no} is up-to-date (no action needed).`);
        }

      } catch (userErr: any) {
        console.error(`[CRON] Error processing user ${user.employee_no}:`, userErr.message);
        try {
          const actionLabel = userErr.message?.includes('Clock In') ? 'AUTO_CLOCK_IN_FAILED' : 'AUTO_CLOCK_OUT_FAILED';
          await logActivity(
            user.employee_no,
            actionLabel,
            `Background Auto Absen gagal: ${userErr.message}`,
            '127.0.0.1',
            'Background Cron Worker'
          );
        } catch (logErr) {
          console.error('[CRON] Failed to log failure to database:', logErr);
        }
      }
    }
  } catch (err: any) {
    console.error('[CRON] Fatal cron error:', err.message);
  }
}

export function startAttendanceCron() {
  const globalObj = global as any;
  if (globalObj.attendanceCronInterval) {
    console.log('[CRON] Background worker is already running.');
    return;
  }

  // Run immediately on start
  runAutoAttendanceCron();

  // Run every 5 minutes (300,000 ms)
  globalObj.attendanceCronInterval = setInterval(() => {
    runAutoAttendanceCron();
  }, 5 * 60 * 1000);

  console.log('[CRON] Background worker initialized successfully.');
}
