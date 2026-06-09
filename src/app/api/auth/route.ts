import { NextResponse } from 'next/server';
import axios from 'axios';
import { validateAndSyncUser } from '@/lib/auth-server';
import { logActivity, getClientDetails } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { qrcode } = body;
    const udid = request.headers.get('x-udid') || '';

    const base = process.env.NEXT_PUBLIC_API_BASE || 'https://insantangguh-bulog.darwinbox.com';
    const targetUrl = `${base}/Mobileapi/auth`;

    const response = await axios.post(
      targetUrl,
      { qrcode },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const data = response.data;
    
    // Extract token from response payload
    let token = data.token;
    if (!token && data.message) {
      if (typeof data.message === 'string') {
        token = data.message;
      } else if (typeof data.message === 'object' && 'token' in data.message) {
        token = data.message.token;
      }
    }

    if (data.status === 1 && token) {
      // Validate user is registered and active, and sync profile details
      const localUser = await validateAndSyncUser(token, udid);

      // Record LOGIN activity log
      const { ip, userAgent } = getClientDetails(request);
      await logActivity(localUser.employee_no, 'LOGIN', 'Logged in via QR Code', ip, userAgent);

      return NextResponse.json({
        ...data,
        user: localUser,
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Auth Proxy Error:', error.message);

    // Log failed login attempt if it's an AuthForbiddenError (unregistered/inactive user)
    if (error.statusCode === 403 && error.employee_no) {
      try {
        const { ip, userAgent } = getClientDetails(request);
        await logActivity(error.employee_no, 'LOGIN', 'Gagal login: User tidak terdaftar atau tidak aktif', ip, userAgent);
      } catch (logErr) {
        console.error('Failed to log failed login attempt:', logErr);
      }
    }

    const status = error.statusCode || error.response?.status || 500;
    const errorData = error.response?.data || { success: false, message: error.message || 'Terjadi kesalahan pada server proxy' };
    return NextResponse.json(errorData, { status });
  }
}
