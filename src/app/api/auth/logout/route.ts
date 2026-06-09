import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { logActivity, getClientDetails } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (user) {
      const { ip, userAgent } = getClientDetails(request);
      await logActivity(user.employee_no, 'LOGOUT', 'Logged out from application', ip, userAgent);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Auth Logout Error:', error.message);
    return NextResponse.json({ success: true });
  }
}
