// src/app/api/ai/translate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ai } from '@/lib/ai/aiProvider';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Extract request body
  const { text, sourceLang, targetLang } = await request.json();
  if (!text) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  try {
    // 3. Check credits (simplistic version for now)
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_credits_used, ai_credits_limit, tier')
      .eq('id', user.id)
      .single();

    if (profile && profile.tier === 'free' && profile.ai_credits_used >= profile.ai_credits_limit) {
      return NextResponse.json({ error: 'AI limit reached' }, { status: 429 });
    }

    // 4. Call AI Provider
    const result = await ai.translate(text, sourceLang, targetLang);

    // 5. Increment usage (non-blocking log)
    if (profile) {
      await supabase
        .from('profiles')
        .update({ ai_credits_used: (profile.ai_credits_used || 0) + 1 })
        .eq('id', user.id);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Translation Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal AI Error' }, { status: 500 });
  }
}
