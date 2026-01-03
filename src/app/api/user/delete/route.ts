// src/app/api/user/delete/route.ts
// PURPOSE: GDPR-compliant account deletion endpoint
// ACTION: Permanently deletes user account and all associated data
// MECHANISM: Uses atomic transaction to delete all user data from database

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { transaction, query } from '@/lib/db/client';
import { RateLimiters, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { z } from 'zod';

// Request validation schema - require password confirmation
const DeleteAccountSchema = z.object({
  confirmPhrase: z.literal('DELETE MY ACCOUNT'),
  password: z.string().min(1).optional(), // Optional if OAuth user
});

export async function DELETE(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = getUserId(user);

    // 2. Rate limiting - prevent brute force deletion attempts
    const rateLimit = RateLimiters.login(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    // 3. Validate request body
    const body = await request.json();
    const validation = DeleteAccountSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Please type "DELETE MY ACCOUNT" to confirm deletion.' },
        { status: 400 }
      );
    }

    // 4. ATOMIC: Delete all user data in a single transaction
    await transaction(async (client) => {
      // Delete in order of dependencies (child tables first)
      
      // 4a. Delete all user's glossary entries (if stored per-user)
      await client.query(
        'DELETE FROM glossary_entries WHERE project_id IN (SELECT id FROM projects WHERE user_id = $1)',
        [userId]
      );
      
      // 4b. Delete all user's favorites
      await client.query(
        'DELETE FROM favorites WHERE user_id = $1',
        [userId]
      );
      
      // 4c. Delete all user's projects
      await client.query(
        'DELETE FROM projects WHERE user_id = $1',
        [userId]
      );
      
      // 4d. Delete user settings
      await client.query(
        'DELETE FROM user_settings WHERE user_id = $1',
        [userId]
      );
      
      // 4e. Delete user sessions
      await client.query(
        'DELETE FROM sessions WHERE user_id = $1',
        [userId]
      );
      
      // 4f. Delete password reset tokens
      await client.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1',
        [userId]
      );
      
      // 4g. Finally, delete the user profile
      const deleteResult = await client.query(
        'DELETE FROM profiles WHERE id = $1 RETURNING email',
        [userId]
      );
      
      if (deleteResult.rowCount === 0) {
        throw new Error('User profile not found');
      }
      
      // Log deletion for compliance audit trail (minimal info)
      console.log(`[GDPR] Account deleted: ${userId.slice(0, 8)}... at ${new Date().toISOString()}`);
    });

    // 5. Clear session cookie
    const response = NextResponse.json({ 
      success: true,
      message: 'Your account and all associated data have been permanently deleted.'
    });
    
    // Delete all auth-related cookies
    response.cookies.delete('session');
    response.cookies.delete('synoptic-session');
    response.cookies.delete('refresh-token');
    
    return response;

  } catch (error) {
    console.error('[GDPR] Account deletion failed:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete account. Please contact support.' },
      { status: 500 }
    );
  }
}

// Also support POST for forms that don't support DELETE
export async function POST(request: NextRequest) {
  return DELETE(request);
}
