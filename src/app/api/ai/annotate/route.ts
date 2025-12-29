// src/app/api/ai/annotate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ai } from '@/lib/ai/aiProvider';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { L1Text, L2Text, L1Lang, L2Lang } = await request.json();

  try {
    const result = await ai.annotate(L1Text, L2Text, L1Lang, L2Lang);

    // Track usage (using 2 credits for complex annotation)
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_credits_used')
      .eq('id', user.id)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ ai_credits_used: (profile.ai_credits_used || 0) + 2 })
        .eq('id', user.id);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Annotation Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal AI Error' }, { status: 500 });
  }
}
