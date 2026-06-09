import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';

// GET /api/admin/stats - Admin Dashboard stats
export async function GET(request: Request) {
  try {
    const caller = await getSessionUser(request);
    if (!caller || caller.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Akses ditolak: Hanya Admin' }, { status: 403 });
    }

    // Query User statistics
    const usersRes = await query(
      `SELECT
         COUNT(*) as total,
         COUNT(CASE WHEN is_active = true THEN 1 END) as active
       FROM users`
    );
    const usersStats = usersRes.rows[0];

    // Query Location statistics
    const locationsRes = await query(
      `SELECT
         COUNT(*) as total,
         COUNT(CASE WHEN is_active = true THEN 1 END) as active
       FROM locations`
    );
    const locationsStats = locationsRes.rows[0];

    // Query Today's Checkins statistics
    const checkinsRes = await query(
      `SELECT
         COUNT(CASE WHEN action = 'CLOCK_IN' THEN 1 END) as clock_in,
         COUNT(CASE WHEN action = 'CLOCK_OUT' THEN 1 END) as clock_out
       FROM activity_logs
       WHERE created_at >= CURRENT_DATE AND created_at < CURRENT_DATE + 1`
    );
    const checkinsStats = checkinsRes.rows[0];

    // Query recent 5 logs
    const logsRes = await query(
      `SELECT l.*, u.name as user_name
       FROM activity_logs l
       LEFT JOIN users u ON l.employee_no = u.employee_no
       ORDER BY l.created_at DESC
       LIMIT 5`
    );

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: parseInt(usersStats.total || '0', 10),
          active: parseInt(usersStats.active || '0', 10),
        },
        locations: {
          total: parseInt(locationsStats.total || '0', 10),
          active: parseInt(locationsStats.active || '0', 10),
        },
        attendance: {
          clockIn: parseInt(checkinsStats.clock_in || '0', 10),
          clockOut: parseInt(checkinsStats.clock_out || '0', 10),
        },
      },
      recentLogs: logsRes.rows,
    });
  } catch (error: any) {
    console.error('GET /api/admin/stats Error:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Gagal mengambil stats admin' }, { status: 500 });
  }
}
