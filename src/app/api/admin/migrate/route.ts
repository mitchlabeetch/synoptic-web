// src/app/api/admin/migrate/route.ts
// PURPOSE: Run database migrations from within the deployed environment
// ACTION: Executes pending migrations with proper authorization
// MECHANISM: Protected admin endpoint that runs migration scripts

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { query } from '@/lib/db/client';

// List of admin user IDs who can run migrations
// You should set this via environment variable
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean);

export async function POST(request: NextRequest) {
  // 1. Authentication
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = getUserId(user);
  
  // 2. Authorization - only admins can run migrations
  if (ADMIN_USER_IDS.length > 0 && !ADMIN_USER_IDS.includes(userId)) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  const { migration } = await request.json();

  try {
    const results: string[] = [];

    if (migration === 'email-verification' || migration === 'all') {
      // Run email verification migration
      results.push('Starting email verification migration...');

      // 1. Add email_verified column
      await query(`
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false
      `);
      results.push('✅ Added email_verified column');

      // 2. Create tokens table
      await query(`
        CREATE TABLE IF NOT EXISTS email_verification_tokens (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          token_hash VARCHAR(64) NOT NULL,
          email VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      results.push('✅ Created email_verification_tokens table');

      // 3. Create indexes
      await query(`
        CREATE INDEX IF NOT EXISTS idx_verification_tokens_hash 
        ON email_verification_tokens(token_hash)
      `);
      await query(`
        CREATE INDEX IF NOT EXISTS idx_verification_tokens_user 
        ON email_verification_tokens(user_id)
      `);
      await query(`
        CREATE INDEX IF NOT EXISTS idx_verification_tokens_expiry 
        ON email_verification_tokens(expires_at)
      `);
      results.push('✅ Created indexes');

      results.push('Email verification migration complete!');
    }

    // Verify current schema
    const schemaCheck = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
      ORDER BY ordinal_position
    `);

    return NextResponse.json({
      success: true,
      results,
      schema: schemaCheck.rows,
    });

  } catch (error) {
    console.error('[Migration] Error:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check current schema
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profilesSchema = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
      ORDER BY ordinal_position
    `);

    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    return NextResponse.json({
      profiles: profilesSchema.rows,
      tables: tables.rows.map((r: any) => r.table_name),
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check schema' },
      { status: 500 }
    );
  }
}
