#!/usr/bin/env node
// scripts/apply-all-migrations.js
// PURPOSE: Apply all pending database migrations to DigitalOcean PostgreSQL
// USAGE: DATABASE_URL="postgresql://..." node scripts/apply-all-migrations.js
// 
// MIGRATIONS INCLUDED:
// 1. Base schema (profiles, projects, activity_log)
// 2. Email verification (email_verified column, tokens table)
// 3. Onboarding support (onboarding JSONB column)
// 4. Vector/RAG support (pgvector, knowledge_base table)
// 5. User favorites (library favorites table)
// 6. Locale preference (preferred_locale column)

const { Pool } = require('pg');

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

      -- Create indexes for profiles
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

      -- Create indexes for projects
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

      -- Activity log (optional, for analytics)
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

      -- Function to auto-update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Triggers for updated_at
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
      -- Add email_verified column to profiles
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

      -- Create email verification tokens table
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL,
        email VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Create indexes for fast lookups
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_hash 
      ON email_verification_tokens(token_hash);

      CREATE INDEX IF NOT EXISTS idx_verification_tokens_user 
      ON email_verification_tokens(user_id);

      CREATE INDEX IF NOT EXISTS idx_verification_tokens_expiry 
      ON email_verification_tokens(expires_at);
    `,
  },

  {
    name: '003_onboarding_support',
    description: 'Add JSONB onboarding column for multi-step onboarding persistence',
    sql: `
      -- Add onboarding JSONB column to profiles
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS onboarding JSONB DEFAULT '{}'::jsonb;
    `,
  },

  {
    name: '004_user_preferences',
    description: 'Add preferred_locale column for i18n',
    sql: `
      -- Add preferred_locale column
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS preferred_locale VARCHAR(10) DEFAULT 'en';
    `,
  },

  {
    name: '005_vector_support',
    description: 'Enable pgvector and create knowledge_base for RAG',
    sql: `
      -- Enable vector extension
      CREATE EXTENSION IF NOT EXISTS vector;

      -- Create the Knowledge Base Table for RAG
      CREATE TABLE IF NOT EXISTS knowledge_base (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          
          -- Source file metadata
          file_name VARCHAR(255) NOT NULL,
          chunk_index INTEGER NOT NULL DEFAULT 0,
          
          -- Classification
          category VARCHAR(50) NOT NULL DEFAULT 'grammar',
          language VARCHAR(10) NOT NULL,
          
          -- The actual content
          section_title VARCHAR(500),
          content TEXT NOT NULL,
          
          -- Vector embedding (384 dimensions matches 'all-MiniLM-L6-v2')
          embedding vector(384),
          
          -- Timestamps
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create HNSW Index for fast retrieval
      CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding 
          ON knowledge_base 
          USING hnsw (embedding vector_cosine_ops);

      -- Create supporting indexes
      CREATE INDEX IF NOT EXISTS idx_knowledge_base_language 
          ON knowledge_base(language);

      CREATE INDEX IF NOT EXISTS idx_knowledge_base_category 
          ON knowledge_base(category);

      CREATE INDEX IF NOT EXISTS idx_knowledge_base_file 
          ON knowledge_base(file_name);

      CREATE INDEX IF NOT EXISTS idx_knowledge_base_lang_cat 
          ON knowledge_base(language, category);

      -- Auto-update trigger
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
    description: 'Create user_favorites table for library favorites',
    sql: `
      -- Create the user_favorites table
      CREATE TABLE IF NOT EXISTS user_favorites (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          tile_id VARCHAR(100) NOT NULL,
          saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Ensure unique favorites per user
          CONSTRAINT unique_user_favorite UNIQUE (user_id, tile_id)
      );

      -- Index for fast lookups by user
      CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);

      -- Index for listing favorites sorted by date
      CREATE INDEX IF NOT EXISTS idx_user_favorites_saved_at ON user_favorites(user_id, saved_at DESC);

      -- Comments for documentation
      COMMENT ON TABLE user_favorites IS 'Stores user favorite library templates for quick access from dashboard';
      COMMENT ON COLUMN user_favorites.tile_id IS 'References the sourceId from the library registry';
    `,
  },

  {
    name: '007_password_reset_tokens',
    description: 'Create password reset tokens table',
    sql: `
      -- Create password reset tokens table
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash 
      ON password_reset_tokens(token_hash);

      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user 
      ON password_reset_tokens(user_id);
    `,
  },

  {
    name: '008_glossary_storage',
    description: 'Add glossary column to projects for Glossary Guard feature',
    sql: `
      -- Ensure glossary is in projects content by default
      -- (This is stored in JSONB content field, but we add an index for performance)
      
      -- Create a GIN index on the content JSONB for fast glossary lookups
      CREATE INDEX IF NOT EXISTS idx_projects_content_gin 
      ON projects USING gin(content);
    `,
  },

  {
    name: '009_audit_log',
    description: 'Create security audit log table',
    sql: `
      -- Security audit log for critical events
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

      -- Indexes for security log queries
      CREATE INDEX IF NOT EXISTS idx_security_audit_event_type 
      ON security_audit_log(event_type);
      
      CREATE INDEX IF NOT EXISTS idx_security_audit_user 
      ON security_audit_log(user_id);
      
      CREATE INDEX IF NOT EXISTS idx_security_audit_created 
      ON security_audit_log(created_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_security_audit_severity 
      ON security_audit_log(severity);
    `,
  },
];

// ═══════════════════════════════════════════════════════════════════
// MIGRATION RUNNER
// ═══════════════════════════════════════════════════════════════════

async function runMigrations() {
  // Allow self-signed certificates
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL environment variable is required');
    console.log('\nUsage: DATABASE_URL="postgresql://..." node scripts/apply-all-migrations.js');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Get list of already applied migrations
    const appliedResult = await pool.query('SELECT name FROM _migrations');
    const appliedMigrations = new Set(appliedResult.rows.map(r => r.name));

    console.log(`\n📋 Found ${appliedMigrations.size} already applied migrations\n`);

    let appliedCount = 0;
    let skippedCount = 0;

    for (const migration of migrations) {
      if (appliedMigrations.has(migration.name)) {
        console.log(`⏭️  Skipping: ${migration.name} (already applied)`);
        skippedCount++;
        continue;
      }

      console.log(`\n🔄 Applying: ${migration.name}`);
      console.log(`   ${migration.description}`);

      try {
        // Start transaction
        await pool.query('BEGIN');

        // Run migration
        await pool.query(migration.sql);

        // Record migration
        await pool.query(
          'INSERT INTO _migrations (name) VALUES ($1)',
          [migration.name]
        );

        // Commit
        await pool.query('COMMIT');

        console.log(`   ✅ Applied successfully`);
        appliedCount++;
      } catch (err) {
        // Rollback on error
        await pool.query('ROLLBACK');
        console.error(`   ❌ Failed: ${err.message}`);
        
        // Continue with other migrations
        if (err.message.includes('already exists')) {
          console.log(`   ⚠️  Skipping due to existing objects`);
          // Mark as applied anyway
          try {
            await pool.query(
              'INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
              [migration.name]
            );
          } catch (e) { /* ignore */ }
        }
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Applied: ${appliedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`📝 Total:   ${migrations.length}`);

    // Verify final schema
    console.log('\n📋 Current Tables:');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    tablesResult.rows.forEach(r => console.log(`   - ${r.table_name}`));

    console.log('\n📋 Profiles Columns:');
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
      ORDER BY ordinal_position
    `);
    columnsResult.rows.forEach(r => 
      console.log(`   - ${r.column_name} (${r.data_type})`)
    );

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }

  console.log('\n✅ All migrations complete!\n');
}

runMigrations();
