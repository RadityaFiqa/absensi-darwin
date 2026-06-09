import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';
import { logActivity, getClientDetails } from '@/lib/logger';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const caller = await getSessionUser(request);
    if (!caller || caller.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Akses ditolak: Hanya Admin' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { is_active } = body;

    if (is_active === undefined) {
      return NextResponse.json({ success: false, message: 'Kolom is_active wajib disertakan' }, { status: 400 });
    }

    // Get user details
    const checkUser = await query('SELECT name, employee_no, is_active FROM users WHERE id = $1', [id]);
    if (checkUser.rowCount === 0) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }
    const user = checkUser.rows[0];

    // Prevent changing oneself's status to inactive
    if (user.employee_no === caller.employee_no && !is_active) {
      return NextResponse.json({ success: false, message: 'Anda tidak dapat menonaktifkan akun Anda sendiri' }, { status: 400 });
    }

    await query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [is_active, id]
    );

    // Log UPDATE_USER activity
    const { ip, userAgent } = getClientDetails(request);
    await logActivity(
      caller.employee_no,
      'UPDATE_USER',
      `Mengubah status user ${user.name} (${user.employee_no}) menjadi ${is_active ? 'AKTIF' : 'NONAKTIF'}`,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true, message: 'Status user berhasil diperbarui' });
  } catch (error: any) {
    console.error('PATCH /api/users/:id/status Error:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Gagal mengubah status user' }, { status: 500 });
  }
}
