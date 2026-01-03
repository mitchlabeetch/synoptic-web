// src/app/api/auth/verify-email/route.ts
// PURPOSE: Handle email verification token validation
// ACTION: Validates tokens, marks email as verified, handles expiry
// MECHANISM: Accepts token via query param, validates, provides graceful error handling

import { NextRequest, NextResponse } from 'next/server';
import { validateVerificationToken, markEmailVerified, getTokenExpiryInfo } from '@/lib/auth/verification';
import { AuditLog } from '@/lib/security/audit';
import { getClientIP } from '@/lib/security/rate-limit';

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/auth/verify-email?error=missing_token', request.url));
  }

  try {
    // Validate the token
    const result = await validateVerificationToken(token);

    if (!result) {
      // Token is invalid or expired
      console.log('[Email Verification] Invalid or expired token from IP:', ip);
      
      return NextResponse.redirect(
        new URL('/auth/verify-email?error=invalid_or_expired', request.url)
      );
    }

    // Mark email as verified
    await markEmailVerified(result.userId);
    
    // Log successful verification
    AuditLog.emailVerified(result.userId, result.email, ip);

    console.log('[Email Verification] Successfully verified email for user:', result.userId);

    // Redirect to success page
    return NextResponse.redirect(new URL('/auth/verify-email?success=true', request.url));

  } catch (error) {
    console.error('[Email Verification] Error:', error);
    return NextResponse.redirect(
      new URL('/auth/verify-email?error=server_error', request.url)
    );
  }
}

// POST endpoint for checking token status (AJAX)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const expiryInfo = await getTokenExpiryInfo(userId);

    return NextResponse.json({
      hasToken: expiryInfo.exists,
      isExpired: expiryInfo.isExpired,
      expiresAt: expiryInfo.expiresAt?.toISOString() || null,
    });

  } catch (error) {
    console.error('[Email Verification] Status check error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
