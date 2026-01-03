// src/app/api/ai/annotate/route.ts
// PURPOSE: AI-powered annotation endpoint
// ACTION: Generates educational annotations for bilingual text pairs
// MECHANISM: Validates auth, reserves credits atomically via repository, calls AI provider

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { reserveCredits, refundCredits } from '@/lib/db/profileRepository';
import { ai } from '@/lib/ai/aiProvider';
import { z } from 'zod';
import { RateLimiters, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { logger, getErrorMessage } from '@/lib/logger';

// =============================================================================
// Request Validation Schema
// =============================================================================

const AnnotateRequestSchema = z.object({
  L1Text: z.string().min(1).max(10000),
  L2Text: z.string().min(1).max(10000),
  L1Lang: z.string().min(2).max(10),
  L2Lang: z.string().min(2).max(10),
});

// Credit cost for annotation operation
const ANNOTATION_CREDIT_COST = 2;

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
  logger.error(`AI Annotation Error: ${context}`, error, { module: 'AI-Annotate' });
  
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
    const validationResult = AnnotateRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return sanitizedErrorResponse(validationResult.error, 'Validation failed');
    }
    
    const { L1Text, L2Text, L1Lang, L2Lang } = validationResult.data;

    // 4. ATOMIC: Reserve credits using repository (prevents race conditions)
    const reservationResult = await reserveCredits(userId, ANNOTATION_CREDIT_COST);

    // 5. Call AI Provider (credits already reserved)
    let aiResult;
    try {
      aiResult = await ai.annotate(L1Text, L2Text, L1Lang, L2Lang);
    } catch (aiError: unknown) {
      // AI failed - refund the reserved credits atomically
      logger.error('AI call failed, refunding credits', aiError, { module: 'AI-Annotate' });
      
      await refundCredits(userId, ANNOTATION_CREDIT_COST);
      
      // Re-throw to trigger error response
      throw new Error('AI processing failed. Credits have been refunded.');
    }

    // 6. Return successful result
    return NextResponse.json({
      ...aiResult,
      creditsUsed: ANNOTATION_CREDIT_COST,
    });
    
  } catch (error: unknown) {
    return sanitizedErrorResponse(error, 'Route handler');
  }
}

