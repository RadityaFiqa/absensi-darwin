import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';

// GET /api/users/settings - Get settings of logged-in user
export async function GET(request: Request) {
  try {
    const caller = await getSessionUser(request);
    if (!caller) {
      return NextResponse.json({ success: false, message: 'Sesi tidak valid' }, { status: 401 });
    }

    const dbRes = await query(
      `SELECT cutoff_clockin, cutoff_checkout, auto_attendance, 
              (default_image IS NOT NULL AND default_image != '') as has_image 
       FROM users WHERE id = $1`,
      [caller.id]
    );

    if (dbRes.rowCount === 0) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }

    const settings = dbRes.rows[0];
    return NextResponse.json({
      success: true,
      settings: {
        cutoff_clockin: settings.cutoff_clockin || '07:30',
        cutoff_checkout: settings.cutoff_checkout || '17:00',
        auto_attendance: settings.auto_attendance || false,
        has_image: settings.has_image || false
      }
    });
  } catch (error: any) {
    console.error('GET /api/users/settings Error:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Gagal mengambil settings' }, { status: 500 });
  }
}

// POST /api/users/settings - Update settings of logged-in user
export async function POST(request: Request) {
  try {
    const caller = await getSessionUser(request);
    if (!caller) {
      return NextResponse.json({ success: false, message: 'Sesi tidak valid' }, { status: 401 });
    }

    const body = await request.json();
    const { cutoff_clockin, cutoff_checkout, auto_attendance, default_image } = body;

    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (cutoff_clockin !== undefined) {
      fields.push(`cutoff_clockin = $${paramIndex++}`);
      params.push(cutoff_clockin);
    }
    if (cutoff_checkout !== undefined) {
      fields.push(`cutoff_checkout = $${paramIndex++}`);
      params.push(cutoff_checkout);
    }
    if (auto_attendance !== undefined) {
      fields.push(`auto_attendance = $${paramIndex++}`);
      params.push(auto_attendance);
    }
    if (default_image !== undefined) {
      fields.push(`default_image = $${paramIndex++}`);
      params.push(default_image);
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, message: 'Tidak ada data yang diupdate' }, { status: 400 });
    }

    params.push(caller.id);
    await query(
      `UPDATE users 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramIndex}`,
      params
    );

    // Return the updated settings summary
    const checkRes = await query(
      `SELECT cutoff_clockin, cutoff_checkout, auto_attendance, 
              (default_image IS NOT NULL AND default_image != '') as has_image 
       FROM users WHERE id = $1`,
      [caller.id]
    );
    const updatedSettings = checkRes.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Pengaturan berhasil diperbarui',
      settings: {
        cutoff_clockin: updatedSettings.cutoff_clockin || '07:30',
        cutoff_checkout: updatedSettings.cutoff_checkout || '17:00',
        auto_attendance: updatedSettings.auto_attendance || false,
        has_image: updatedSettings.has_image || false
      }
    });
  } catch (error: any) {
    console.error('POST /api/users/settings Error:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Gagal memperbarui settings' }, { status: 500 });
  }
}
