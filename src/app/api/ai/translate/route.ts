// src/app/api/ai/translate/route.ts
// PURPOSE: AI-powered translation endpoint with Glossary Guard integration
// ACTION: Translates text using configured AI provider with terminology enforcement
// MECHANISM: Validates auth, reserves credits atomically, injects glossary context, calls AI provider

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { transaction } from '@/lib/db/client';
import { ai } from '@/lib/ai/aiProvider';
import { z } from 'zod';
import { RateLimiters, getRateLimitHeaders } from '@/lib/security/rate-limit';

// =============================================================================
// Request Validation Schema
// =============================================================================

const GlossaryEntrySchema = z.object({
  sourceTerm: z.string().min(1).max(200),
  targetTerm: z.string().min(1).max(200),
});

const TranslateRequestSchema = z.object({
  text: z.string().min(1).max(50000), // Max ~50k chars per request
  sourceLang: z.string().min(2).max(10),
  targetLang: z.string().min(2).max(10),
  glossary: z.array(GlossaryEntrySchema).max(100).optional(),
});

type GlossaryEntry = z.infer<typeof GlossaryEntrySchema>;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Filters and generates a SLIM glossary context (only terms found in text).
 * This reduces token overhead by ~80% compared to sending all entries.
 */
function generateSlimGlossaryContext(
  text: string,
  entries: GlossaryEntry[] | undefined
): string {
  if (!entries || entries.length === 0) return '';
  
  // Only include terms that actually appear in the source text
  const lowerText = text.toLowerCase();
  const relevantEntries = entries.filter(e => 
    lowerText.includes(e.sourceTerm.toLowerCase())
  );
  
  if (relevantEntries.length === 0) return '';
  
  // Minimal format to reduce tokens
  const rules = relevantEntries.slice(0, 15).map(e => `"${e.sourceTerm}"="${e.targetTerm}"`).join(', ');
  return `\n[Required: ${rules}]`;
}

/**
 * Calculate credit cost based on text length.
 * 1 Unit = ~500 characters (approx 1 standard paragraph)
 */
function calculateCreditCost(text: string): number {
  return Math.max(1, Math.ceil(text.length / 500));
}

// =============================================================================
// Sanitized Error Response
// =============================================================================

/**
 * Returns a safe, generic error message to the client.
 * Logs the real error server-side but never exposes internal details.
 */
function sanitizedErrorResponse(
  error: unknown,
  context: string
): NextResponse {
  // Log full error for debugging (server-side only)
  console.error(`[AI Translation Error] ${context}:`, error);
  
  // Determine appropriate status code
  let statusCode = 500;
  let userMessage = 'An error occurred while processing your request.';
  
  if (error instanceof z.ZodError) {
    statusCode = 400;
    userMessage = 'Invalid request format. Please check your input.';
  } else if (error instanceof Error) {
    // Check for known safe error messages
    if (error.message.includes('Insufficient')) {
      statusCode = 429;
      userMessage = error.message; // This is our own message, safe to expose
    } else if (error.message.includes('Unauthorized')) {
      statusCode = 401;
      userMessage = 'Authentication required.';
    }
    // Never expose SQL errors, stack traces, or internal paths
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
    const validationResult = TranslateRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return sanitizedErrorResponse(validationResult.error, 'Validation failed');
    }
    
    const { text, sourceLang, targetLang, glossary } = validationResult.data;

    // 3. Calculate cost based on text length
    const cost = calculateCreditCost(text);

    // 4. ATOMIC: Check credit availability AND reserve in single transaction
    // This prevents race conditions where concurrent requests could drain credits
    await transaction(async (client) => {
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
        if (remaining < cost) {
          throw new Error(
            `Insufficient AI credits. This request requires ${cost} credits ` +
            `but you only have ${remaining} remaining.`
          );
        }
      }
      
      // Reserve credits BEFORE calling AI (prevents overuse on race conditions)
      await client.query(
        `UPDATE profiles 
         SET ai_credits_used = ai_credits_used + $1 
         WHERE id = $2`,
        [cost, userId]
      );
      
      return { reserved: true };
    });

    // 5. Build enhanced prompt with SLIM Glossary Guard context
    const glossaryContext = generateSlimGlossaryContext(text, glossary);
    const enhancedText = glossaryContext ? `${text}${glossaryContext}` : text;

    // 6. Call AI Provider (credits already reserved)
    let aiResult;
    try {
      aiResult = await ai.translate(enhancedText, sourceLang, targetLang);
    } catch (aiError) {
      // AI failed - refund the reserved credits atomically
      console.error('[AI Translation] AI call failed, refunding credits:', aiError);
      
      await transaction(async (client) => {
        await client.query(
          `UPDATE profiles 
           SET ai_credits_used = GREATEST(0, ai_credits_used - $1) 
           WHERE id = $2`,
          [cost, userId]
        );
      });
      
      // Re-throw to trigger error response
      throw new Error('AI processing failed. Credits have been refunded.');
    }

    // 7. Return successful result with cost info
    return NextResponse.json({ 
      ...aiResult, 
      costUsed: cost,
      glossaryApplied: (glossary?.length ?? 0) > 0 
    });
    
  } catch (error: unknown) {
    return sanitizedErrorResponse(error, 'Route handler');
  }
}

