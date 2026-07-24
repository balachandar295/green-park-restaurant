import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public paths
  if (path === '/' || path.startsWith('/login') || path.startsWith('/receipt/')) {
    return NextResponse.next();
  }

  // Get user role from cookie or header (set during login)
  const roleCookie = request.cookies.get('gp_user_role')?.value;

  if (!roleCookie) {
    // Redirect to login if unauthenticated
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // Role Protection
  if (path.startsWith('/admin') && roleCookie !== 'admin') {
    return NextResponse.redirect(new URL(`/${roleCookie}`, request.url));
  }
  if (path.startsWith('/waiter') && roleCookie !== 'waiter' && roleCookie !== 'admin') {
    return NextResponse.redirect(new URL(`/${roleCookie}`, request.url));
  }
  if (path.startsWith('/kitchen') && roleCookie !== 'kitchen' && roleCookie !== 'admin') {
    return NextResponse.redirect(new URL(`/${roleCookie}`, request.url));
  }
  if (path.startsWith('/cashier') && roleCookie !== 'cashier' && roleCookie !== 'admin') {
    return NextResponse.redirect(new URL(`/${roleCookie}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/waiter/:path*', '/kitchen/:path*', '/cashier/:path*'],
};
