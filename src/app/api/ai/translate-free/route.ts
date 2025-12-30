// src/app/api/ai/translate-free/route.ts
// PURPOSE: Free translation endpoint using LibreTranslate
// ACTION: Provides machine translation without AI credits
// MECHANISM: Proxies to LibreTranslate (free, no auth required for light use)

import { NextRequest, NextResponse } from 'next/server';

const LIBRE_TRANSLATE_URL = process.env.LIBRE_TRANSLATE_URL || 'https://libretranslate.com';
const LIBRE_TRANSLATE_API_KEY = process.env.LIBRE_TRANSLATE_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { text, source, target, batch } = await req.json();

    // Validate input
    if (!text && !batch) {
      return NextResponse.json(
        { error: 'Missing required field: text or batch' },
        { status: 400 }
      );
    }
    if (!target) {
      return NextResponse.json(
        { error: 'Missing required field: target' },
        { status: 400 }
      );
    }

    // Rate limit: max 1000 chars for free endpoint to prevent abuse
    const textLength = text?.length || (batch?.join(' ').length || 0);
    if (textLength > 5000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 5000 characters for free translation.' },
        { status: 400 }
      );
    }

    // Handle batch translations (for word-by-word tables)
    if (batch && Array.isArray(batch)) {
      const results = await Promise.allSettled(
        batch.slice(0, 50).map(async (item: string) => { // Max 50 items
          const response = await fetch(`${LIBRE_TRANSLATE_URL}/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              q: item,
              source: source || 'auto',
              target,
              format: 'text',
              api_key: LIBRE_TRANSLATE_API_KEY || undefined,
            }),
          });
          
          if (!response.ok) throw new Error('Translation failed');
          const data = await response.json();
          return data.translatedText;
        })
      );

      return NextResponse.json({
        translations: results.map((r, i) =>
          r.status === 'fulfilled' ? r.value : batch[i]
        ),
      });
    }

    // Single translation
    const response = await fetch(`${LIBRE_TRANSLATE_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: source || 'auto',
        target,
        format: 'text',
        api_key: LIBRE_TRANSLATE_API_KEY || undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error || 'Translation failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      translatedText: data.translatedText,
      detectedLanguage: data.detectedLanguage,
      source: 'libretranslate',
      creditsFree: true,
    });
  } catch (error) {
    console.error('Free Translation API error:', error);
    return NextResponse.json(
      { error: 'Translation service unavailable' },
      { status: 503 }
    );
  }
}
