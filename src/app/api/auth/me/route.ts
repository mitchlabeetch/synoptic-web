// src/app/api/auth/me/route.ts
// PURPOSE: Get current authenticated user
// ACTION: Returns user info from JWT token
// MECHANISM: Verifies JWT and returns user data

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { query } from '@/lib/db/client';

export async function GET() {
  try {
    const tokenPayload = await getCurrentUser();
    
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get fresh user data from database
    const result = await query(
      'SELECT id, email, name, tier, ai_credits_used, ai_credits_limit FROM profiles WHERE id = $1',
      [tokenPayload.sub]
    );

    const user = result.rows[0];
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        aiCreditsUsed: user.ai_credits_used,
        aiCreditsLimit: user.ai_credits_limit,
      },
    });
  } catch (error) {
    console.error('[Auth Me Error]', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}
