// src/app/api/auth/resend-verification/route.ts
// PURPOSE: Handle resending email verification tokens
// ACTION: Creates new token, invalidates old one, sends email via Resend
// MECHANISM: Rate-limited to prevent abuse, sends email via Resend

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/client';
import { createVerificationToken } from '@/lib/auth/verification';
import { RateLimiters, getClientIP, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { AuditLog } from '@/lib/security/audit';
import { sendVerificationEmail } from '@/lib/email/resend';

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  try {
    // 1. Rate limiting - prevent email spam
    const rateLimit = RateLimiters.signup(ip); // Reuse signup limiter for resends
    if (!rateLimit.allowed) {
      AuditLog.rateLimitExceeded(ip, ip, '/api/auth/resend-verification');
      
      return NextResponse.json(
        { error: 'Too many requests. Please wait before requesting another email.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // 2. Find user by email
    const userResult = await query<{ id: string; email: string; email_verified: boolean; name: string | null }>(
      'SELECT id, email, email_verified, name FROM profiles WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal whether email exists - return success anyway
      // This prevents email enumeration attacks
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      });
    }

    const user = userResult.rows[0];

    // 3. Check if already verified
    if (user.email_verified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: 'Your email is already verified. You can log in.',
      });
    }

    // 4. Create new verification token (this invalidates any existing tokens)
    const token = await createVerificationToken(user.id, user.email);
    
    // 5. Construct verification URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getsynoptic.com';
    const verificationUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

    // 6. Send verification email via Resend
    const emailResult = await sendVerificationEmail(user.email, user.name, verificationUrl);

    if (!emailResult.success) {
      console.error('[Resend Verification] Failed to send email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`[Resend Verification] Email sent to ${user.email}, ID: ${emailResult.id}`);

    // 7. Log the resend
    AuditLog.verificationEmailResent(user.id, user.email, ip);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent! Please check your inbox and spam folder.',
      expiresInHours: 24, // Inform user of expiry
    });

  } catch (error) {
    console.error('[Resend Verification] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    );
  }
}
