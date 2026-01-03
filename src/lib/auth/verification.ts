// src/lib/auth/verification.ts
// PURPOSE: Email verification token generation and validation
// ACTION: Create, validate, and resend verification tokens
// MECHANISM: Generates secure time-limited tokens, validates against database

import { query } from '@/lib/db/client';
import crypto from 'crypto';

// Token validity duration
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24; // 24 hours

export interface VerificationTokenResult {
  userId: string;
  email: string;
  expiresAt: Date;
}

/**
 * Generate a new email verification token for a user
 */
export async function createVerificationToken(userId: string, email: string): Promise<string> {
  // Generate a secure random token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  
  // Delete any existing tokens for this user
  await query(
    'DELETE FROM email_verification_tokens WHERE user_id = $1',
    [userId]
  );
  
  // Insert new token
  await query(
    `INSERT INTO email_verification_tokens (user_id, token_hash, email, expires_at, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [userId, tokenHash, email, expiresAt.toISOString()]
  );
  
  return token;
}

/**
 * Validate a verification token and return user info if valid
 */
export async function validateVerificationToken(token: string): Promise<VerificationTokenResult | null> {
  const tokenHash = hashToken(token);
  
  const result = await query(
    `SELECT user_id, email, expires_at
     FROM email_verification_tokens
     WHERE token_hash = $1
     AND expires_at > NOW()`,
    [tokenHash]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    userId: row.user_id,
    email: row.email,
    expiresAt: new Date(row.expires_at),
  };
}

/**
 * Mark a user's email as verified
 */
export async function markEmailVerified(userId: string): Promise<void> {
  await query(
    `UPDATE profiles SET email_verified = true, updated_at = NOW() WHERE id = $1`,
    [userId]
  );
  
  // Delete the used token
  await query(
    'DELETE FROM email_verification_tokens WHERE user_id = $1',
    [userId]
  );
}

/**
 * Check if a user's email is verified
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  const result = await query(
    'SELECT email_verified FROM profiles WHERE id = $1',
    [userId]
  );
  
  if (result.rows.length === 0) {
    return false;
  }
  
  return result.rows[0].email_verified === true;
}

/**
 * Get remaining time until token expires (for UI display)
 */
export async function getTokenExpiryInfo(userId: string): Promise<{ exists: boolean; expiresAt: Date | null; isExpired: boolean }> {
  const result = await query(
    `SELECT expires_at FROM email_verification_tokens WHERE user_id = $1`,
    [userId]
  );
  
  if (result.rows.length === 0) {
    return { exists: false, expiresAt: null, isExpired: true };
  }
  
  const expiresAt = new Date(result.rows[0].expires_at);
  const isExpired = expiresAt < new Date();
  
  return { exists: true, expiresAt, isExpired };
}

/**
 * Delete expired tokens (for cleanup jobs)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await query(
    'DELETE FROM email_verification_tokens WHERE expires_at < NOW()'
  );
  
  return result.rowCount || 0;
}

/**
 * Hash a token for secure storage
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
