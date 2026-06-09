import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';
import { logActivity, getClientDetails } from '@/lib/logger';

// GET /api/users - List users with optional search and filters
export async function GET(request: Request) {
  try {
    const caller = await getSessionUser(request);
    if (!caller || caller.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Akses ditolak: Hanya Admin' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ? `%${searchParams.get('search')}%` : null;
    const role = searchParams.get('role') || null;
    const isActiveParam = searchParams.get('is_active');
    const isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : null;

    const dbRes = await query(
      `SELECT id, employee_no, name, email, department, designation, role, is_active, created_at, updated_at
       FROM users
       WHERE ($1::text IS NULL OR name ILIKE $1 OR employee_no ILIKE $1)
         AND ($2::text IS NULL OR role = $2)
         AND ($3::boolean IS NULL OR is_active = $3)
       ORDER BY created_at DESC`,
      [search, role, isActive]
    );

    return NextResponse.json({ success: true, users: dbRes.rows });
  } catch (error: any) {
    console.error('GET /api/users Error:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Gagal mengambil data user' }, { status: 500 });
  }
}

// POST /api/users - Create new user
export async function POST(request: Request) {
  try {
    const caller = await getSessionUser(request);
    if (!caller || caller.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Akses ditolak: Hanya Admin' }, { status: 403 });
    }

    const body = await request.json();
    const { employee_no, name, email, department, designation, role, is_active } = body;

    if (!employee_no || !name || !email) {
      return NextResponse.json({ success: false, message: 'Kolom employee_no, name, dan email wajib diisi' }, { status: 400 });
    }

    // Check if user already exists
    const checkUser = await query('SELECT id FROM users WHERE employee_no = $1', [employee_no]);
    if (checkUser.rowCount && checkUser.rowCount > 0) {
      return NextResponse.json({ success: false, message: `User dengan Employee No ${employee_no} sudah terdaftar` }, { status: 409 });
    }

    const dbRes = await query(
      `INSERT INTO users (employee_no, name, email, department, designation, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        employee_no,
        name,
        email,
        department || '',
        designation || '',
        role || 'EMPLOYEE',
        is_active !== undefined ? is_active : true,
      ]
    );

    const newUser = dbRes.rows[0];

    // Log CREATE_USER activity
    const { ip, userAgent } = getClientDetails(request);
    await logActivity(
      caller.employee_no,
      'CREATE_USER',
      `Membuat user baru: ${name} (${employee_no}) dengan role ${role || 'EMPLOYEE'}`,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true, user: newUser }, { status: 211 }); // Let's return 201 Created (using standard JSON)
  } catch (error: any) {
    console.error('POST /api/users Error:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Gagal membuat user baru' }, { status: 500 });
  }
}
