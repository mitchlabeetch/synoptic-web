// src/app/api/auth/google/route.ts
// PURPOSE: Initiate Google OAuth flow
// ACTION: Redirects to Google's OAuth consent screen
// MECHANISM: Constructs OAuth URL with required scopes

import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  if (!clientId) {
    // If Google OAuth is not configured, redirect back with error
    return NextResponse.redirect(
      new URL('/auth/login?error=oauth_not_configured', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    );
  }

  const scopes = [
    'openid',
    'email',
    'profile',
  ].join(' ');

  // Generate state for CSRF protection
  const state = crypto.randomUUID();
  
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', scopes);
  googleAuthUrl.searchParams.set('state', state);
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'consent');

  // Store state in cookie for verification
  const response = NextResponse.redirect(googleAuthUrl.toString());
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return response;
}
