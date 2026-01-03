// src/app/api/auth/signup/route.ts
// PURPOSE: Handle new user registration
// ACTION: Creates user account with hashed password, sends verification email
// MECHANISM: Rate limits, validates input strongly, hashes password with bcrypt, sends verification email

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/client';
import { createToken, setAuthCookie } from '@/lib/auth/jwt';
import { hashPassword } from '@/lib/security/password';
import { RateLimiters, getClientIP, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { AuditLog } from '@/lib/security/audit';
import { SignupRequestSchema } from '@/lib/security/validation';
import { createVerificationToken } from '@/lib/auth/verification';
import { sendVerificationEmail } from '@/lib/email/resend';

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

    // 5. Create user with email_verified = false
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const displayName = name || email.split('@')[0];

    await query(
      `INSERT INTO profiles (id, email, name, password_hash, tier, ai_credits_used, ai_credits_limit, email_verified, auth_provider, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        userId,
        email,
        displayName,
        passwordHash,
        'free',
        0,
        100, // Free tier limit
        false, // Email not verified yet
        'email', // Auth provider is email
        now,
        now,
      ]
    );

    // 6. Create verification token and send email
    try {
      const verificationToken = await createVerificationToken(userId, email);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getsynoptic.com';
      const verifyUrl = `${appUrl}/api/auth/verify-email?token=${verificationToken}`;
      
      const emailResult = await sendVerificationEmail(email, displayName, verifyUrl);
      
      if (emailResult.success) {
        console.log(`[Signup] Verification email sent to ${email}, ID: ${emailResult.id}`);
      } else {
        // Log error but don't fail signup - user can request resend
        console.error(`[Signup] Failed to send verification email: ${emailResult.error}`);
      }
    } catch (emailError) {
      // Log but don't fail the signup
      console.error('[Signup] Error sending verification email:', emailError);
    }

    // 7. Log successful signup
    AuditLog.signup(userId, email, ip);

    // 8. Create JWT token (user can login but will see verification reminder)
    const token = await createToken({
      id: userId,
      email,
      name: displayName,
      tier: 'free',
    });

    // 9. Set auth cookie
    await setAuthCookie(token);

    // 10. Return success response with email_verified status
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name: displayName,
        tier: 'free',
        email_verified: false,
      },
      message: 'Account created. Please check your email to verify your account.',
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
