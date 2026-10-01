import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth session refresh on high-frequency media proxy & playback endpoints
  if (
    pathname.startsWith('/api/stream-proxy') ||
    pathname.startsWith('/api/gdrive-stream') ||
    pathname.startsWith('/api/downloads') ||
    pathname.startsWith('/api/playback')
  ) {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const hasAdminCookie = request.cookies.get('silaflix_admin_session')?.value === 'true';

  if (isAdminRoute && !user && !hasAdminCookie) {
    const loginUrl = new URL('/admin-login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif)$).*)',
  ],
};
