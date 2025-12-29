// src/app/api/ai/translate/route.ts
// PURPOSE: AI-powered translation endpoint
// ACTION: Translates text using configured AI provider
// MECHANISM: Validates auth, checks credits, calls AI provider

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

    // 2. Extract request body
    const { text, sourceLang, targetLang } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // 3. Check credits
    const profile = await query(
      'SELECT ai_credits_used, ai_credits_limit, tier FROM profiles WHERE id = $1',
      [userId]
    );
    
    const userProfile = profile.rows[0];
    if (userProfile && userProfile.tier === 'free' && 
        userProfile.ai_credits_used >= userProfile.ai_credits_limit) {
      return NextResponse.json({ error: 'AI limit reached' }, { status: 429 });
    }

    // 4. Call AI Provider
    const result = await ai.translate(text, sourceLang, targetLang);

    // 5. Increment usage
    await query(
      'UPDATE profiles SET ai_credits_used = ai_credits_used + 1 WHERE id = $1',
      [userId]
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Translation Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal AI Error' },
      { status: 500 }
    );
  }
}
