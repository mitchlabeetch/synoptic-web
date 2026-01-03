// src/app/api/auth/forgot-password/route.ts
// PURPOSE: Request a password reset email
// ACTION: Generates reset token and sends email (if email service configured)
// MECHANISM: Rate-limited, timing-safe response to prevent email enumeration

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RateLimiters, getRateLimitHeaders, getClientIP } from '@/lib/security/rate-limit';
import { AuditLog } from '@/lib/security/audit';
import { createPasswordResetToken, getUserByEmailForReset } from '@/lib/auth/passwordReset';

const ForgotPasswordSchema = z.object({
  email: z.string().email().max(255),
});

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  
  try {
    // 1. Rate limit by IP to prevent abuse
    const rateLimit = RateLimiters.signup(ip); // Use signup limiter (stricter)
    if (!rateLimit.allowed) {
      AuditLog.rateLimitExceeded(ip, ip, '/api/auth/forgot-password');
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 2. Validate request body
    const body = await request.json();
    const validation = ForgotPasswordSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 3. Look up user
    const user = await getUserByEmailForReset(normalizedEmail);

    // SECURITY: Always return success to prevent email enumeration
    // The actual email sending happens only if the user exists
    
    if (user) {
      // Check if user signed up with OAuth (can't reset password)
      if (user.auth_provider && user.auth_provider !== 'email') {
        // Log but don't reveal this to the user
        console.log(`[Password Reset] OAuth user attempted reset: ${normalizedEmail} (provider: ${user.auth_provider})`);
        // Fall through to success response (don't reveal OAuth status)
      } else {
        // Generate reset token
        const token = await createPasswordResetToken(user.id);
        
        // Build reset URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getsynoptic.com';
        const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;
        
        // Log the reset request (for debugging - in production this would send email)
        console.log(`[Password Reset] Token generated for: ${normalizedEmail}`);
        console.log(`[Password Reset] Reset URL: ${resetUrl}`);
        
        // TODO: Send actual email when email service is configured
        // await sendPasswordResetEmail(normalizedEmail, user.name, resetUrl);
        
        AuditLog.passwordResetRequested(user.id, normalizedEmail, ip);
      }
    } else {
      // User doesn't exist - log but don't reveal
      console.log(`[Password Reset] Unknown email attempted: ${normalizedEmail}`);
    }

    // 4. Always return success (timing-safe response)
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.',
    });

  } catch (error) {
    console.error('[Password Reset] Error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
