// src/lib/glossary/applyGlossary.ts
// PURPOSE: Apply glossary term overrides to AI translations
// ACTION: Scans translated text and replaces terms with glossary-defined translations
// MECHANISM: Uses regex matching with support for case sensitivity and whole word options

import { TranslationMemoryEntry } from '@/types/glossaryGuard';

/**
 * Applies glossary term replacements to translated text.
 * This should be called AFTER receiving an AI translation to enforce
 * user-defined terminology.
 * 
 * @param text - The AI-translated text
 * @param entries - The glossary entries to apply
 * @param language - Whether this is L1 or L2 text
 * @returns The text with glossary terms applied
 */
export function applyGlossaryToTranslation(
  text: string,
  entries: TranslationMemoryEntry[],
  language: 'L1' | 'L2'
): string {
  let result = text;
  
  for (const entry of entries) {
    if (language === 'L2') {
      // In L2 text, replace source terms with target terms
      // This handles cases where AI might have left the source term untranslated
      const pattern = entry.wholeWord
        ? new RegExp(`\\b${escapeRegex(entry.sourceTerm)}\\b`, entry.caseSensitive ? 'g' : 'gi')
        : new RegExp(escapeRegex(entry.sourceTerm), entry.caseSensitive ? 'g' : 'gi');
      
      result = result.replace(pattern, entry.targetTerm);
    }
    // For L1, we typically don't override - the source text is user-defined
  }
  
  return result;
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Injects glossary context into an AI translation prompt.
 * This can be used to pre-inform the AI about required terminology.
 * 
 * @param entries - The glossary entries to inject
 * @param maxEntries - Maximum number of entries to include (to avoid prompt overflow)
 * @returns A formatted string to append to AI prompts
 */
export function generateGlossaryPromptContext(
  entries: TranslationMemoryEntry[],
  maxEntries: number = 20
): string {
  if (entries.length === 0) return '';
  
  const relevantEntries = entries.slice(0, maxEntries);
  
  const lines = relevantEntries.map(e => `- "${e.sourceTerm}" → "${e.targetTerm}"`);
  
  return `
IMPORTANT: Apply the following terminology consistently:
${lines.join('\n')}

Always use these exact translations for the specified terms.`;
}

/**
 * Filters glossary entries to only those relevant to the given text.
 * This helps optimize the glossary context for AI calls.
 * 
 * @param text - The source text to check
 * @param entries - All glossary entries
 * @returns Entries whose source terms appear in the text
 */
export function getRelevantGlossaryEntries(
  text: string,
  entries: TranslationMemoryEntry[]
): TranslationMemoryEntry[] {
  const lowerText = text.toLowerCase();
  
  return entries.filter(entry => {
    const searchTerm = entry.caseSensitive 
      ? entry.sourceTerm 
      : entry.sourceTerm.toLowerCase();
    
    if (entry.wholeWord) {
      // Check for whole word matches
      const pattern = new RegExp(`\\b${escapeRegex(searchTerm)}\\b`, entry.caseSensitive ? '' : 'i');
      return pattern.test(text);
    }
    
    return lowerText.includes(searchTerm.toLowerCase());
  });
}

/**
 * Stats about glossary application results.
 */
export interface GlossaryApplicationResult {
  originalText: string;
  modifiedText: string;
  replacementsCount: number;
  replacedTerms: { original: string; replacement: string; count: number }[];
}

/**
 * Applies glossary with detailed statistics.
 */
export function applyGlossaryWithStats(
  text: string,
  entries: TranslationMemoryEntry[],
  language: 'L1' | 'L2'
): GlossaryApplicationResult {
  let result = text;
  const replacedTerms: { original: string; replacement: string; count: number }[] = [];
  
  for (const entry of entries) {
    if (language === 'L2') {
      const pattern = entry.wholeWord
        ? new RegExp(`\\b${escapeRegex(entry.sourceTerm)}\\b`, entry.caseSensitive ? 'g' : 'gi')
        : new RegExp(escapeRegex(entry.sourceTerm), entry.caseSensitive ? 'g' : 'gi');
      
      const matches = result.match(pattern);
      if (matches && matches.length > 0) {
        result = result.replace(pattern, entry.targetTerm);
        replacedTerms.push({
          original: entry.sourceTerm,
          replacement: entry.targetTerm,
          count: matches.length
        });
      }
    }
  }
  
  return {
    originalText: text,
    modifiedText: result,
    replacementsCount: replacedTerms.reduce((sum, t) => sum + t.count, 0),
    replacedTerms
  };
}
