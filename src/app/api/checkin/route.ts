import { NextResponse } from 'next/server';
import axios from 'axios';
import { validateAndSyncUser } from '@/lib/auth-server';
import { logActivity, getClientDetails } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { latlng, verification_id, in_out, location_type, location, message, udid, token, checkin_id } = body;

    if (!token || !verification_id) {
      return NextResponse.json({ status: 0, error: 'Token and verification_id are required' }, { status: 400 });
    }

    // Validate user is active in database before performing checkin
    const localUser = await validateAndSyncUser(token, udid);

    const base = process.env.NEXT_PUBLIC_API_BASE || 'https://insantangguh-bulog.darwinbox.com';
    const targetUrl = `${base}/Mobileapi/CheckInPost`;

    const response = await axios.post(
      targetUrl,
      { latlng, verification_id, in_out, location_type, location, message, udid, token, checkin_id },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const data = response.data;

    // Log the checkin/checkout success
    if (data && data.status === 1) {
      const action = in_out === 2 ? 'CLOCK_OUT' : 'CLOCK_IN';
      let locText = '';
      try {
        locText = Buffer.from(location, 'base64').toString('utf-8');
      } catch (e) {
        locText = location;
      }
      const { ip, userAgent } = getClientDetails(request);
      await logActivity(
        localUser.employee_no,
        action,
        `${action === 'CLOCK_IN' ? 'Clock In' : 'Clock Out'} sukses di: ${locText} (${latlng})`,
        ip,
        userAgent
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API CheckIn Proxy Error:', error.message);
    const status = error.statusCode || error.response?.status || 500;
    const errorData = error.response?.data || { success: false, message: error.message || 'Terjadi kesalahan pada server proxy' };
    return NextResponse.json(errorData, { status });
  }
}
