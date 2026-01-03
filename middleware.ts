// middleware.ts
// PURPOSE: Handle authentication, route protection, and security headers
// ACTION: Verifies JWT tokens, protects authenticated routes, adds security headers
// MECHANISM: Uses jose for JWT verification in Edge runtime

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// SECURITY: Fail loudly if JWT_SECRET is not configured
// No fallback - this is intentional to prevent running with a known secret
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      '[FATAL] JWT_SECRET environment variable is not set. ' +
      'Application cannot start securely without a cryptographic secret.'
    );
  }
  return new TextEncoder().encode(secret);
}

const COOKIE_NAME = 'synoptic-auth';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/editor'];

// Routes that should redirect to dashboard if already logged in
const AUTH_ROUTES = ['/auth/login'];

/**
 * Add security headers to response
 * These protect against XSS, clickjacking, MIME sniffing, and more
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  const isDev = process.env.NODE_ENV === 'development';
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection for older browsers
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy - don't leak full URLs
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS - force HTTPS in production
  if (!isDev) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // Permissions Policy - disable unnecessary features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  // Content Security Policy - prevent XSS and injection attacks
  // Note: This is a baseline CSP. Adjust based on your needs.
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self'${isDev ? " 'unsafe-eval' 'unsafe-inline'" : " 'unsafe-inline'"}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://api.languagetool.org https://libretranslate.com https://*.wiktionary.org https://api.dictionaryapi.dev" + (isDev ? ' ws://localhost:* http://localhost:*' : ''),
    "media-src 'self' blob:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];
  
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
  
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get JWT secret (will throw if not configured)
  const JWT_SECRET = getJwtSecret();
  
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
    const response = NextResponse.redirect(loginUrl);
    return addSecurityHeaders(response);
  }
  
  // Check if accessing auth routes while already authenticated
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));
  if (isAuthRoute && isAuthenticated) {
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    return addSecurityHeaders(response);
  }
  
  // Continue with security headers added
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     * - api/webhooks (explicitly excluded to prevent auth failures on payment callbacks)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|api/webhooks/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

