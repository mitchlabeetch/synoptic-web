#!/usr/bin/env node
// scripts/run-vector-migration.js
// PURPOSE: Run the vector database migration via Node.js
// ACTION: Executes the SQL migration file against PostgreSQL
// MECHANISM: Uses pg client to run the migration

/**
 * 🧬 VECTOR MIGRATION RUNNER
 * 
 * Run with environment variables:
 *   DB_HOST=xxx DB_PASSWORD=xxx node scripts/run-vector-migration.js
 * 
 * Or with DATABASE_URL:
 *   DATABASE_URL=postgres://... node scripts/run-vector-migration.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🧬 VECTOR MIGRATION: Starting...');
  console.log('=' .repeat(50));

  // Create pool from environment
  const connectionString = process.env.DATABASE_URL;
  
  const pool = connectionString 
    ? new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
      })
    : new Pool({
        host: process.env.DB_HOST || 'synoptic-data-do-user-31216037-0.f.db.ondigitalocean.com',
        port: parseInt(process.env.DB_PORT || '25060'),
        database: process.env.DB_NAME || 'defaultdb',
        user: process.env.DB_USER || 'doadmin',
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
      });

  try {
    // Test connection
    console.log('\n🔌 Testing connection...');
    await pool.query('SELECT NOW() as time');
    console.log('✓  Connected to PostgreSQL');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/001_add_vectors.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('\n📄 Running migration: 001_add_vectors.sql');
    
    // Split by semicolons and run each statement
    // This handles multi-statement SQL files
    const statements = migrationSql
      .split(/;\s*$/gm)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.includes('CREATE EXTENSION')) {
        console.log('   → Enabling pgvector extension...');
      } else if (statement.includes('CREATE TABLE')) {
        console.log('   → Creating knowledge_base table...');
      } else if (statement.includes('CREATE INDEX')) {
        const match = statement.match(/CREATE INDEX.*?(\w+)/i);
        console.log(`   → Creating index: ${match ? match[1] : 'index'}...`);
      } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
        console.log('   → Creating trigger function...');
      } else if (statement.includes('CREATE TRIGGER')) {
        console.log('   → Creating trigger...');
      }

      try {
        await pool.query(statement);
      } catch (err) {
        // Some statements may fail if they already exist - that's OK
        if (err.message.includes('already exists')) {
          console.log(`     ℹ️  Already exists, skipping`);
        } else {
          throw err;
        }
      }
    }

    // Verify the table exists
    console.log('\n🔍 Verifying migration...');
    const tableCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'knowledge_base'
      ORDER BY ordinal_position
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✓  knowledge_base table exists with columns:');
      for (const col of tableCheck.rows) {
        console.log(`     - ${col.column_name}: ${col.data_type}`);
      }
    }

    // Check pgvector extension
    const extCheck = await pool.query(`
      SELECT extversion FROM pg_extension WHERE extname = 'vector'
    `);
    
    if (extCheck.rows.length > 0) {
      console.log(`✓  pgvector extension v${extCheck.rows[0].extversion} is active`);
    } else {
      console.log('⚠️  pgvector extension not found - vector operations will fail');
    }

    console.log('\n' + '=' .repeat(50));
    console.log('✅ MIGRATION COMPLETE');
    console.log('\nNext step: Run the knowledge seeder');
    console.log('  npx ts-node scripts/seed-knowledge.ts');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.message.includes('extension "vector"')) {
      console.log('\n💡 Note: pgvector must be installed on your PostgreSQL server.');
      console.log('   DigitalOcean Managed PostgreSQL includes it by default.');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
