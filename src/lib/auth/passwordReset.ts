// src/lib/auth/passwordReset.ts
// PURPOSE: Password reset token generation and validation
// ACTION: Creates, validates, and consumes password reset tokens
// MECHANISM: Uses crypto for secure token generation, hashed storage in DB

import { randomBytes, createHash } from 'crypto';
import { query, transaction } from '@/lib/db/client';

const TOKEN_EXPIRY_HOURS = 1; // Reset tokens valid for 1 hour

/**
 * Hash a token for secure storage
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Create a password reset token for a user
 * @returns The raw token (to be sent in email) - NOT the hash
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  // Generate a secure random token
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  
  // Calculate expiry time
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  
  // Invalidate any existing unused tokens for this user
  await query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
    [userId]
  );
  
  // Insert new token
  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt.toISOString()]
  );
  
  return token;
}

interface ValidatedToken {
  userId: string;
  email: string;
}

/**
 * Validate a password reset token
 * @returns User info if valid, null if invalid/expired
 */
export async function validatePasswordResetToken(token: string): Promise<ValidatedToken | null> {
  const tokenHash = hashToken(token);
  
  const result = await query<{
    user_id: string;
    expires_at: Date;
    used_at: Date | null;
    email: string;
  }>(
    `SELECT prt.user_id, prt.expires_at, prt.used_at, p.email
     FROM password_reset_tokens prt
     JOIN profiles p ON p.id = prt.user_id
     WHERE prt.token_hash = $1`,
    [tokenHash]
  );
  
  const row = result.rows[0];
  if (!row) {
    return null; // Token not found
  }
  
  // Check if token was already used
  if (row.used_at) {
    return null;
  }
  
  // Check if token has expired
  if (new Date(row.expires_at) < new Date()) {
    return null;
  }
  
  return {
    userId: row.user_id,
    email: row.email,
  };
}

/**
 * Consume (mark as used) a password reset token
 */
export async function consumePasswordResetToken(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);
  
  const result = await query(
    `UPDATE password_reset_tokens 
     SET used_at = NOW() 
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
     RETURNING id`,
    [tokenHash]
  );
  
  return (result.rowCount ?? 0) > 0;
}

/**
 * Update user's password
 */
export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  await query(
    'UPDATE profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [passwordHash, userId]
  );
}

/**
 * Get user by email for password reset request
 */
export async function getUserByEmailForReset(email: string): Promise<{ id: string; name: string | null; auth_provider: string | null } | null> {
  const result = await query<{ id: string; name: string | null; auth_provider: string | null }>(
    'SELECT id, name, auth_provider FROM profiles WHERE email = $1',
    [email.toLowerCase()]
  );
  
  return result.rows[0] || null;
}
