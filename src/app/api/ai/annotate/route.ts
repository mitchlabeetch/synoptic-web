// src/app/api/ai/annotate/route.ts
// PURPOSE: AI-powered annotation endpoint
// ACTION: Generates educational annotations for bilingual text pairs
// MECHANISM: Validates auth, calls AI provider for annotation analysis

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
    const { L1Text, L2Text, L1Lang, L2Lang } = await request.json();

    // 3. Call AI Provider
    const result = await ai.annotate(L1Text, L2Text, L1Lang, L2Lang);

    // 4. Track usage (2 credits for annotation)
    await query(
      'UPDATE profiles SET ai_credits_used = ai_credits_used + 2 WHERE id = $1',
      [userId]
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Annotation Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal AI Error' },
      { status: 500 }
    );
  }
}
