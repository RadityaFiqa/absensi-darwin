import { NextResponse } from 'next/server';
import { validateAndSyncUser } from '@/lib/auth-server';
import { logActivity, getClientDetails } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;
    const udid = request.headers.get('x-udid') || '';

    if (!token) {
      return NextResponse.json({ success: false, message: 'Token wajib diisi' }, { status: 400 });
    }

    const localUser = await validateAndSyncUser(token, udid);

    // Record LOGIN activity log
    const { ip, userAgent } = getClientDetails(request);
    await logActivity(localUser.employee_no, 'LOGIN', 'Logged in via Manual Token', ip, userAgent);

    return NextResponse.json({
      success: true,
      user: localUser,
    });
  } catch (error: any) {
    console.error('API Auth Validate Error:', error.message);
    const status = error.statusCode || 500;
    return NextResponse.json(
      { success: false, message: error.message || 'Autentikasi gagal' },
      { status }
    );
  }
}
