// src/app/api/auth/login/route.ts
// PURPOSE: Handle user login
// ACTION: Validates credentials and returns JWT token
// MECHANISM: Checks password hash against database, creates signed JWT

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/client';
import { createToken, setAuthCookie } from '@/lib/auth/jwt';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const result = await query(
      'SELECT id, email, name, password_hash, tier FROM profiles WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get preferred locale
    const profileResult = await query(
      'SELECT preferred_locale FROM profiles WHERE id = $1',
      [user.id]
    );
    const preferredLocale = profileResult.rows[0]?.preferred_locale || 'en';

    // Create JWT token
    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
    });

    // Set auth cookie
    await setAuthCookie(token);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
      },
    });

    // Set locale cookie
    response.cookies.set('NEXT_LOCALE', preferredLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    });

    return response;

  } catch (error: any) {
    console.error('[Auth Login Error]', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
