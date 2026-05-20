import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('absensi_token')?.value || request.cookies.get('token_absensi')?.value;
  const { pathname } = request.nextUrl;

  // Paths requiring authentication
  const isProtectedPath =
    pathname === '/' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/selfie') ||
    pathname.startsWith('/confirm');

  // Paths for unauthenticated users only
  const isAuthPath = pathname.startsWith('/login');

  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && token) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*', '/selfie/:path*', '/confirm/:path*'],
};
