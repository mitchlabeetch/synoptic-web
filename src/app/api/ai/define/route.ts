// src/app/api/ai/define/route.ts
// PURPOSE: Dictionary lookup endpoint combining multiple APIs
// ACTION: Provides word definitions, etymology, and pronunciation
// MECHANISM: Combines Free Dictionary API and Wiktionary fallback

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const word = searchParams.get('word');
    const lang = searchParams.get('lang') || 'en';

    // Validate input
    if (!word || word.length < 2) {
      return NextResponse.json(
        { error: 'Word must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Clean the word
    const cleanWord = word.trim().toLowerCase();

    // Try Free Dictionary API first
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/${lang}/${encodeURIComponent(cleanWord)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const entry = data[0];
          return NextResponse.json({
            word: entry.word,
            phonetics: entry.phonetics || [],
            meanings: entry.meanings || [],
            origin: entry.origin,
            sourceUrl: entry.sourceUrls?.[0],
            source: 'dictionaryapi.dev',
          });
        }
      }
    } catch (e) {
      console.warn('Free Dictionary API failed, trying Wiktionary:', e);
    }

    // Fallback to Wiktionary
    try {
      const wikiLang = lang === 'en' ? 'en' : lang;
      const response = await fetch(
        `https://${wikiLang}.wiktionary.org/w/api.php?` +
        new URLSearchParams({
          action: 'query',
          titles: cleanWord,
          prop: 'extracts',
          exchars: '1000',
          explaintext: '1',
          format: 'json',
          origin: '*',
        }).toString()
      );

      if (response.ok) {
        const data = await response.json();
        const pages = data.query?.pages;
        
        if (pages) {
          const page = Object.values(pages)[0] as any;
          if (page && !page.missing) {
            return NextResponse.json({
              word: cleanWord,
              phonetics: [],
              meanings: [{
                partOfSpeech: 'unknown',
                definitions: [{
                  definition: page.extract?.slice(0, 500) || 'Definition available on Wiktionary',
                }],
              }],
              sourceUrl: `https://${wikiLang}.wiktionary.org/wiki/${cleanWord}`,
              source: 'wiktionary',
            });
          }
        }
      }
    } catch (e) {
      console.warn('Wiktionary fallback failed:', e);
    }

    // Word not found in any source
    return NextResponse.json(
      { error: 'Word not found', word: cleanWord },
      { status: 404 }
    );
  } catch (error) {
    console.error('Define API error:', error);
    return NextResponse.json(
      { error: 'Definition lookup failed' },
      { status: 500 }
    );
  }
}
