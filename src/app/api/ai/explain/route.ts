// src/app/api/ai/explain/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ai } from '@/lib/ai/aiProvider';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { word, context, language } = await request.json();
  if (!word) {
    return NextResponse.json({ error: 'Word is required' }, { status: 400 });
  }

  try {
    const result = await ai.explain(word, context, language);
    
    // Tracking
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_credits_used')
      .eq('id', user.id)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ ai_credits_used: (profile.ai_credits_used || 0) + 1 })
        .eq('id', user.id);
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Explain Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal AI Error' }, { status: 500 });
  }
}
