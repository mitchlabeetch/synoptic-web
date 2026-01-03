// src/lib/utils/readingTime.ts
// PURPOSE: Calculate reading time based on target language difficulty
// ACTION: Provides accurate reading estimates beyond simple word count
// MECHANISM: Uses language difficulty factors and character density for CJK

import { getLanguageByCode } from '@/data/languages';

// Words per minute by difficulty level (for alphabet-based languages)
// Based on research on L2 reading speeds
const WPM_BY_LEVEL: Record<string, number> = {
  beginner: 100,    // A1-A2: Slow, careful reading
  intermediate: 150, // B1-B2: Moderate pace
  advanced: 200,     // C1-C2: Near-native speed
  native: 250,       // Native speakers
};

// Language difficulty multipliers (relative to native English speaker learning)
// Lower = harder = more time needed
const LANGUAGE_DIFFICULTY: Record<string, number> = {
  // Category I: Closely related (23-24 weeks) - Easiest
  'da': 1.0, 'nl': 1.0, 'it': 1.0, 'no': 1.0, 'pt': 1.0, 'ro': 1.0, 
  'es': 1.0, 'sv': 1.0, 'fr': 1.0, 'ca': 1.0,
  
  // Category II: Similar (30 weeks)
  'de': 0.85, 'id': 0.9, 'ms': 0.9,
  
  // Category III: Linguistic differences (36 weeks)
  'sw': 0.75, 'hi': 0.7, 'hu': 0.7, 'fi': 0.7, 'pl': 0.7, 'cs': 0.7, 
  'el': 0.7, 'tr': 0.7, 'he': 0.65, 'ru': 0.65, 'uk': 0.65,
  
  // Category IV: Significant differences (44 weeks)
  'th': 0.55, 'vi': 0.6, 'fa': 0.55, 'ar': 0.5, 'ko': 0.5,
  
  // Category V: Exceptionally difficult (88 weeks)
  'zh': 0.35, 'zh-TW': 0.35, 'ja': 0.35, 'grc': 0.4, 'la': 0.5,
  
  // Default for unlisted
  'en': 1.0,
};

// Characters per minute for logographic languages (CJK)
// These don't use word counts in the same way
const CPM_CJK: Record<string, number> = {
  beginner: 80,      // ~50-80 characters per minute
  intermediate: 150, // ~100-150 characters per minute
  advanced: 250,     // ~200-300 characters per minute
  native: 400,       // Native readers
};

export interface ReadingTimeResult {
  minutes: number;
  displayTime: string; // e.g., "5 min" or "1 hr 20 min"
  wordCount: number;
  characterCount: number;
  isEstimate: boolean;
  difficultyLevel: string;
  languageFactor: number;
}

/**
 * Calculate reading time for bilingual text
 */
export function calculateReadingTime(
  text: string,
  languageCode: string,
  readerLevel: 'beginner' | 'intermediate' | 'advanced' | 'native' = 'intermediate'
): ReadingTimeResult {
  const lang = getLanguageByCode(languageCode);
  const script = lang?.script || 'latin';
  
  // Clean the text (strip HTML tags)
  const cleanText = text.replace(/<[^>]*>/g, '').trim();
  
  // Character count
  const characterCount = cleanText.length;
  
  // Get difficulty factor
  const difficultyFactor = LANGUAGE_DIFFICULTY[languageCode] || 0.7;
  
  let minutes: number;
  let wordCount: number;
  
  if (script === 'cjk') {
    // CJK: Use character-based calculation
    wordCount = Math.ceil(characterCount / 2); // Rough approximation
    const cpm = CPM_CJK[readerLevel];
    minutes = characterCount / cpm;
  } else {
    // Word-based calculation for alphabetic scripts
    wordCount = cleanText.split(/\s+/).filter(w => w.length > 0).length;
    const baseWpm = WPM_BY_LEVEL[readerLevel];
    const adjustedWpm = baseWpm * difficultyFactor;
    minutes = wordCount / adjustedWpm;
  }
  
  // Round to nearest minute, minimum 1
  minutes = Math.max(1, Math.round(minutes));
  
  return {
    minutes,
    displayTime: formatReadingTime(minutes),
    wordCount,
    characterCount,
    isEstimate: true,
    difficultyLevel: readerLevel,
    languageFactor: difficultyFactor,
  };
}

/**
 * Calculate total reading time for a project
 */
export function calculateProjectReadingTime(
  pages: Array<{ blocks: Array<{ L1?: { content: string }; L2?: { content: string } }> }>,
  targetLang: string,
  readerLevel: 'beginner' | 'intermediate' | 'advanced' | 'native' = 'intermediate'
): ReadingTimeResult {
  // Concatenate all L2 content
  let fullText = '';
  
  for (const page of pages) {
    for (const block of page.blocks) {
      if (block.L2?.content) {
        fullText += ' ' + block.L2.content;
      }
    }
  }
  
  return calculateReadingTime(fullText, targetLang, readerLevel);
}

/**
 * Format minutes into human-readable string
 */
function formatReadingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Get reading time label with difficulty context
 */
export function getReadingTimeWithContext(
  result: ReadingTimeResult,
  languageCode: string
): { time: string; context: string } {
  const lang = getLanguageByCode(languageCode);
  const langName = lang?.labelEn || languageCode;
  
  let context: string;
  if (result.languageFactor >= 0.9) {
    context = `Easy read for ${langName} learners`;
  } else if (result.languageFactor >= 0.7) {
    context = `Moderate complexity for ${langName}`;
  } else if (result.languageFactor >= 0.5) {
    context = `Challenging text in ${langName}`;
  } else {
    context = `Advanced ${langName} material`;
  }
  
  return {
    time: result.displayTime,
    context,
  };
}
