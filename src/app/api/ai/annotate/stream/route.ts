// src/app/api/ai/annotate/stream/route.ts
// PURPOSE: Streaming AI annotation endpoint for long-running tasks
// ACTION: Uses Server-Sent Events to stream annotation progress
// MECHANISM: Avoids Vercel/DO timeout limits by streaming incremental updates

import { NextRequest } from 'next/server';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { reserveCredits, refundCredits } from '@/lib/db/profileRepository';
import { z } from 'zod';
import { RateLimiters, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { logger } from '@/lib/logger';
import { query } from '@/lib/db/client';

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

// DO Gradient AI inference endpoint
const DO_INFERENCE_URL = 'https://inference.do-ai.run/v1/chat/completions';

// =============================================================================
// Text Encoder for Streaming
// =============================================================================

const encoder = new TextEncoder();

function sendSSE(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(encoder.encode(message));
}

// =============================================================================
// Streaming Route Handler
// =============================================================================

// Use Edge runtime for better streaming performance on Vercel
// This also has a longer timeout (30s on Hobby, 5min on Pro)
export const runtime = 'nodejs'; // 'edge' can be used but requires different DB handling
export const maxDuration = 60; // Vercel Pro allows up to 300s

export async function POST(request: NextRequest) {
  // Early validation before streaming
  let userId: string;
  let validatedData: z.infer<typeof AnnotateRequestSchema>;
  
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    userId = getUserId(user);

    // 2. Rate limiting
    const rateLimit = RateLimiters.aiApi(userId);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          ...getRateLimitHeaders(rateLimit)
        }
      });
    }

    // 3. Validate request body
    const body = await request.json();
    const validationResult = AnnotateRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: 'Invalid request format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    validatedData = validationResult.data;
    
    // 4. Reserve credits atomically
    await reserveCredits(userId, ANNOTATION_CREDIT_COST);
    
  } catch (error) {
    logger.error('Pre-stream validation failed', error, { module: 'AI-Annotate-Stream' });
    return new Response(JSON.stringify({ error: 'Request validation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // =============================================================================
  // Create Streaming Response
  // =============================================================================
  
  const stream = new ReadableStream({
    async start(controller) {
      const { L1Text, L2Text, L1Lang, L2Lang } = validatedData;
      
      try {
        // Send initial status
        sendSSE(controller, 'status', { phase: 'started', message: 'Starting annotation...' });
        
        // Phase 1: Retrieve context
        sendSSE(controller, 'status', { phase: 'retrieving', message: 'Retrieving grammar context...' });
        
        const [L1Context, L2Context] = await Promise.all([
          retrieveContext(`grammar syntax word order ${L1Lang}`, L1Lang, 2),
          retrieveContext(`grammar syntax word order ${L2Lang}`, L2Lang, 2),
        ]);
        
        sendSSE(controller, 'context', { 
          L1Chunks: L1Context.length, 
          L2Chunks: L2Context.length 
        });
        
        // Phase 2: Build prompt
        sendSSE(controller, 'status', { phase: 'analyzing', message: 'Analyzing text structure...' });
        
        const systemPrompt = buildSystemPrompt(L1Context, L2Context, L1Lang, L2Lang);
        const userMessage = `SOURCE (${L1Lang}): "${L1Text}"\nTARGET (${L2Lang}): "${L2Text}"`;
        
        // Phase 3: Call AI with streaming
        sendSSE(controller, 'status', { phase: 'generating', message: 'Generating annotations...' });
        
        const accessKey = process.env.DO_PHILOLOGIST_KEY || process.env.NEXT_PUBLIC_AI_AGENT_PHILOLOGIST_ID || '';
        
        const response = await fetch(DO_INFERENCE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessKey}`,
          },
          body: JSON.stringify({
            model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage }
            ],
            max_tokens: 2048,
            temperature: 0.3,
            stream: true, // Enable streaming from AI
          }),
        });

        if (!response.ok) {
          throw new Error(`AI inference failed: ${response.status}`);
        }

        // Stream the AI response
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        let fullResponse = '';
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          
          // Parse SSE chunks from AI
          const lines = chunk.split('\n').filter(line => line.startsWith('data:'));
          for (const line of lines) {
            const jsonStr = line.slice(5).trim();
            if (jsonStr === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                // Send progress with partial content length
                sendSSE(controller, 'progress', { 
                  chars: fullResponse.length,
                  preview: fullResponse.slice(-50) // Last 50 chars as preview
                });
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }

        // Phase 4: Parse final result
        sendSSE(controller, 'status', { phase: 'parsing', message: 'Processing results...' });
        
        const result = parseJSON(fullResponse, { wordGroups: [], arrows: [], notes: [] });
        
        // Phase 5: Complete
        sendSSE(controller, 'complete', {
          ...result,
          creditsUsed: ANNOTATION_CREDIT_COST
        });
        
        logger.info('Streaming annotation completed', { module: 'AI-Annotate-Stream' });
        
      } catch (error) {
        logger.error('Streaming annotation failed', error, { module: 'AI-Annotate-Stream' });
        
        // Refund credits on failure
        try {
          await refundCredits(userId, ANNOTATION_CREDIT_COST);
          sendSSE(controller, 'error', { 
            message: 'AI processing failed. Credits have been refunded.',
            refunded: true 
          });
        } catch (refundError) {
          logger.error('Credit refund failed', refundError, { module: 'AI-Annotate-Stream' });
          sendSSE(controller, 'error', { 
            message: 'AI processing failed. Please contact support.',
            refunded: false 
          });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

// =============================================================================
// Helper Functions
// =============================================================================

async function retrieveContext(
  queryText: string, 
  language: string,
  limit: number = 3
): Promise<string[]> {
  try {
    // Dynamic import for embeddings (only when needed)
    const { pipeline } = await import('@xenova/transformers');
    
    // Get cached extractor or create new
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const output = await extractor(queryText, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(output.data as Float32Array);
    const vectorLiteral = `[${queryVector.join(',')}]`;

    const result = await query<{ content: string; section_title: string; similarity: number }>(
      `SELECT 
         content, 
         section_title,
         1 - (embedding <=> $1::vector) as similarity
       FROM knowledge_base 
       WHERE language = $2 
       ORDER BY embedding <=> $1::vector 
       LIMIT $3`,
      [vectorLiteral, language, limit]
    );

    return result.rows.map(r => r.content);
  } catch (error) {
    console.error('[RAG] Retrieval error:', error);
    return [];
  }
}

function buildSystemPrompt(
  L1Context: string[], 
  L2Context: string[], 
  L1Lang: string, 
  L2Lang: string
): string {
  return `You are "The Philologist" (Llama 3.3 70B), an expert comparative linguist.

${L1Context.length > 0 ? `REFERENCE - ${L1Lang} Grammar:
---
${L1Context.join('\n\n---\n\n')}
---` : ''}

${L2Context.length > 0 ? `REFERENCE - ${L2Lang} Grammar:
---
${L2Context.join('\n\n---\n\n')}
---` : ''}

TASK: Analyze the alignment between these bilingual sentences and provide educational annotations.
Identify word groups by grammatical role, show translation relationships with arrows, and add notes for interesting grammar points.

RESPOND WITH JSON ONLY:
{
  "wordGroups": [
    { "language": "L1", "wordIndices": [0, 1], "role": "Subject", "color": "#3B82F6" }
  ],
  "arrows": [
    { "source": { "language": "L1", "words": [0] }, "target": { "language": "L2", "words": [0] }, "label": "direct translation" }
  ],
  "notes": [
    { "type": "grammar", "wordIndex": 0, "language": "L1", "title": "Note Title", "content": "Explanation..." }
  ]
}`;
}

function parseJSON<T>(response: string, fallback: T): T {
  try {
    const cleaned = response
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    console.error('[RAG] Failed to parse JSON:', response.slice(0, 200));
    return fallback;
  }
}
