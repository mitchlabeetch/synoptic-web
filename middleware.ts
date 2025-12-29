// middleware.ts
// PURPOSE: Handle authentication and route protection
// ACTION: Verifies JWT tokens and protects authenticated routes
// MECHANISM: Uses jose for JWT verification in Edge runtime

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'synoptic-default-secret-change-in-production'
);

const COOKIE_NAME = 'synoptic-auth';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/editor'];

// Routes that should redirect to dashboard if already logged in
const AUTH_ROUTES = ['/auth/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get auth token from cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;
  let isAuthenticated = false;
  
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET, {
        issuer: 'synoptic',
        audience: 'synoptic-web',
      });
      isAuthenticated = true;
    } catch {
      // Token invalid or expired - will be treated as unauthenticated
      isAuthenticated = false;
    }
  }
  
  // Check if accessing protected route without authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Check if accessing auth routes while already authenticated
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
