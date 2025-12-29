// scripts/init-db.js
// PURPOSE: Initialize the database schema on DigitalOcean PostgreSQL
// Usage: node scripts/init-db.js

const { Pool } = require('pg');

const dropSchema = `
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
`;

const createSchema = `
-- Profiles table (users)
CREATE TABLE profiles (
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
CREATE INDEX idx_profiles_email ON profiles(email);

-- Projects table
CREATE TABLE projects (
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
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_updated_at ON projects(updated_at DESC);

-- Activity log (optional, for analytics)
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

async function initDatabase() {
  // Allow self-signed certificates for DO managed database
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  // Connection string MUST be provided via environment variable
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL environment variable is required');
    console.log('\\nUsage: DATABASE_URL="postgresql://..." node scripts/init-db.js');
    process.exit(1);
  }
  
  console.log('Connecting to database...');
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Dropping existing tables...');
    await pool.query(dropSchema);
    
    console.log('Creating new schema...');
    await pool.query(createSchema);
    console.log('✅ Database schema initialized successfully!');
    
    // Verify tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    console.log('\nTables created:');
    result.rows.forEach(row => console.log('  -', row.table_name));
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
