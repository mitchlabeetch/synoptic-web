#!/usr/bin/env npx ts-node
// scripts/seed-knowledge.ts
// PURPOSE: Ingest translation guide markdown files into PostgreSQL with vector embeddings
// ACTION: Reads all 33 language MD files, chunks them, generates embeddings, stores in DB
// MECHANISM: Uses @xenova/transformers for local CPU-based embedding generation

/**
 * 🧠 KNOWLEDGE SEEDER
 * 
 * This script populates the knowledge_base table with vectorized chunks
 * from the translation guide markdown files.
 * 
 * Run with: npx ts-node scripts/seed-knowledge.ts
 * 
 * Environment variables required:
 *   - DATABASE_URL or (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
 */

import fs from 'fs/promises';
import path from 'path';
import { Pool } from 'pg';

// Dynamic import for ES module
async function loadTransformers() {
  const { pipeline } = await import('@xenova/transformers');
  return pipeline;
}

// Configuration
const KB_DIR = path.resolve(__dirname, '../docs/translation_guide');
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

// Database connection
function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  
  if (connectionString) {
    return new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  
  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '25060'),
    database: process.env.DB_NAME || 'defaultdb',
    user: process.env.DB_USER || 'doadmin',
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });
}

// Parse language code from filename (e.g., "fr_french.md" -> "fr")
function parseLanguageCode(filename: string): string {
  const match = filename.match(/^([a-z]{2,3}(?:-[A-Z]{2})?)_/);
  return match ? match[1] : 'unknown';
}

// Parse language name from filename (e.g., "fr_french.md" -> "french")  
function parseLanguageName(filename: string): string {
  const match = filename.match(/^[a-z]{2,3}(?:-[A-Z]{2})?_(.+)\.md$/);
  return match ? match[1].replace(/_/g, ' ') : 'unknown';
}

// Smart chunking: Split by H2 headers (## Section)
function chunkByHeaders(content: string): { title: string; content: string }[] {
  const chunks: { title: string; content: string }[] = [];
  
  // Split by ## headers but keep the header with the content
  const sections = content.split(/^(?=## )/gm);
  
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed || trimmed.length < 50) continue; // Skip very short sections
    
    // Extract title from first line
    const firstLine = trimmed.split('\n')[0];
    const title = firstLine.replace(/^#+ /, '').trim();
    
    chunks.push({
      title: title || 'Introduction',
      content: trimmed,
    });
  }
  
  return chunks;
}

// Main seeding function
async function seed() {
  console.log('🧠 KNOWLEDGE SEEDER: Initializing Neural Pathway...');
  console.log('=' .repeat(60));
  
  // 1. Load the Embedding Model (runs locally on CPU, no API cost!)
  console.log('\n📥 Loading embedding model:', MODEL_NAME);
  console.log('   (First run will download ~90MB model - this is cached for future use)');
  
  const pipelineFactory = await loadTransformers();
  const extractor = await pipelineFactory('feature-extraction', MODEL_NAME);
  console.log('✓  Model loaded successfully');
  
  // 2. Connect to Database
  console.log('\n🔌 Connecting to PostgreSQL...');
  const pool = createPool();
  
  try {
    await pool.query('SELECT 1');
    console.log('✓  Database connected');
    
    // Check if pgvector extension exists
    const extCheck = await pool.query(
      "SELECT 1 FROM pg_extension WHERE extname = 'vector'"
    );
    if (extCheck.rows.length === 0) {
      console.log('⚠️  pgvector extension not found. Running migration...');
      const migrationPath = path.resolve(__dirname, '../migrations/001_add_vectors.sql');
      const migrationSql = await fs.readFile(migrationPath, 'utf-8');
      await pool.query(migrationSql);
      console.log('✓  Migration applied');
    }
    
    // Ensure unique constraint exists for idempotent upserts
    console.log('\n🔧 Ensuring unique constraint for idempotent seeding...');
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_base_file_chunk 
      ON knowledge_base(file_name, chunk_index)
    `);
    
    // 3. Scan translation guide directory (no DELETE - use UPSERT for idempotency)
    console.log('\n📂 Scanning:', KB_DIR);
    console.log('   (Using UPSERT for idempotent operation - safe to run multiple times)');
    const files = await fs.readdir(KB_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    console.log(`   Found ${mdFiles.length} markdown files`);
    
    let totalChunks = 0;
    let totalTokens = 0;
    
    // 5. Process each file
    for (const file of mdFiles) {
      const langCode = parseLanguageCode(file);
      const langName = parseLanguageName(file);
      
      console.log(`\n📄 Processing: ${file} (${langCode})`);
      
      const filePath = path.join(KB_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Chunk by headers
      const chunks = chunkByHeaders(content);
      console.log(`   Chunks: ${chunks.length}`);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Generate embedding (this runs on CPU, ~50-100ms per chunk)
        const output = await extractor(chunk.content, { 
          pooling: 'mean', 
          normalize: true 
        });
        
        // Convert to array for PostgreSQL
        const embedding = Array.from(output.data as Float32Array);
        
        // Format as PostgreSQL vector literal
        const vectorLiteral = `[${embedding.join(',')}]`;
        
        // UPSERT into database (idempotent - safe to run multiple times)
        await pool.query(
          `INSERT INTO knowledge_base 
           (file_name, chunk_index, category, language, section_title, content, embedding)
           VALUES ($1, $2, $3, $4, $5, $6, $7::vector)
           ON CONFLICT (file_name, chunk_index) 
           DO UPDATE SET 
             category = EXCLUDED.category,
             language = EXCLUDED.language,
             section_title = EXCLUDED.section_title,
             content = EXCLUDED.content,
             embedding = EXCLUDED.embedding`,
          [
            file,
            i,
            'grammar', // Default category
            langCode,
            chunk.title,
            chunk.content,
            vectorLiteral
          ]
        );
        
        totalChunks++;
        totalTokens += chunk.content.length;
        
        // Progress indicator
        process.stdout.write(`   Embedded: ${i + 1}/${chunks.length}\r`);
      }
      
      console.log(`   ✓ Completed: ${chunks.length} chunks embedded`);
    }
    
    // 6. Summary
    console.log('\n' + '=' .repeat(60));
    console.log('✅ KNOWLEDGE BASE HYDRATED');
    console.log(`   Total chunks: ${totalChunks}`);
    console.log(`   Total characters: ${totalTokens.toLocaleString()}`);
    console.log(`   Languages: ${mdFiles.length}`);
    
    // Verify with a sample query
    console.log('\n🔍 Verification query...');
    const stats = await pool.query(`
      SELECT language, COUNT(*) as chunks 
      FROM knowledge_base 
      GROUP BY language 
      ORDER BY chunks DESC 
      LIMIT 5
    `);
    console.log('   Top languages by chunks:');
    for (const row of stats.rows) {
      console.log(`     ${row.language}: ${row.chunks} chunks`);
    }
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the seeder
seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
