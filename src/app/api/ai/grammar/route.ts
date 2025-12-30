// src/app/api/ai/grammar/route.ts
// PURPOSE: Grammar checking endpoint using LanguageTool
// ACTION: Validates text for grammar, spelling, and style issues
// MECHANISM: Proxies to LanguageTool API (free tier)

import { NextRequest, NextResponse } from 'next/server';

const LANGUAGE_TOOL_URL = process.env.LANGUAGE_TOOL_URL || 'https://api.languagetool.org/v2';

export async function POST(req: NextRequest) {
  try {
    const { text, language, motherTongue, level } = await req.json();

    // Validate input
    if (!text || text.trim().length < 3) {
      return NextResponse.json(
        { error: 'Text must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Rate limit: max 10000 chars to stay within free tier limits
    if (text.length > 10000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 10000 characters.' },
        { status: 400 }
      );
    }

    // Build request params
    const params = new URLSearchParams();
    params.append('text', text);
    params.append('language', language || 'auto');
    
    if (motherTongue) {
      params.append('motherTongue', motherTongue);
    }
    if (level) {
      params.append('level', level); // 'picky' or 'default'
    }

    // Call LanguageTool
    const response = await fetch(`${LANGUAGE_TOOL_URL}/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: 'Grammar check service unavailable' },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json({
      matches: result.matches || [],
      language: result.language,
      software: result.software,
    });
  } catch (error) {
    console.error('Grammar API error:', error);
    return NextResponse.json(
      { error: 'Grammar check service error' },
      { status: 500 }
    );
  }
}
