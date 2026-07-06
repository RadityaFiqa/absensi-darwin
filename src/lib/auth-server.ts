import axios from 'axios';
import { query } from './db';

export interface DarwinboxUser {
  employee_no: string;
  name: string;
  email: string;
  department: string;
  designation: string;
}

export interface LocalUser extends DarwinboxUser {
  id: number;
  role: 'ADMIN' | 'SUPERVISOR' | 'EMPLOYEE';
  is_active: boolean;
  default_image?: string | null;
  cutoff_clockin?: string;
  cutoff_checkout?: string;
  auto_attendance?: boolean;
}

/**
 * Custom error class representing a Forbidden action (e.g. user inactive or unregistered)
 */
export class AuthForbiddenError extends Error {
  statusCode: number;
  employee_no?: string;

  constructor(message: string, employee_no?: string) {
    super(message);
    this.name = 'AuthForbiddenError';
    this.statusCode = 403;
    this.employee_no = employee_no;
  }
}

/**
 * Validates a token and UDID with Darwinbox, and checks local database registration.
 * Updates local database user details automatically on success.
 */
export async function validateAndSyncUser(token: string, udid: string): Promise<LocalUser> {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'https://insantangguh-bulog.darwinbox.com';
  const targetUrl = `${base}/Mobileapi/index`;

  if (!token) {
    throw new Error('Token is required');
  }

  try {
    const response = await axios.post(
      targetUrl,
      { token, UDID: udid },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const data = response.data;
    if (!data || data.status !== 1 || !data.user_details) {
      const errMsg = data?.message || data?.error || 'Darwinbox authentication failed';
      throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    }

    const details: DarwinboxUser = data.user_details;
    const { employee_no, name, email, department, designation } = details;

    // Search local database
    const dbRes = await query(
      'SELECT id, employee_no, name, email, department, designation, role, is_active, default_image, cutoff_clockin, cutoff_checkout, auto_attendance FROM users WHERE employee_no = $1',
      [employee_no]
    );

    if (dbRes.rowCount === 0) {
      throw new AuthForbiddenError('User tidak terdaftar atau tidak aktif', employee_no);
    }

    const localUser: LocalUser = dbRes.rows[0];
    if (!localUser.is_active) {
      throw new AuthForbiddenError('User tidak terdaftar atau tidak aktif', employee_no);
    }

    // Update/Sync local user data with Darwinbox details
    await query(
      `UPDATE users 
       SET name = $1, email = $2, department = $3, designation = $4, updated_at = CURRENT_TIMESTAMP
       WHERE employee_no = $5`,
      [name, email, department, designation, employee_no]
    );

    return {
      ...localUser,
      name,
      email,
      department,
      designation,
    };
  } catch (error: any) {
    if (error instanceof AuthForbiddenError) {
      throw error;
    }
    // Handle standard network error or timeout
    console.error('validateAndSyncUser Error:', error.message);
    throw error;
  }
}

/**
 * Standard utility to parse session and resolve current user context from incoming NextRequest headers
 */
export async function getSessionUser(request: Request): Promise<LocalUser | null> {
  const authHeader = request.headers.get('authorization');
  const udid = request.headers.get('x-udid') || '';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    return await validateAndSyncUser(token, udid);
  } catch (err) {
    console.error('getSessionUser Error:', err);
    return null;
  }
}
