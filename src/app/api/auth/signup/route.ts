// src/app/api/auth/signup/route.ts
// PURPOSE: Handle new user registration
// ACTION: Creates user account with hashed password
// MECHANISM: Rate limits, validates input strongly, hashes password with bcrypt, inserts into database

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/client';
import { createToken, setAuthCookie } from '@/lib/auth/jwt';
import { hashPassword } from '@/lib/security/password';
import { RateLimiters, getClientIP, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { AuditLog } from '@/lib/security/audit';
import { SignupRequestSchema } from '@/lib/security/validation';

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  
  try {
    // 1. Rate limiting - prevent mass account creation
    const rateLimit = RateLimiters.signup(ip);
    if (!rateLimit.allowed) {
      AuditLog.rateLimitExceeded(ip, ip, '/api/auth/signup');
      
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    // 2. Validate and parse request body with strong password requirements
    const body = await request.json();
    const validationResult = SignupRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      // Extract user-friendly error message
      const errorMessage = validationResult.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }
    
    const { email, password, name } = validationResult.data;

    // 3. Check if user already exists
    const existingUser = await query(
      'SELECT id FROM profiles WHERE email = $1',
      [email] // Already normalized by schema
    );

    if (existingUser.rows.length > 0) {
      // Don't reveal whether email exists - use generic message
      // This prevents email enumeration attacks
      return NextResponse.json(
        { error: 'Unable to create account. Please try a different email.' },
        { status: 409 }
      );
    }

    // 4. Hash password with bcrypt (cost factor is environment-aware)
    const passwordHash = await hashPassword(password);

    // 5. Create user
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const displayName = name || email.split('@')[0];

    await query(
      `INSERT INTO profiles (id, email, name, password_hash, tier, ai_credits_used, ai_credits_limit, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        email,
        displayName,
        passwordHash,
        'free',
        0,
        100, // Free tier limit
        now,
        now,
      ]
    );

    // 6. Log successful signup
    AuditLog.signup(userId, email, ip);

    // 7. Create JWT token
    const token = await createToken({
      id: userId,
      email,
      name: displayName,
      tier: 'free',
    });

    // 8. Set auth cookie
    await setAuthCookie(token);

    // 9. Return success response
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name: displayName,
        tier: 'free',
      },
    });
    
  } catch (error: unknown) {
    console.error('[Auth Signup Error]', error);
    
    // Never expose internal error details
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}

