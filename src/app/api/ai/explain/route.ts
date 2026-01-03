// src/app/api/ai/explain/route.ts
// PURPOSE: AI-powered vocabulary explanation endpoint
// ACTION: Provides detailed explanations for words/phrases
// MECHANISM: Validates auth, reserves credits atomically, calls AI provider for explanation

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { transaction } from '@/lib/db/client';
import { ai } from '@/lib/ai/aiProvider';
import { z } from 'zod';
import { RateLimiters, getRateLimitHeaders } from '@/lib/security/rate-limit';

// =============================================================================
// Request Validation Schema
// =============================================================================

const ExplainRequestSchema = z.object({
  word: z.string().min(1).max(500),
  context: z.string().max(2000).optional(),
  language: z.string().min(2).max(10).optional(),
});

// Credit cost for explain operation
const EXPLAIN_CREDIT_COST = 1;

// =============================================================================
// Sanitized Error Response
// =============================================================================

function sanitizedErrorResponse(
  error: unknown,
  context: string
): NextResponse {
  console.error(`[AI Explain Error] ${context}:`, error);
  
  let statusCode = 500;
  let userMessage = 'An error occurred while processing your request.';
  
  if (error instanceof z.ZodError) {
    statusCode = 400;
    userMessage = 'Invalid request format. Please check your input.';
  } else if (error instanceof Error) {
    if (error.message.includes('Insufficient')) {
      statusCode = 429;
      userMessage = error.message;
    } else if (error.message.includes('Unauthorized')) {
      statusCode = 401;
      userMessage = 'Authentication required.';
    }
  }
  
  return NextResponse.json(
    { error: userMessage },
    { status: statusCode }
  );
}

// =============================================================================
// Route Handler
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = getUserId(user);

    // 2. Rate limiting per user - prevent API abuse
    const rateLimit = RateLimiters.aiApi(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    // 3. Validate and extract request body
    const body = await request.json();
    const validationResult = ExplainRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return sanitizedErrorResponse(validationResult.error, 'Validation failed');
    }
    
    const { word, context = '', language = 'en' } = validationResult.data;

    // 3. ATOMIC: Check credit availability AND reserve in single transaction
    await transaction(async (client) => {
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
      
      if (profile.tier === 'free') {
        const remaining = profile.ai_credits_limit - profile.ai_credits_used;
        if (remaining < EXPLAIN_CREDIT_COST) {
          throw new Error(
            `Insufficient AI credits. You need ${EXPLAIN_CREDIT_COST} credit ` +
            `but only have ${remaining} remaining.`
          );
        }
      }
      
      await client.query(
        `UPDATE profiles 
         SET ai_credits_used = ai_credits_used + $1 
         WHERE id = $2`,
        [EXPLAIN_CREDIT_COST, userId]
      );
      
      return { reserved: true };
    });

    // 4. Call AI Provider (credits already reserved)
    let aiResult;
    try {
      aiResult = await ai.explain(word, context, language);
    } catch (aiError) {
      console.error('[AI Explain] AI call failed, refunding credits:', aiError);
      
      await transaction(async (client) => {
        await client.query(
          `UPDATE profiles 
           SET ai_credits_used = GREATEST(0, ai_credits_used - $1) 
           WHERE id = $2`,
          [EXPLAIN_CREDIT_COST, userId]
        );
      });
      
      throw new Error('AI processing failed. Credits have been refunded.');
    }

    // 5. Return successful result
    return NextResponse.json({
      ...aiResult,
      creditsUsed: EXPLAIN_CREDIT_COST,
    });
    
  } catch (error: unknown) {
    return sanitizedErrorResponse(error, 'Route handler');
  }
}

