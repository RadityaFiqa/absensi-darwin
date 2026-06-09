import { query } from './db';

/**
 * Inserts a record into the activity_logs table
 */
export async function logActivity(
  employeeNo: string,
  action: string,
  description: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<void> {
  try {
    await query(
      `INSERT INTO activity_logs (employee_no, action, description, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [employeeNo, action, description, ipAddress || null, userAgent || null]
    );
  } catch (error) {
    console.error(`Failed to log activity for employee ${employeeNo}:`, error);
  }
}

/**
 * Helper to parse Client IP Address and User-Agent from Next.js request headers
 */
export function getClientDetails(request: Request) {
  const headers = request.headers;
  const userAgent = headers.get('user-agent') || 'Unknown User-Agent';

  // Read IP headers
  let ip = headers.get('x-forwarded-for') || headers.get('x-real-ip') || '127.0.0.1';
  if (ip && ip.includes(',')) {
    // If comma-separated list, take client IP which is the first one
    ip = ip.split(',')[0].trim();
  }

  return { ip, userAgent };
}
