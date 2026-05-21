import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { latlng, verification_id, in_out, location_type, location, message, udid, token, checkin_id } = body;

    if (!token || !verification_id) {
      return NextResponse.json({ status: 0, error: 'Token and verification_id are required' }, { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_API_BASE || 'https://insantangguh-bulog.darwinbox.com';
    const targetUrl = `${base}/Mobileapi/CheckInPost`;

    const response = await axios.post(
      targetUrl,
      { latlng, verification_id, in_out, location_type, location, message, udid, token, checkin_id },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('API CheckIn Proxy Error:', error.message);
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { error: error.message || 'Terjadi kesalahan pada server proxy' };
    return NextResponse.json(errorData, { status });
  }
}
