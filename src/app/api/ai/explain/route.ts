// src/app/api/ai/explain/route.ts
// PURPOSE: AI-powered vocabulary explanation endpoint
// ACTION: Provides detailed explanations for words/phrases
// MECHANISM: Validates auth, calls AI provider for explanation

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
    const { word, context, language } = await request.json();
    if (!word) {
      return NextResponse.json({ error: 'Word is required' }, { status: 400 });
    }

    // 3. Call AI Provider
    const result = await ai.explain(word, context, language);

    // 4. Track usage
    await query(
      'UPDATE profiles SET ai_credits_used = ai_credits_used + 1 WHERE id = $1',
      [userId]
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Explain Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal AI Error' },
      { status: 500 }
    );
  }
}
