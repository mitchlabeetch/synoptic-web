// src/lib/auth/jwt.ts
// PURPOSE: JWT-based authentication for the application
// ACTION: Creates, verifies, and manages JWT tokens for user sessions
// MECHANISM: Uses jose library for JWT operations with HS256 signing

import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'synoptic-default-secret-change-in-production'
);

const JWT_ISSUER = 'synoptic';
const JWT_AUDIENCE = 'synoptic-web';
const TOKEN_EXPIRY = '7d'; // 7 days
const COOKIE_NAME = 'synoptic-auth';

export interface UserTokenPayload extends JWTPayload {
  sub: string; // User ID
  email: string;
  name?: string;
  tier?: string;
}

/**
 * Create a signed JWT token for a user
 */
export async function createToken(user: {
  id: string;
  email: string;
  name?: string;
  tier?: string;
}): Promise<string> {
  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    tier: user.tier || 'free',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setSubject(user.id)
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
  
  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<UserTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    
    return payload as UserTokenPayload;
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return null;
  }
}

/**
 * Get current user from cookies (server-side)
 */
export async function getCurrentUser(): Promise<UserTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}

/**
 * Set auth cookie (server-side)
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Clear auth cookie (server-side)
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Extract user ID from token payload
 */
export function getUserId(payload: UserTokenPayload): string {
  return payload.sub!;
}

export { COOKIE_NAME };
