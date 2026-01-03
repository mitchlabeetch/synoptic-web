// src/app/api/auth/login/route.ts
// PURPOSE: Handle user login
// ACTION: Validates credentials and returns JWT token
// MECHANISM: Rate limits, validates input, checks password hash, creates signed JWT

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/client';
import { createToken, setAuthCookie } from '@/lib/auth/jwt';
import { verifyPassword, timingAttackMitigation } from '@/lib/security/password';
import { RateLimiters, getClientIP, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { AuditLog, extractRequestContext } from '@/lib/security/audit';
import { LoginRequestSchema } from '@/lib/security/validation';

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const requestContext = extractRequestContext(request);
  
  try {
    // 1. Rate limiting - prevent brute force attacks
    const rateLimit = RateLimiters.login(ip);
    if (!rateLimit.allowed) {
      AuditLog.rateLimitExceeded(ip, ip, '/api/auth/login');
      
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    // 2. Validate and parse request body
    const body = await request.json();
    const validationResult = LoginRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      AuditLog.loginFailure(body.email || 'unknown', ip, 'Invalid request format');
      return NextResponse.json(
        { error: 'Invalid email or password format' },
        { status: 400 }
      );
    }
    
    const { email, password } = validationResult.data;

    // 3. Find user by email (email already normalized by schema)
    const result = await query(
      'SELECT id, email, name, password_hash, tier FROM profiles WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      // Use constant-time comparison even for non-existent users
      // to prevent timing attacks that reveal user existence
      await timingAttackMitigation(password);
      
      AuditLog.loginFailure(email, ip, 'User not found');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 4. Verify password with bcrypt
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      AuditLog.loginFailure(email, ip, 'Invalid password');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 5. Get preferred locale
    const profileResult = await query(
      'SELECT preferred_locale FROM profiles WHERE id = $1',
      [user.id]
    );
    const preferredLocale = profileResult.rows[0]?.preferred_locale || 'en';

    // 6. Create JWT token
    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
    });

    // 7. Set auth cookie
    await setAuthCookie(token);

    // 8. Log successful login
    AuditLog.loginSuccess(user.id, ip, requestContext.userAgent);

    // 9. Build response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
      },
    });

    // Set locale cookie
    response.cookies.set('NEXT_LOCALE', preferredLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    });

    return response;

  } catch (error: unknown) {
    console.error('[Auth Login Error]', error);
    
    // Never expose internal error details
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    );
  }
}

