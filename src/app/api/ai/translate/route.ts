// src/app/api/ai/translate/route.ts
// PURPOSE: AI-powered translation endpoint
// ACTION: Translates text using configured AI provider
// MECHANISM: Validates auth, checks credits with fair-use calculation, calls AI provider

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { query } from '@/lib/db/client';
import { ai } from '@/lib/ai/aiProvider';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = getUserId(user);

    // 2. Extract request body and VALIDATE length
    const { text, sourceLang, targetLang } = await request.json();
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

    // 4. Call AI Provider
    const result = await ai.translate(text, sourceLang, targetLang);

    // 5. Increment usage by COST, not just 1
    await query(
      'UPDATE profiles SET ai_credits_used = ai_credits_used + $1 WHERE id = $2',
      [cost, userId]
    );

    // Return cost in header for frontend visibility
    return NextResponse.json({ ...result, costUsed: cost });
  } catch (error: any) {
    console.error('AI Translation Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal AI Error' },
      { status: 500 }
    );
  }
}
