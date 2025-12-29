// src/app/api/auth/logout/route.ts
// PURPOSE: Handle user logout
// ACTION: Clears authentication cookie
// MECHANISM: Deletes the JWT cookie

import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth/jwt';

export async function POST() {
  try {
    await clearAuthCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Auth Logout Error]', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
