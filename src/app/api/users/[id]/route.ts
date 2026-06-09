import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';
import { logActivity, getClientDetails } from '@/lib/logger';

// GET /api/users/:id - Get details of a user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const caller = await getSessionUser(request);
    if (!caller || caller.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Akses ditolak: Hanya Admin' }, { status: 403 });
    }

    const { id } = await params;
    const dbRes = await query('SELECT * FROM users WHERE id = $1', [id]);

    if (dbRes.rowCount === 0) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: dbRes.rows[0] });
  } catch (error: any) {
    console.error('GET /api/users/:id Error:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Gagal mengambil data user' }, { status: 500 });
  }
}

// PUT /api/users/:id - Update user details
export async function PUT(
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
    const { employee_no, name, email, department, designation, role, is_active } = body;

    if (!employee_no || !name || !email) {
      return NextResponse.json({ success: false, message: 'Kolom employee_no, name, dan email wajib diisi' }, { status: 400 });
    }

    // Check if employee_no is already taken by another user
    const checkUser = await query('SELECT id FROM users WHERE employee_no = $1 AND id <> $2', [employee_no, id]);
    if (checkUser.rowCount && checkUser.rowCount > 0) {
      return NextResponse.json({ success: false, message: `User dengan Employee No ${employee_no} sudah terdaftar` }, { status: 409 });
    }

    // Find original user for logging comparison
    const originalUserRes = await query('SELECT name, employee_no FROM users WHERE id = $1', [id]);
    if (originalUserRes.rowCount === 0) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }
    const origUser = originalUserRes.rows[0];

    const dbRes = await query(
      `UPDATE users
       SET employee_no = $1, name = $2, email = $3, department = $4, designation = $5, role = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [employee_no, name, email, department || '', designation || '', role || 'EMPLOYEE', is_active, id]
    );

    const updatedUser = dbRes.rows[0];

    // Log UPDATE_USER activity
    const { ip, userAgent } = getClientDetails(request);
    await logActivity(
      caller.employee_no,
      'UPDATE_USER',
      `Memperbarui user: ${origUser.name} (${origUser.employee_no}) -> ${name} (${employee_no}), role: ${role}`,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('PUT /api/users/:id Error:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Gagal memperbarui user' }, { status: 500 });
  }
}

// DELETE /api/users/:id - Delete a user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const caller = await getSessionUser(request);
    if (!caller || caller.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Akses ditolak: Hanya Admin' }, { status: 403 });
    }

    const { id } = await params;

    // Get user details for logging prior to deletion
    const checkUser = await query('SELECT name, employee_no FROM users WHERE id = $1', [id]);
    if (checkUser.rowCount === 0) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }
    const deletedUser = checkUser.rows[0];

    // Prevent deleting oneself
    if (deletedUser.employee_no === caller.employee_no) {
      return NextResponse.json({ success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri' }, { status: 400 });
    }

    await query('DELETE FROM users WHERE id = $1', [id]);

    // Log DELETE_USER activity
    const { ip, userAgent } = getClientDetails(request);
    await logActivity(
      caller.employee_no,
      'DELETE_USER',
      `Menghapus user: ${deletedUser.name} (${deletedUser.employee_no})`,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error: any) {
    console.error('DELETE /api/users/:id Error:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Gagal menghapus user' }, { status: 500 });
  }
}
