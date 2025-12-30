// scripts/run-migration.ts
// Execute database migrations using Node.js
// Run with: npx tsx scripts/run-migration.ts

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Load env from .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=["']?(.+?)["']?$/);
  if (match) {
    process.env[match[1]] = match[2];
  }
}

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in .env.local');
    return;
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();
    
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'migrations/004_user_favorites.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📜 Running migration: 004_user_favorites.sql');
    
    await client.query(migrationSql);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify table was created
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'user_favorites'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Table user_favorites exists');
    } else {
      console.log('❌ Table user_favorites NOT found');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
