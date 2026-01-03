// src/lib/db/client.ts
// PURPOSE: Database client for DigitalOcean managed PostgreSQL
// ACTION: Provides connection pooling and query methods
// MECHANISM: Uses pg Pool with SSL for DigitalOcean managed database

import { Pool, QueryResult, QueryResultRow } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@/lib/logger';

// =============================================================================
// SECURITY: SQL Injection Protection via Identifier Whitelists
// =============================================================================

/**
 * Allowed table names - prevents SQL injection via table name manipulation.
 * Add new tables here as needed.
 */
const ALLOWED_TABLES = new Set([
  'profiles',
  'projects',
  'favorites',
  'sessions',
  'password_reset_tokens',
  'glossary_entries',
  'user_settings',
  'embeddings', // RAG knowledge base
]);

/**
 * Allowed column names per table - prevents SQL injection via column name manipulation.
 * This is the critical defense against object key injection attacks.
 */
const ALLOWED_COLUMNS: Record<string, Set<string>> = {
  profiles: new Set([
    'id', 'email', 'password_hash', 'name', 'tier', 'avatar_url',
    'ai_credits_used', 'ai_credits_limit', 'created_at', 'updated_at',
    'stripe_customer_id', 'stripe_subscription_id',
  ]),
  projects: new Set([
    'id', 'user_id', 'title', 'description', 'content', 'l1_lang', 'l2_lang',
    'cover_image_url', 'is_published', 'created_at', 'updated_at', 'settings',
  ]),
  favorites: new Set([
    'id', 'user_id', 'item_id', 'item_type', 'source', 'metadata', 'created_at',
  ]),
  sessions: new Set([
    'id', 'user_id', 'token', 'expires_at', 'created_at',
  ]),
  password_reset_tokens: new Set([
    'id', 'user_id', 'token', 'expires_at', 'used', 'created_at',
  ]),
  glossary_entries: new Set([
    'id', 'project_id', 'source_term', 'target_term', 'notes', 'created_at', 'updated_at',
  ]),
  user_settings: new Set([
    'id', 'user_id', 'key', 'value', 'created_at', 'updated_at',
  ]),
  embeddings: new Set([
    'id', 'content', 'embedding', 'source_file', 'chunk_index', 'created_at',
  ]),
};

/**
 * Validates a table name against the whitelist.
 * Throws an error if the table is not allowed.
 */
function validateTableName(table: string): void {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`[DB Security] Invalid table name: "${table}". Table not in allowed list.`);
  }
}

/**
 * Validates column names against the table's whitelist.
 * Throws an error if any column is not allowed.
 */
function validateColumnNames(table: string, columns: string[]): void {
  const allowedColumns = ALLOWED_COLUMNS[table];
  if (!allowedColumns) {
    throw new Error(`[DB Security] No column whitelist defined for table: "${table}".`);
  }
  
  for (const col of columns) {
    if (!allowedColumns.has(col)) {
      throw new Error(`[DB Security] Invalid column name: "${col}" for table "${table}".`);
    }
  }
}

/**
 * Escapes an identifier (table/column name) for safe use in SQL.
 * Uses PostgreSQL double-quote escaping.
 */
function escapeIdentifier(identifier: string): string {
  // Double any existing double-quotes to prevent escape attacks
  return `"${identifier.replace(/"/g, '""')}"`;
}

// =============================================================================
// SSL Configuration
// =============================================================================

/**
 * Get SSL configuration for database connection.
 * Supports: CA certificate (most secure), or rejectUnauthorized: false (dev only).
 */
function getSSLConfig(): { rejectUnauthorized: boolean; ca?: string } {
  // Check for DigitalOcean CA certificate path
  const caCertPath = process.env.DATABASE_CA_CERT_PATH;
  
  if (caCertPath) {
    try {
      const absolutePath = path.isAbsolute(caCertPath) 
        ? caCertPath 
        : path.join(process.cwd(), caCertPath);
      
      const ca = fs.readFileSync(absolutePath, 'utf-8');
      logger.info('Using CA certificate for secure SSL connection', { module: 'DB' });
      return { rejectUnauthorized: true, ca };
    } catch (error) {
      logger.error('Failed to read CA certificate', error, { module: 'DB' });
      // In production, fail closed - don't fall back to insecure
      if (process.env.NODE_ENV === 'production') {
        throw new Error('[DB Security] CA certificate required in production but failed to load.');
      }
    }
  }
  
  // Development fallback - warn about MITM vulnerability
  if (process.env.NODE_ENV !== 'production') {
    logger.warn('Using rejectUnauthorized: false - vulnerable to MITM attacks', { module: 'DB' });
    logger.warn('Set DATABASE_CA_CERT_PATH to DigitalOcean CA certificate for production', { module: 'DB' });
  }
  
  return { rejectUnauthorized: false };
}

// =============================================================================
// Connection Pool
// =============================================================================

// Lazy-initialized pool to avoid build-time errors
// Note: In serverless environments (Vercel), this global state may not persist
// between requests due to cold starts. The pool is re-created as needed.
let pool: Pool | null = null;

/**
 * Get or create the connection pool.
 * 
 * SERVERLESS CONSIDERATIONS:
 * - In serverless (Vercel functions), global state isn't reliably preserved
 * - Each cold start will create a new pool
 * - Pool settings (max, idle timeout) help manage connection churn
 * - For high-traffic apps, consider connection pooling services (PgBouncer)
 */
function getPool(): Pool {
  if (!pool) {
    // Require DATABASE_URL in production - no fallbacks
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString && process.env.NODE_ENV === 'production') {
      throw new Error(
        '[DB Security] DATABASE_URL environment variable is required in production. ' +
        'No fallback credentials are allowed.'
      );
    }
    
    const sslConfig = getSSLConfig();
    
    if (connectionString) {
      pool = new Pool({
        connectionString,
        ssl: sslConfig,
        max: 10, // Maximum connections in pool
        idleTimeoutMillis: 30000, // Close idle connections after 30s
        connectionTimeoutMillis: 10000, // Fail if can't connect in 10s
      });
    } else {
      // Development fallback using individual environment variables
      // All values MUST come from environment variables - no hardcoded defaults
      const host = process.env.DB_HOST;
      const port = process.env.DB_PORT;
      const database = process.env.DB_NAME;
      const user = process.env.DB_USER;
      const password = process.env.DB_PASSWORD;
      
      if (!host || !database || !user) {
        throw new Error(
          '[DB Configuration] Missing required database environment variables. ' +
          'Set DATABASE_URL or individual DB_HOST, DB_NAME, DB_USER, DB_PASSWORD variables.'
        );
      }
      
      pool = new Pool({
        host,
        port: parseInt(port || '5432', 10),
        database,
        user,
        password,
        ssl: sslConfig,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    }
    
    // Log connection initialization (no sensitive info)
    logger.info(`Pool initialized for: ${process.env.DB_HOST || 'DATABASE_URL'}`, { module: 'DB' });
    
    // Handle pool errors to prevent unhandled rejections
    pool.on('error', (err) => {
      logger.error('Unexpected pool error', err, { module: 'DB' });
    });
  }
  
  return pool;
}

// =============================================================================
// Query Methods
// =============================================================================

/**
 * Execute a SQL query with parameters
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const client = getPool();
  const start = Date.now();
  
  try {
    const result = await client.query<T>(text, params);
    const duration = Date.now() - start;
    
    logger.query(text, duration, result.rowCount);
    
    return result;
  } catch (error) {
    logger.error('Database query failed', error, { module: 'DB', text: text.slice(0, 100) } as unknown as { module: string });
    throw error;
  }
}

/**
 * Get a single row by ID from a table
 * @param table - Must be in ALLOWED_TABLES whitelist
 */
export async function getById<T extends QueryResultRow = QueryResultRow>(
  table: string,
  id: string
): Promise<T | null> {
  validateTableName(table);
  const result = await query<T>(
    `SELECT * FROM ${escapeIdentifier(table)} WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Insert a row and return it
 * @param table - Must be in ALLOWED_TABLES whitelist
 * @param data - Keys must be in ALLOWED_COLUMNS whitelist for the table
 */
export async function insert<T extends QueryResultRow = QueryResultRow>(
  table: string,
  data: Record<string, unknown>
): Promise<T> {
  validateTableName(table);
  const keys = Object.keys(data);
  validateColumnNames(table, keys);
  
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.map(escapeIdentifier).join(', ');
  
  const result = await query<T>(
    `INSERT INTO ${escapeIdentifier(table)} (${columns}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  
  return result.rows[0];
}

/**
 * Update a row by ID and return it
 * @param table - Must be in ALLOWED_TABLES whitelist
 * @param data - Keys must be in ALLOWED_COLUMNS whitelist for the table
 */
export async function update<T extends QueryResultRow = QueryResultRow>(
  table: string,
  id: string,
  data: Record<string, unknown>
): Promise<T | null> {
  validateTableName(table);
  const keys = Object.keys(data);
  validateColumnNames(table, keys);
  
  const values = Object.values(data);
  const setClause = keys.map((key, i) => `${escapeIdentifier(key)} = $${i + 2}`).join(', ');
  
  const result = await query<T>(
    `UPDATE ${escapeIdentifier(table)} SET ${setClause} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  
  return result.rows[0] || null;
}

/**
 * Delete a row by ID
 * @param table - Must be in ALLOWED_TABLES whitelist
 */
export async function deleteById(
  table: string,
  id: string
): Promise<boolean> {
  validateTableName(table);
  const result = await query(
    `DELETE FROM ${escapeIdentifier(table)} WHERE id = $1`,
    [id]
  );
  return (result.rowCount || 0) > 0;
}

/**
 * Execute multiple statements in a transaction
 * Ensures atomicity - all succeed or all fail
 */
export async function transaction<T>(
  callback: (client: {
    query: <R extends QueryResultRow = QueryResultRow>(
      text: string,
      params?: unknown[]
    ) => Promise<QueryResult<R>>;
  }) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    const result = await callback({
      query: async <R extends QueryResultRow = QueryResultRow>(
        text: string,
        params?: unknown[]
      ) => client.query<R>(text, params),
    });
    
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await query('SELECT NOW()');
    logger.info('Connection test successful', { module: 'DB' });
    return true;
  } catch (error) {
    logger.error('Connection test failed', error, { module: 'DB' });
    return false;
  }
}

// Export the pool for advanced use cases
export { getPool };

