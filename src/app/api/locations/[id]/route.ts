import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';
import { logActivity, getClientDetails } from '@/lib/logger';

// GET /api/locations/:id - View details of a location
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const caller = await getSessionUser(request);
    if (!caller) {
      return NextResponse.json({ success: false, message: 'Sesi tidak valid' }, { status: 401 });
    }

    const { id } = await params;
    const dbRes = await query('SELECT * FROM locations WHERE id = $1', [id]);

    if (dbRes.rowCount === 0) {
      return NextResponse.json({ success: false, message: 'Lokasi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, location: dbRes.rows[0] });
  } catch (error: any) {
    console.error('GET /api/locations/:id Error:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Gagal mengambil data lokasi' }, { status: 500 });
  }
}

// PUT /api/locations/:id - Update location details
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
    const { name, address, latitude, longitude, is_active } = body;

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ success: false, message: 'Nama, latitude, dan longitude wajib diisi' }, { status: 400 });
    }

    // Find original details for logging comparison
    const originalRes = await query('SELECT name, latitude, longitude FROM locations WHERE id = $1', [id]);
    if (originalRes.rowCount === 0) {
      return NextResponse.json({ success: false, message: 'Lokasi tidak ditemukan' }, { status: 404 });
    }
    const origLoc = originalRes.rows[0];

    const dbRes = await query(
      `UPDATE locations
       SET name = $1, address = $2, latitude = $3, longitude = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        name,
        address || '',
        parseFloat(latitude),
        parseFloat(longitude),
        is_active,
        id,
      ]
    );

    const updatedLocation = dbRes.rows[0];

    // Log UPDATE_LOCATION activity
    const { ip, userAgent } = getClientDetails(request);
    await logActivity(
      caller.employee_no,
      'UPDATE_LOCATION',
      `Memperbarui lokasi: ${origLoc.name} (${origLoc.latitude}, ${origLoc.longitude}) -> ${name} (${latitude}, ${longitude})`,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true, location: updatedLocation });
  } catch (error: any) {
    console.error('PUT /api/locations/:id Error:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Gagal memperbarui lokasi' }, { status: 500 });
  }
}

// DELETE /api/locations/:id - Delete a location
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

    // Find details for logging before deleting
    const checkLoc = await query('SELECT name FROM locations WHERE id = $1', [id]);
    if (checkLoc.rowCount === 0) {
      return NextResponse.json({ success: false, message: 'Lokasi tidak ditemukan' }, { status: 404 });
    }
    const deletedLocation = checkLoc.rows[0];

    await query('DELETE FROM locations WHERE id = $1', [id]);

    // Log DELETE_LOCATION activity
    const { ip, userAgent } = getClientDetails(request);
    await logActivity(
      caller.employee_no,
      'DELETE_LOCATION',
      `Menghapus lokasi: ${deletedLocation.name}`,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true, message: 'Lokasi berhasil dihapus' });
  } catch (error: any) {
    console.error('DELETE /api/locations/:id Error:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Gagal menghapus lokasi' }, { status: 500 });
  }
}
