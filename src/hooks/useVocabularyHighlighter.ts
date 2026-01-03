// src/hooks/useVocabularyHighlighter.ts
// PURPOSE: Highlight words in text that match glossary terms
// ACTION: Marks glossary terms in editor content for visual feedback
// MECHANISM: Creates regex from glossary, wraps matches in highlight spans

import { useMemo, useCallback } from 'react';
import { useGlossaryStore } from '@/lib/store/glossaryStore';

export interface HighlightMatch {
  term: string;
  target: string;
  category?: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Hook for highlighting glossary terms in text
 */
export function useVocabularyHighlighter() {
  const { entries } = useGlossaryStore();
  
  // Create a lookup map for fast term matching
  const termLookup = useMemo(() => {
    const map = new Map<string, { target: string; category?: string }>();
    
    for (const entry of entries) {
      // Store both original and lowercase for case-insensitive matching
      const key = entry.sourceTerm.toLowerCase();
      map.set(key, { target: entry.targetTerm, category: entry.category });
    }
    
    return map;
  }, [entries]);
  
  // Create regex pattern from all terms (sorted by length for longer matches first)
  const termPattern = useMemo(() => {
    if (entries.length === 0) return null;
    
    // Sort by length descending so longer matches take priority
    const sortedTerms = [...entries]
      .map(e => e.sourceTerm)
      .sort((a, b) => b.length - a.length);
    
    // Escape special regex characters
    const escapedTerms = sortedTerms.map(term => 
      term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    
    // Create word-boundary pattern for whole word matching
    return new RegExp(`\\b(${escapedTerms.join('|')})\\b`, 'gi');
  }, [entries]);
  
  /**
   * Find all glossary term matches in text
   */
  const findMatches = useCallback((text: string): HighlightMatch[] => {
    if (!termPattern || !text) return [];
    
    const matches: HighlightMatch[] = [];
    let match;
    
    // Reset regex lastIndex for fresh search
    termPattern.lastIndex = 0;
    
    while ((match = termPattern.exec(text)) !== null) {
      const term = match[0];
      const lookup = termLookup.get(term.toLowerCase());
      
      if (lookup) {
        matches.push({
          term,
          target: lookup.target,
          category: lookup.category,
          startIndex: match.index,
          endIndex: match.index + term.length,
        });
      }
    }
    
    return matches;
  }, [termPattern, termLookup]);
  
  /**
   * Wrap glossary terms in HTML highlight spans
   * Returns HTML string with highlighted terms
   */
  const highlightText = useCallback((text: string, className = 'glossary-term'): string => {
    if (!termPattern || !text) return text;
    
    // Replace matches with highlighted spans
    return text.replace(termPattern, (match) => {
      const lookup = termLookup.get(match.toLowerCase());
      if (!lookup) return match;
      
      const categoryClass = lookup.category ? ` glossary-${lookup.category}` : '';
      return `<mark class="${className}${categoryClass}" data-glossary-term="${match}" data-glossary-target="${lookup.target}" title="${lookup.target}">${match}</mark>`;
    });
  }, [termPattern, termLookup]);
  
  /**
   * Check if a specific word is in the glossary
   */
  const isGlossaryTerm = useCallback((word: string): boolean => {
    return termLookup.has(word.toLowerCase());
  }, [termLookup]);
  
  /**
   * Get the translation for a glossary term
   */
  const getTermTranslation = useCallback((word: string): string | null => {
    const lookup = termLookup.get(word.toLowerCase());
    return lookup?.target || null;
  }, [termLookup]);
  
  return {
    findMatches,
    highlightText,
    isGlossaryTerm,
    getTermTranslation,
    hasTerms: entries.length > 0,
    termCount: entries.length,
  };
}

/**
 * CSS for glossary highlighting (add to globals.css if not present)
 */
export const VOCABULARY_HIGHLIGHT_CSS = `
/* Glossary term highlighting */
.glossary-term {
  background: linear-gradient(120deg, rgba(48, 184, 200, 0.15) 0%, rgba(48, 184, 200, 0.25) 100%);
  border-bottom: 2px solid rgba(48, 184, 200, 0.5);
  border-radius: 2px;
  padding: 0 2px;
  cursor: help;
  transition: background 0.2s ease;
}

.glossary-term:hover {
  background: linear-gradient(120deg, rgba(48, 184, 200, 0.25) 0%, rgba(48, 184, 200, 0.4) 100%);
}

/* Category-specific colors */
.glossary-character { border-bottom-color: #8b5cf6; }
.glossary-place { border-bottom-color: #10b981; }
.glossary-technical { border-bottom-color: #f59e0b; }
.glossary-cultural { border-bottom-color: #ec4899; }

/* Dark mode */
.dark .glossary-term {
  background: linear-gradient(120deg, rgba(48, 184, 200, 0.2) 0%, rgba(48, 184, 200, 0.35) 100%);
}
`;
