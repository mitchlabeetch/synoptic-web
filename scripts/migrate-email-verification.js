// scripts/migrate-email-verification.js
// PURPOSE: Add email verification tables and columns
// RUN: DATABASE_URL="..." node scripts/migrate-email-verification.js

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Starting email verification migration...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // 1. Add email_verified column to profiles if it doesn't exist
    console.log('Adding email_verified column to profiles...');
    await client.query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false
    `);
    
    // 2. Create email_verification_tokens table
    console.log('Creating email_verification_tokens table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL,
        email VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // 3. Create indexes
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_hash 
      ON email_verification_tokens(token_hash)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_user 
      ON email_verification_tokens(user_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_expiry 
      ON email_verification_tokens(expires_at)
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the migration
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'email_verified'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ email_verified column exists:', result.rows[0]);
    }
    
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'email_verification_tokens'
    `);
    
    if (tableResult.rows.length > 0) {
      console.log('✅ email_verification_tokens table exists');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
