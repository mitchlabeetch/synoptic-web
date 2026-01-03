// src/app/api/user/onboarding/route.ts
// PURPOSE: Persist onboarding state in user's profile
// ACTION: GET/PATCH/DELETE onboarding state from profiles table
// MECHANISM: Stores onboarding state as JSONB in profiles.onboarding column

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { query } from '@/lib/db/client';

export async function GET() {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ onboarding: null }, { status: 200 });
  }

  const userId = getUserId(user);

  try {
    const result = await query(
      'SELECT onboarding FROM profiles WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ onboarding: null });
    }

    return NextResponse.json({
      onboarding: result.rows[0].onboarding || {},
    });
  } catch (error) {
    console.error('[Onboarding API] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding state' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = getUserId(user);

  try {
    const { onboarding } = await request.json();

    if (!onboarding || typeof onboarding !== 'object') {
      return NextResponse.json({ error: 'Invalid onboarding data' }, { status: 400 });
    }

    // Merge with existing onboarding state (don't overwrite everything)
    const result = await query(
      `UPDATE profiles 
       SET onboarding = COALESCE(onboarding, '{}'::jsonb) || $2::jsonb,
           updated_at = NOW()
       WHERE id = $1
       RETURNING onboarding`,
      [userId, JSON.stringify(onboarding)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      onboarding: result.rows[0].onboarding,
    });
  } catch (error) {
    console.error('[Onboarding API] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update onboarding state' }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = getUserId(user);

  try {
    await query(
      `UPDATE profiles 
       SET onboarding = '{}'::jsonb,
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Onboarding API] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to reset onboarding state' }, { status: 500 });
  }
}
