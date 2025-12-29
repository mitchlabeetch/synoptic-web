// src/app/api/auth/signup/route.ts
// PURPOSE: Handle new user registration
// ACTION: Creates user account with hashed password
// MECHANISM: Hashes password with bcrypt, inserts into database, returns JWT

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/client';
import { createToken, setAuthCookie } from '@/lib/auth/jwt';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM profiles WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    await query(
      `INSERT INTO profiles (id, email, name, password_hash, tier, ai_credits_used, ai_credits_limit, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        email.toLowerCase(),
        name || email.split('@')[0],
        passwordHash,
        'free',
        0,
        100, // Free tier limit
        now,
        now,
      ]
    );

    // Create JWT token
    const token = await createToken({
      id: userId,
      email: email.toLowerCase(),
      name: name || email.split('@')[0],
      tier: 'free',
    });

    // Set auth cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        tier: 'free',
      },
    });
  } catch (error: any) {
    console.error('[Auth Signup Error]', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
