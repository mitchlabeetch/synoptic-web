// src/lib/utils/wordTokenizer.ts
// PURPOSE: Robust word tokenization for multilingual text
// ACTION: Detects single words vs phrases using Intl.Segmenter or smart fallback
// MECHANISM: Uses native Segmenter API for CJK/complex scripts, regex for simple cases

/**
 * Check if a string is a single word using Intl.Segmenter.
 * Works correctly with:
 * - CJK languages (Chinese, Japanese, Korean) - no spaces between words
 * - Words with apostrophes (e.g., "It's", "aujourd'hui", "l'école")
 * - Hyphenated words (e.g., "well-known", "self-aware")
 * - Unicode characters (emojis, accented letters)
 */
export function isSingleWord(text: string, locale?: string): boolean {
  const trimmed = text.trim();
  
  // Empty or too short
  if (trimmed.length === 0) return false;
  
  // Use Intl.Segmenter if available (modern browsers)
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      // Use the provided locale or auto-detect
      const segmenter = new Intl.Segmenter(locale || undefined, { granularity: 'word' });
      const segments = Array.from(segmenter.segment(trimmed));
      
      // Filter to only word-like segments (not punctuation/spaces)
      const wordSegments = segments.filter(segment => segment.isWordLike);
      
      // A single word has exactly one word-like segment
      return wordSegments.length === 1;
    } catch (e) {
      // Fall through to fallback
      console.warn('Intl.Segmenter failed, using fallback:', e);
    }
  }
  
  // Fallback: Smart regex-based detection
  return isSingleWordFallback(trimmed);
}

/**
 * Fallback word detection using smart regex patterns.
 * Handles:
 * - Contractions: "It's", "don't", "l'école"
 * - Hyphenated compound words: "well-known"
 * - Simple words with various scripts
 */
function isSingleWordFallback(text: string): boolean {
  // Quick check: if there are spaces, it's not a single word
  if (/\s/.test(text)) {
    return false;
  }
  
  // CJK detection: if text is primarily CJK, consider each character as a "word"
  // For CJK text, single character or short sequences are typically "words"
  const cjkPattern = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;
  if (cjkPattern.test(text)) {
    // For CJK, if no spaces and relatively short (≤10 chars), treat as single word/phrase
    // This is imperfect without proper segmentation, but reasonable
    return text.length <= 10;
  }
  
  // For alphabetic scripts: allow apostrophes and hyphens within words
  // Pattern: letters (with accents), optionally followed by apostrophe/hyphen + more letters
  const wordPattern = /^[\p{L}\p{M}]+(?:[''-][\p{L}\p{M}]+)*$/u;
  return wordPattern.test(text);
}

/**
 * Get individual word segments from text using Intl.Segmenter.
 * Useful for word-by-word operations.
 */
export function getWordSegments(text: string, locale?: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter(locale || undefined, { granularity: 'word' });
      const segments = Array.from(segmenter.segment(text));
      return segments
        .filter(segment => segment.isWordLike)
        .map(segment => segment.segment);
    } catch (e) {
      console.warn('Intl.Segmenter failed, using fallback:', e);
    }
  }
  
  // Fallback: split by whitespace and filter
  return text.split(/\s+/).filter(word => word.length > 0);
}

/**
 * Count words in text, properly handling CJK and complex scripts.
 */
export function countWords(text: string, locale?: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter(locale || undefined, { granularity: 'word' });
      const segments = Array.from(segmenter.segment(text));
      return segments.filter(segment => segment.isWordLike).length;
    } catch (e) {
      console.warn('Intl.Segmenter failed, using fallback:', e);
    }
  }
  
  // Fallback
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
