// src/app/auth/callback/route.ts
// PURPOSE: Auth callback handler (legacy route, no longer used with JWT auth)
// ACTION: Redirects to dashboard
// MECHANISM: Simple redirect for backward compatibility

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  
  // Redirect to dashboard - actual auth is handled by /api/auth routes now
  return NextResponse.redirect(`${origin}/dashboard`);
}
