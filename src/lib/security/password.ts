// src/lib/security/password.ts
// PURPOSE: Centralized password hashing with environment-aware configuration
// ACTION: Provides secure password hashing and verification
// MECHANISM: Uses bcryptjs with optimized cost factors for different environments

import bcrypt from 'bcryptjs';

/**
 * BCRYPT COST FACTOR CONFIGURATION
 * 
 * Trade-off Analysis:
 * - Higher cost = more secure but slower (can block event loop)
 * - Lower cost = faster but less resistant to brute force
 * 
 * PRODUCTION NOTE (bcryptjs vs native bcrypt):
 * We use bcryptjs (pure JavaScript) rather than native bcrypt because:
 * 1. Vercel serverless functions don't support native bindings well
 * 2. bcryptjs is compatible with all deployment environments
 * 3. For cost factor 12, the performance difference is acceptable
 * 
 * If you have high-traffic auth endpoints, consider:
 * 1. Offloading auth to a dedicated service (Auth0, Clerk)
 * 2. Using Argon2 with a background worker
 * 3. Implementing request queuing to prevent event loop blocking
 * 
 * Current cost factors:
 * - Production: 12 (secure, ~250-400ms on modern servers)
 * - Development: 10 (faster, ~60-100ms for quicker dev iteration)
 */
const BCRYPT_COST_PRODUCTION = 12;
const BCRYPT_COST_DEVELOPMENT = 10;

function getBcryptCost(): number {
  return process.env.NODE_ENV === 'production' 
    ? BCRYPT_COST_PRODUCTION 
    : BCRYPT_COST_DEVELOPMENT;
}

/**
 * Hash a password securely using bcrypt.
 * 
 * @param password - The plain text password to hash
 * @returns The bcrypt hash
 */
export async function hashPassword(password: string): Promise<string> {
  const cost = getBcryptCost();
  return bcrypt.hash(password, cost);
}

/**
 * Verify a password against a stored hash.
 * 
 * @param password - The plain text password to verify
 * @param hash - The stored bcrypt hash
 * @returns True if the password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Perform a constant-time comparison even when the user doesn't exist.
 * This prevents timing attacks that could reveal user existence.
 * 
 * @param password - The password to "verify" (result is ignored)
 */
export async function timingAttackMitigation(password: string): Promise<void> {
  // This hash is intentionally invalid but takes the same time to compare
  // as a real hash, preventing timing-based user enumeration
  await bcrypt.compare(password, '$2a$12$invalid.hash.to.prevent.timing.attacks');
}

/**
 * Check if a hash needs to be upgraded due to changed cost factor.
 * Call this after successful login to upgrade old hashes.
 * 
 * @param hash - The current password hash
 * @returns True if the hash should be upgraded
 */
export function hashNeedsUpgrade(hash: string): boolean {
  // Extract the cost factor from the hash (format: $2a$XX$...)
  const match = hash.match(/^\$2[aby]?\$(\d{2})\$/);
  if (!match) return true; // Invalid hash format, definitely upgrade
  
  const currentCost = parseInt(match[1], 10);
  const targetCost = getBcryptCost();
  
  return currentCost < targetCost;
}
