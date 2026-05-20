import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, image } = body;

    if (!token || !image) {
      return NextResponse.json({ status: 0, error: 'Token and image are required' }, { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_API_BASE || 'https://insantangguh-bulog.darwinbox.com';
    const targetUrl = `${base}/attendance/attendanceMobileApi/verifyFace`;

    const response = await axios.post(
      targetUrl,
      { token, image },
      {
        headers: { 'Content-Type': 'application/json' },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 45000, // Face verification might take longer to process image
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('API Face Verification Proxy Error:', error.message);
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { error: error.message || 'Terjadi kesalahan pada server proxy' };
    return NextResponse.json(errorData, { status });
  }
}
