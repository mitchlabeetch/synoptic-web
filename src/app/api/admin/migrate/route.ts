// src/app/api/admin/migrate/route.ts
// PURPOSE: Run database migrations from within the deployed environment
// ACTION: Executes pending migrations with proper authorization
// MECHANISM: Protected admin endpoint that runs migration scripts
//
// USAGE: POST /api/admin/migrate with body { "migration": "all" }
// Or use the secret key: POST /api/admin/migrate?key=<MIGRATION_SECRET>

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { query } from '@/lib/db/client';

// Migration secret key for running without login (useful for CI/CD)
const MIGRATION_SECRET = process.env.MIGRATION_SECRET || process.env.PDF_SERVICE_SECRET;

// List of admin user IDs who can run migrations
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean);

// ═══════════════════════════════════════════════════════════════════
// MIGRATION DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

const migrations = [
  {
    name: '001_ensure_base_tables',
    description: 'Ensure base schema exists (profiles, projects, activity_log)',
    sql: `
      -- Profiles table (users)
      CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          password_hash VARCHAR(255) NOT NULL,
          tier VARCHAR(50) DEFAULT 'free',
          ai_credits_used INTEGER DEFAULT 0,
          ai_credits_limit INTEGER DEFAULT 100,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

      -- Projects table
      CREATE TABLE IF NOT EXISTS projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          title VARCHAR(500) NOT NULL,
          source_lang VARCHAR(10) NOT NULL DEFAULT 'fr',
          target_lang VARCHAR(10) NOT NULL DEFAULT 'en',
          content JSONB DEFAULT '{"pages":[],"wordGroups":[],"arrows":[],"notes":[],"stamps":[],"presets":[]}',
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

      -- Activity log
      CREATE TABLE IF NOT EXISTS activity_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
          action VARCHAR(100) NOT NULL,
          resource_type VARCHAR(50),
          resource_id UUID,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

      -- Updated_at function
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
      CREATE TRIGGER update_profiles_updated_at
          BEFORE UPDATE ON profiles
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
      CREATE TRIGGER update_projects_updated_at
          BEFORE UPDATE ON projects
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `,
  },

  {
    name: '002_email_verification',
    description: 'Add email verification support',
    sql: `
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL,
        email VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_verification_tokens_hash ON email_verification_tokens(token_hash);
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_user ON email_verification_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_expiry ON email_verification_tokens(expires_at);
    `,
  },

  {
    name: '003_onboarding_support',
    description: 'Add JSONB onboarding column',
    sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding JSONB DEFAULT '{}'::jsonb;`,
  },

  {
    name: '004_user_preferences',
    description: 'Add preferred_locale column',
    sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_locale VARCHAR(10) DEFAULT 'en';`,
  },

  {
    name: '005_vector_support',
    description: 'Enable pgvector and create knowledge_base',
    sql: `
      CREATE EXTENSION IF NOT EXISTS vector;

      CREATE TABLE IF NOT EXISTS knowledge_base (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          file_name VARCHAR(255) NOT NULL,
          chunk_index INTEGER NOT NULL DEFAULT 0,
          category VARCHAR(50) NOT NULL DEFAULT 'grammar',
          language VARCHAR(10) NOT NULL,
          section_title VARCHAR(500),
          content TEXT NOT NULL,
          embedding vector(384),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding ON knowledge_base USING hnsw (embedding vector_cosine_ops);
      CREATE INDEX IF NOT EXISTS idx_knowledge_base_language ON knowledge_base(language);
      CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
      CREATE INDEX IF NOT EXISTS idx_knowledge_base_file ON knowledge_base(file_name);
      CREATE INDEX IF NOT EXISTS idx_knowledge_base_lang_cat ON knowledge_base(language, category);

      CREATE OR REPLACE FUNCTION update_knowledge_base_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_knowledge_base_updated_at ON knowledge_base;
      CREATE TRIGGER trigger_knowledge_base_updated_at
          BEFORE UPDATE ON knowledge_base
          FOR EACH ROW
          EXECUTE FUNCTION update_knowledge_base_updated_at();
    `,
  },

  {
    name: '006_user_favorites',
    description: 'Create user_favorites table',
    sql: `
      CREATE TABLE IF NOT EXISTS user_favorites (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          tile_id VARCHAR(100) NOT NULL,
          saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT unique_user_favorite UNIQUE (user_id, tile_id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_favorites_saved_at ON user_favorites(user_id, saved_at DESC);
    `,
  },

  {
    name: '007_password_reset_tokens',
    description: 'Create password reset tokens table',
    sql: `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
    `,
  },

  {
    name: '008_glossary_index',
    description: 'Add GIN index on projects content for glossary',
    sql: `CREATE INDEX IF NOT EXISTS idx_projects_content_gin ON projects USING gin(content);`,
  },

  {
    name: '009_security_audit_log',
    description: 'Create security audit log table',
    sql: `
      CREATE TABLE IF NOT EXISTS security_audit_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          event_type VARCHAR(50) NOT NULL,
          severity VARCHAR(20) DEFAULT 'INFO',
          user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
          ip_address INET,
          user_agent TEXT,
          resource_type VARCHAR(50),
          resource_id VARCHAR(255),
          details JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_log(event_type);
      CREATE INDEX IF NOT EXISTS idx_security_audit_user ON security_audit_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_security_audit_created ON security_audit_log(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_security_audit_severity ON security_audit_log(severity);
    `,
  },

  {
    name: '010_oauth_support',
    description: 'Add OAuth support columns (avatar_url, make password_hash nullable)',
    sql: `
      -- Add avatar_url column for profile pictures from OAuth providers
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      
      -- Add auth_provider column to track how user signed up
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'email';
      
      -- Make password_hash nullable for OAuth users (they don't have passwords)
      ALTER TABLE profiles ALTER COLUMN password_hash DROP NOT NULL;
      
      -- Set email_verified to true for existing users without OAuth
      UPDATE profiles SET email_verified = true WHERE password_hash IS NOT NULL AND email_verified IS NULL;
    `,
  },
];

// ═══════════════════════════════════════════════════════════════════
// API HANDLERS
// ═══════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  // Check for secret key auth (for CI/CD)
  const secretKey = request.nextUrl.searchParams.get('key');
  let authorized = false;

  if (MIGRATION_SECRET && secretKey === MIGRATION_SECRET) {
    authorized = true;
  } else {
    // Fall back to user authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = getUserId(user);
    
    // Check if user is admin
    if (ADMIN_USER_IDS.length === 0 || ADMIN_USER_IDS.includes(userId)) {
      authorized = true;
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const requestedMigration = body.migration || 'all';

  try {
    const results: string[] = [];

    // Create migrations tracking table
    await query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Get applied migrations
    const appliedResult = await query<{ name: string }>('SELECT name FROM _migrations');
    const appliedMigrations = new Set(appliedResult.rows.map(r => r.name));

    results.push(`Found ${appliedMigrations.size} already applied migrations`);

    let appliedCount = 0;
    let skippedCount = 0;

    for (const migration of migrations) {
      // Skip if not running 'all' and not this specific migration
      if (requestedMigration !== 'all' && requestedMigration !== migration.name) {
        continue;
      }

      if (appliedMigrations.has(migration.name)) {
        results.push(`⏭️ Skipping: ${migration.name} (already applied)`);
        skippedCount++;
        continue;
      }

      results.push(`🔄 Applying: ${migration.name} - ${migration.description}`);

      try {
        await query(migration.sql);
        await query('INSERT INTO _migrations (name) VALUES ($1)', [migration.name]);
        results.push(`✅ Applied: ${migration.name}`);
        appliedCount++;
      } catch (err) {
        const error = err as Error;
        if (error.message.includes('already exists')) {
          results.push(`⚠️ Skipped (already exists): ${migration.name}`);
          await query('INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [migration.name]);
        } else {
          results.push(`❌ Failed: ${migration.name} - ${error.message}`);
        }
      }
    }

    // Get current schema
    const schemaCheck = await query<{ column_name: string; data_type: string }>(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
      ORDER BY ordinal_position
    `);

    const tablesCheck = await query<{ table_name: string }>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    return NextResponse.json({
      success: true,
      summary: {
        applied: appliedCount,
        skipped: skippedCount,
        total: migrations.length,
      },
      results,
      schema: {
        profiles: schemaCheck.rows,
        tables: tablesCheck.rows.map(r => r.table_name),
      },
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
export async function GET(request: NextRequest) {
  // Check for secret key auth
  const secretKey = request.nextUrl.searchParams.get('key');
  let authorized = false;

  if (MIGRATION_SECRET && secretKey === MIGRATION_SECRET) {
    authorized = true;
  } else {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    authorized = true;
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const profilesSchema = await query<{
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
    }>(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
      ORDER BY ordinal_position
    `);

    const tables = await query<{ table_name: string }>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    // Check applied migrations
    let appliedMigrations: string[] = [];
    try {
      const migrationsResult = await query<{ name: string; applied_at: string }>(`
        SELECT name, applied_at FROM _migrations ORDER BY applied_at
      `);
      appliedMigrations = migrationsResult.rows.map(r => r.name);
    } catch {
      // Migrations table doesn't exist yet
    }

    // Check pending migrations
    const pendingMigrations = migrations
      .filter(m => !appliedMigrations.includes(m.name))
      .map(m => ({ name: m.name, description: m.description }));

    return NextResponse.json({
      profiles: profilesSchema.rows,
      tables: tables.rows.map(r => r.table_name),
      migrations: {
        applied: appliedMigrations,
        pending: pendingMigrations,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check schema', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
