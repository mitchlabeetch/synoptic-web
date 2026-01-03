// src/app/api/auth/reset-password/route.ts
// PURPOSE: Reset password using a valid token
// ACTION: Validates token, updates password, invalidates token
// MECHANISM: Uses bcrypt for password hashing, atomic token consumption

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { RateLimiters, getRateLimitHeaders, getClientIP } from '@/lib/security/rate-limit';
import { AuditLog } from '@/lib/security/audit';
import {
  validatePasswordResetToken,
  consumePasswordResetToken,
  updateUserPassword,
} from '@/lib/auth/passwordReset';

const ResetPasswordSchema = z.object({
  token: z.string().min(32).max(128),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// GET: Validate token (for UI to check before showing form)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ valid: false, error: 'Missing token' }, { status: 400 });
  }

  try {
    const result = await validatePasswordResetToken(token);
    
    if (!result) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Token is invalid or has expired' 
      });
    }

    return NextResponse.json({ 
      valid: true,
      email: result.email,
    });
  } catch (error) {
    console.error('[Reset Password] Token validation error:', error);
    return NextResponse.json({ valid: false, error: 'Validation failed' }, { status: 500 });
  }
}

// POST: Actually reset the password
export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  
  try {
    // 1. Rate limit by IP
    const rateLimit = RateLimiters.login(ip);
    if (!rateLimit.allowed) {
      AuditLog.rateLimitExceeded(ip, ip, '/api/auth/reset-password');
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 2. Validate request body
    const body = await request.json();
    const validation = ResetPasswordSchema.safeParse(body);
    
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // 3. Validate the token
    const tokenResult = await validatePasswordResetToken(token);
    
    if (!tokenResult) {
      AuditLog.passwordResetFailed(ip, 'Invalid or expired token');
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // 4. Hash the new password
    const passwordHash = await hash(password, 12);

    // 5. Update password and consume token atomically
    await updateUserPassword(tokenResult.userId, passwordHash);
    await consumePasswordResetToken(token);

    // 6. Log successful reset
    AuditLog.passwordResetSuccess(tokenResult.userId, tokenResult.email, ip);
    console.log(`[Password Reset] Successfully reset password for: ${tokenResult.email}`);

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in with your new password.',
    });

  } catch (error) {
    console.error('[Reset Password] Error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
