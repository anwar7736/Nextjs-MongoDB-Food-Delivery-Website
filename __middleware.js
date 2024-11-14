import { NextResponse } from 'next/server';
import { isRestaurantAuth } from './app/helpers/helper';

export function middleware(request) {
  // Check the cookies for the auth_token
  const token = request.cookies.get('restaurant_auth')?.value;

  // Define protected routes (authenticated users only)
  const protectedPaths = ['/dashboard'];

  // Define guest-only routes (unauthenticated users only)
  const guestPaths = ['/restaurant'];

  // Authenticated users can only access protected paths
  if (protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path)) && !token) {
    // If no token and trying to access protected route, redirect to login
    return NextResponse.redirect(new URL('/restaurant', request.url));
  }

  // Unauthenticated users can only access guest paths
  if (guestPaths.some((path) => request.nextUrl.pathname.startsWith(path)) && token) {
    // If token is present and trying to access guest route, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If none of the conditions match, allow the request to continue
  return NextResponse.next();
}

export const config = {
  // Define which routes the middleware should run for
  matcher: ['/restaurant', '/restaurant/dashboard'],
};
