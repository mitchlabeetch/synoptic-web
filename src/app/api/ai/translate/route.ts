// src/app/api/ai/translate/route.ts
// PURPOSE: AI-powered translation endpoint with Glossary Guard integration
// ACTION: Translates text using configured AI provider with terminology enforcement
// MECHANISM: Validates auth, checks credits, injects glossary context, calls AI provider

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { query } from '@/lib/db/client';
import { ai } from '@/lib/ai/aiProvider';

/**
 * Glossary entry passed from frontend for terminology enforcement.
 */
interface GlossaryEntry {
  sourceTerm: string;
  targetTerm: string;
}

/**
 * Filters and generates a SLIM glossary context (only terms found in text).
 * This reduces token overhead by ~80% compared to sending all entries.
 */
function generateSlimGlossaryContext(
  text: string,
  entries: GlossaryEntry[]
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

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = getUserId(user);

    // 2. Extract request body and VALIDATE length
    // NEW: Accept optional glossary entries for terminology enforcement
    const { text, sourceLang, targetLang, glossary } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // NEW: Calculate Cost based on "Fair Use"
    // 1 Unit = ~500 characters (approx 1 standard paragraph)
    // Minimum 1 unit per request.
    const charCount = text.length;
    const cost = Math.max(1, Math.ceil(charCount / 500));

    // 3. Check credits (Updated to use 'cost')
    const profile = await query(
      'SELECT ai_credits_used, ai_credits_limit, tier FROM profiles WHERE id = $1',
      [userId]
    );
    
    const userProfile = profile.rows[0];
    // Check if they have enough for THIS specific operation
    if (userProfile && userProfile.tier === 'free') {
      const remaining = userProfile.ai_credits_limit - userProfile.ai_credits_used;
      if (remaining < cost) {
        return NextResponse.json({ 
          error: 'Insufficient AI Units',
          detail: `This block requires ${cost} units, but you only have ${remaining} left.` 
        }, { status: 429 });
      }
    }

    // 4. Build enhanced prompt with SLIM Glossary Guard context (only relevant terms)
    const glossaryContext = generateSlimGlossaryContext(text, glossary as GlossaryEntry[]);
    const enhancedText = glossaryContext ? `${text}${glossaryContext}` : text;

    // 5. Call AI Provider with enhanced context
    const result = await ai.translate(enhancedText, sourceLang, targetLang);

    // 6. Increment usage by COST, not just 1
    await query(
      'UPDATE profiles SET ai_credits_used = ai_credits_used + $1 WHERE id = $2',
      [cost, userId]
    );

    // Return cost and glossary application info for frontend visibility
    return NextResponse.json({ 
      ...result, 
      costUsed: cost,
      glossaryApplied: glossary?.length > 0 
    });
  } catch (error: unknown) {
    console.error('AI Translation Route Error:', error);
    const message = error instanceof Error ? error.message : 'Internal AI Error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
