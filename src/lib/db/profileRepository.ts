// src/lib/db/profileRepository.ts
// PURPOSE: Repository for profile-related database operations
// ACTION: Encapsulates all profile CRUD operations and credit management
// MECHANISM: Uses the transaction helper for atomic operations

import { QueryResultRow } from 'pg';
import { query, transaction } from './client';

// =============================================================================
// Types
// =============================================================================

export interface Profile {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  tier: 'free' | 'pro' | 'enterprise';
  avatar_url: string | null;
  ai_credits_used: number;
  ai_credits_limit: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  preferred_locale: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileCredits {
  ai_credits_used: number;
  ai_credits_limit: number;
  tier: string;
}

export interface CreditReservationResult {
  reserved: boolean;
  tier: string;
  creditsUsed: number;
  creditsLimit: number;
}

// =============================================================================
// Profile Queries
// =============================================================================

/**
 * Find a profile by ID.
 */
export async function findProfileById(id: string): Promise<Profile | null> {
  const result = await query<Profile>(
    'SELECT * FROM profiles WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Find a profile by email.
 */
export async function findProfileByEmail(email: string): Promise<Profile | null> {
  const result = await query<Profile>(
    'SELECT * FROM profiles WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

/**
 * Get profile credit information for display.
 */
export async function getProfileCredits(userId: string): Promise<ProfileCredits | null> {
  const result = await query<ProfileCredits>(
    'SELECT ai_credits_used, ai_credits_limit, tier FROM profiles WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

// =============================================================================
// Atomic Credit Operations
// =============================================================================

/**
 * Reserve credits for an AI operation atomically.
 * This prevents race conditions where concurrent requests could drain credits.
 * 
 * @param userId - The user's ID
 * @param creditCost - Number of credits to reserve
 * @returns Reservation result with tier info, or throws if insufficient credits
 */
export async function reserveCredits(
  userId: string, 
  creditCost: number
): Promise<CreditReservationResult> {
  return transaction(async (client) => {
    // Lock the row for update to prevent concurrent modifications
    const profileResult = await client.query<{
      ai_credits_used: number;
      ai_credits_limit: number;
      tier: string;
    }>(
      `SELECT ai_credits_used, ai_credits_limit, tier 
       FROM profiles 
       WHERE id = $1 
       FOR UPDATE`,
      [userId]
    );
    
    const profile = profileResult.rows[0];
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    // Check credit availability for free tier users
    if (profile.tier === 'free') {
      const remaining = profile.ai_credits_limit - profile.ai_credits_used;
      if (remaining < creditCost) {
        throw new Error(
          `Insufficient AI credits. You need ${creditCost} credits ` +
          `but only have ${remaining} remaining.`
        );
      }
    }
    
    // Reserve credits BEFORE calling AI (prevents overuse on race conditions)
    await client.query(
      `UPDATE profiles 
       SET ai_credits_used = ai_credits_used + $1 
       WHERE id = $2`,
      [creditCost, userId]
    );
    
    return { 
      reserved: true, 
      tier: profile.tier,
      creditsUsed: profile.ai_credits_used + creditCost,
      creditsLimit: profile.ai_credits_limit,
    };
  });
}

/**
 * Refund credits after a failed AI operation.
 * Uses GREATEST to prevent negative credit usage.
 * 
 * @param userId - The user's ID
 * @param creditAmount - Number of credits to refund
 */
export async function refundCredits(
  userId: string, 
  creditAmount: number
): Promise<void> {
  await transaction(async (client) => {
    await client.query(
      `UPDATE profiles 
       SET ai_credits_used = GREATEST(0, ai_credits_used - $1) 
       WHERE id = $2`,
      [creditAmount, userId]
    );
  });
}

/**
 * Increment credit usage without locking (for simpler operations).
 */
export async function incrementCredits(
  userId: string, 
  amount: number
): Promise<void> {
  await query(
    `UPDATE profiles 
     SET ai_credits_used = ai_credits_used + $1 
     WHERE id = $2`,
    [amount, userId]
  );
}

// =============================================================================
// Profile Updates
// =============================================================================

interface UpdateProfileData {
  name?: string;
  avatar_url?: string;
  preferred_locale?: string;
}

/**
 * Update a user's profile with allowlisted fields only.
 */
export async function updateProfile(
  userId: string, 
  data: UpdateProfileData
): Promise<Profile | null> {
  // Build dynamic update query from provided fields
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 2; // Start at 2 because $1 is the user ID
  
  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.avatar_url !== undefined) {
    updates.push(`avatar_url = $${paramIndex++}`);
    values.push(data.avatar_url);
  }
  if (data.preferred_locale !== undefined) {
    updates.push(`preferred_locale = $${paramIndex++}`);
    values.push(data.preferred_locale);
  }
  
  if (updates.length === 0) {
    return findProfileById(userId);
  }
  
  updates.push(`updated_at = NOW()`);
  
  const result = await query<Profile>(
    `UPDATE profiles SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
    [userId, ...values]
  );
  
  return result.rows[0] || null;
}

// =============================================================================
// Stripe Integration
// =============================================================================

/**
 * Update Stripe customer/subscription IDs for a user.
 */
export async function updateStripeInfo(
  userId: string,
  data: { stripe_customer_id?: string; stripe_subscription_id?: string }
): Promise<void> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 2;
  
  if (data.stripe_customer_id !== undefined) {
    updates.push(`stripe_customer_id = $${paramIndex++}`);
    values.push(data.stripe_customer_id);
  }
  if (data.stripe_subscription_id !== undefined) {
    updates.push(`stripe_subscription_id = $${paramIndex++}`);
    values.push(data.stripe_subscription_id);
  }
  
  if (updates.length === 0) return;
  
  updates.push(`updated_at = NOW()`);
  
  await query(
    `UPDATE profiles SET ${updates.join(', ')} WHERE id = $1`,
    [userId, ...values]
  );
}

/**
 * Upgrade a user's tier and adjust their credit limit.
 */
export async function upgradeTier(
  userId: string,
  newTier: 'pro' | 'enterprise',
  newCreditLimit: number
): Promise<void> {
  await query(
    `UPDATE profiles 
     SET tier = $1, ai_credits_limit = $2, updated_at = NOW() 
     WHERE id = $3`,
    [newTier, newCreditLimit, userId]
  );
}

/**
 * Downgrade a user to free tier (e.g., after subscription cancellation).
 */
export async function downgradeToFree(userId: string): Promise<void> {
  await query(
    `UPDATE profiles 
     SET tier = 'free', ai_credits_limit = 100, updated_at = NOW() 
     WHERE id = $1`,
    [userId]
  );
}

// =============================================================================
// Existence Checks
// =============================================================================

/**
 * Check if an email is already registered.
 * Used during signup to prevent duplicate accounts.
 */
export async function emailExists(email: string): Promise<boolean> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM profiles WHERE email = $1',
    [email]
  );
  return parseInt(result.rows[0]?.count || '0', 10) > 0;
}
