// src/app/api/auth/google/callback/route.ts
// PURPOSE: Handle Google OAuth callback
// ACTION: Exchanges code for tokens, creates/updates user, logs them in
// MECHANISM: Validates state, fetches user info from Google, creates JWT

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/client';
import { createToken, setAuthCookie } from '@/lib/auth/jwt';
import crypto from 'crypto';

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const storedState = request.cookies.get('oauth_state')?.value;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(new URL(`/auth/login?error=${error}`, appUrl));
  }

  // Validate state (CSRF protection)
  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid_state', appUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=no_code', appUrl));
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${appUrl}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/auth/login?error=oauth_not_configured', appUrl));
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('[Google OAuth] Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(new URL('/auth/login?error=token_exchange_failed', appUrl));
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      console.error('[Google OAuth] Failed to fetch user info');
      return NextResponse.redirect(new URL('/auth/login?error=user_info_failed', appUrl));
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json();

    if (!googleUser.verified_email) {
      return NextResponse.redirect(new URL('/auth/login?error=email_not_verified', appUrl));
    }

    // Check if user exists
    let user;
    const existingUser = await query(
      'SELECT id, email, name, tier FROM profiles WHERE email = $1',
      [googleUser.email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      // Update existing user with Google info if needed
      user = existingUser.rows[0];
      
      // Update avatar if not set
      if (googleUser.picture) {
        await query(
          'UPDATE profiles SET avatar_url = COALESCE(avatar_url, $1), updated_at = NOW() WHERE id = $2',
          [googleUser.picture, user.id]
        );
      }
    } else {
      // Create new user
      const userId = crypto.randomUUID();
      const result = await query(
        `INSERT INTO profiles (id, email, name, tier, avatar_url, created_at, updated_at)
         VALUES ($1, $2, $3, 'free', $4, NOW(), NOW())
         RETURNING id, email, name, tier`,
        [userId, googleUser.email.toLowerCase(), googleUser.name, googleUser.picture]
      );
      user = result.rows[0];
    }

    // Create JWT token
    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
    });

    // Set auth cookie
    await setAuthCookie(token);

    // Clear OAuth state cookie and redirect to dashboard
    const response = NextResponse.redirect(new URL('/dashboard', appUrl));
    response.cookies.delete('oauth_state');

    return response;

  } catch (error) {
    console.error('[Google OAuth Callback Error]', error);
    return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', appUrl));
  }
}
