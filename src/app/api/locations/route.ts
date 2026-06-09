import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';
import { logActivity, getClientDetails } from '@/lib/logger';

// GET /api/locations - List locations
export async function GET(request: Request) {
  try {
    const caller = await getSessionUser(request);
    if (!caller) {
      return NextResponse.json({ success: false, message: 'Sesi tidak valid' }, { status: 401 });
    }

    let dbRes;
    if (caller.role === 'ADMIN') {
      // Admins see all locations (active and inactive)
      dbRes = await query('SELECT * FROM locations ORDER BY id DESC');
    } else {
      // Normal employees only see active locations
      dbRes = await query('SELECT * FROM locations WHERE is_active = true ORDER BY name ASC');
    }

    return NextResponse.json({ success: true, locations: dbRes.rows });
  } catch (error: any) {
    console.error('GET /api/locations Error:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Gagal mengambil data lokasi' }, { status: 500 });
  }
}

// POST /api/locations - Create a new location
export async function POST(request: Request) {
  try {
    const caller = await getSessionUser(request);
    if (!caller || caller.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Akses ditolak: Hanya Admin' }, { status: 403 });
    }

    const body = await request.json();
    const { name, address, latitude, longitude, is_active } = body;

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ success: false, message: 'Nama, latitude, dan longitude wajib diisi' }, { status: 400 });
    }

    const dbRes = await query(
      `INSERT INTO locations (name, address, latitude, longitude, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        name,
        address || '',
        parseFloat(latitude),
        parseFloat(longitude),
        is_active !== undefined ? is_active : true,
      ]
    );

    const newLocation = dbRes.rows[0];

    // Log CREATE_LOCATION activity
    const { ip, userAgent } = getClientDetails(request);
    await logActivity(
      caller.employee_no,
      'CREATE_LOCATION',
      `Membuat lokasi baru: ${name} (${latitude}, ${longitude})`,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true, location: newLocation }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/locations Error:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Gagal membuat lokasi baru' }, { status: 500 });
  }
}
