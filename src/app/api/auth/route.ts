import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { qrcode } = body;

    const base = process.env.NEXT_PUBLIC_API_BASE || 'https://insantangguh-bulog.darwinbox.com';
    const targetUrl = `${base}/Mobileapi/auth`;

    const response = await axios.post(
      targetUrl,
      { qrcode },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('API Auth Proxy Error:', error.message);
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { error: error.message || 'Terjadi kesalahan pada server proxy' };
    return NextResponse.json(errorData, { status });
  }
}
