// src/lib/db/client.ts
// PURPOSE: Database client for DigitalOcean managed PostgreSQL
// ACTION: Provides connection pooling and query methods
// MECHANISM: Uses pg Pool with SSL for DigitalOcean managed database

import { Pool, QueryResult, QueryResultRow } from 'pg';

// Lazy-initialized pool to avoid build-time errors
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    // Build connection string from environment variables
    const connectionString = process.env.DATABASE_URL;
    
    if (connectionString) {
      pool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false, // Required for DO managed databases
        },
        max: 10, // Maximum connections in pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    } else {
      // Fallback to individual connection parameters
      pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '25060'),
        database: process.env.DB_NAME || 'defaultdb',
        user: process.env.DB_USER || 'doadmin',
        password: process.env.DB_PASSWORD,
        ssl: {
          rejectUnauthorized: false,
        },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    }
    
    // Log connection status (not password)
    console.log('[DB] Pool initialized for:', process.env.DB_HOST || 'DATABASE_URL');
  }
  
  return pool;
}

/**
 * Execute a SQL query with parameters
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const client = getPool();
  const start = Date.now();
  
  try {
    const result = await client.query<T>(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[DB Query]', { text: text.slice(0, 100), duration, rows: result.rowCount });
    }
    
    return result;
  } catch (error) {
    console.error('[DB Error]', { text: text.slice(0, 100), error });
    throw error;
  }
}

/**
 * Get a single row by ID from a table
 */
export async function getById<T extends QueryResultRow = QueryResultRow>(
  table: string,
  id: string
): Promise<T | null> {
  const result = await query<T>(`SELECT * FROM ${table} WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

/**
 * Insert a row and return it
 */
export async function insert<T extends QueryResultRow = QueryResultRow>(
  table: string,
  data: Record<string, any>
): Promise<T> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.join(', ');
  
  const result = await query<T>(
    `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  
  return result.rows[0];
}

/**
 * Update a row by ID and return it
 */
export async function update<T extends QueryResultRow = QueryResultRow>(
  table: string,
  id: string,
  data: Record<string, any>
): Promise<T | null> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
  
  const result = await query<T>(
    `UPDATE ${table} SET ${setClause} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  
  return result.rows[0] || null;
}

/**
 * Delete a row by ID
 */
export async function deleteById(
  table: string,
  id: string
): Promise<boolean> {
  const result = await query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  return (result.rowCount || 0) > 0;
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await query('SELECT NOW()');
    console.log('[DB] Connection test successful');
    return true;
  } catch (error) {
    console.error('[DB] Connection test failed:', error);
    return false;
  }
}

// Export the pool for advanced use cases
export { getPool };
