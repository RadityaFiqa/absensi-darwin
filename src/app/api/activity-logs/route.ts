import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';

// GET /api/activity-logs - Get paginated logs for Admin
export async function GET(request: Request) {
  try {
    const caller = await getSessionUser(request);
    if (!caller || caller.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Akses ditolak: Hanya Admin' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const employeeNo = searchParams.get('employee_no') || null;
    const action = searchParams.get('action') || null;
    const startDate = searchParams.get('startDate') || null;
    const endDate = searchParams.get('endDate') || null;

    // Build conditional query filters
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (employeeNo) {
      conditions.push(`l.employee_no = $${paramIndex}`);
      params.push(employeeNo);
      paramIndex++;
    }

    if (action) {
      conditions.push(`l.action = $${paramIndex}`);
      params.push(action);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`l.created_at >= $${paramIndex}::timestamp`);
      params.push(`${startDate} 00:00:00`);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`l.created_at <= $${paramIndex}::timestamp`);
      params.push(`${endDate} 23:59:59`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matched records for pagination headers
    const countRes = await query(
      `SELECT COUNT(*) FROM activity_logs l ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    // Query logs
    const dataParams = [...params, limit, offset];
    const dataRes = await query(
      `SELECT l.*, u.name as user_name
       FROM activity_logs l
       LEFT JOIN users u ON l.employee_no = u.employee_no
       ${whereClause}
       ORDER BY l.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    );

    return NextResponse.json({
      success: true,
      logs: dataRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('GET /api/activity-logs Error:', error.message);
    return NextResponse.json({ success: false, message: error.message || 'Gagal mengambil log aktivitas' }, { status: 500 });
  }
}
