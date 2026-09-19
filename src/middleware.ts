import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('nstok_session')?.value;

  // Jika user sudah login (memiliki cookie sesi aktif) dan mencoba membuka halaman /login
  if (sessionCookie && pathname === '/login') {
    try {
      const session = JSON.parse(decodeURIComponent(sessionCookie));
      if (session && session.id) {
        // Cek apakah sesi masih berlaku
        if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
          // Jika sesi sudah kedaluwarsa, hapus cookie dan biarkan user membuka /login
          const response = NextResponse.next();
          response.cookies.delete('nstok_session');
          return response;
        }

        // Jika belum selesai onboarding, arahkan ke /business-select
        if (!session.hasCompletedOnboarding) {
          return NextResponse.redirect(new URL('/business-select', request.url));
        }

        // User sudah login dan onboarded, cegah akses /login dan alihkan langsung ke POS
        return NextResponse.redirect(new URL('/pos', request.url));
      }
    } catch (e) {
      // Jika cookie tidak valid/rusak, biarkan akses halaman /login
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login'],
};
