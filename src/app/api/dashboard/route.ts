import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ status: 0, error: 'Token is required' }, { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_API_BASE || 'https://insantangguh-bulog.darwinbox.com';
    const targetUrl = `${base}/attendance/AttendanceMobileApi/DashboardClockinCheckin`;

    const response = await axios.post(
      targetUrl,
      { token },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('API Dashboard Proxy Error:', error.message);
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { error: error.message || 'Terjadi kesalahan pada server proxy' };
    return NextResponse.json(errorData, { status });
  }
}
