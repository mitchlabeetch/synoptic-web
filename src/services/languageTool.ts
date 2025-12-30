// src/services/languageTool.ts
// PURPOSE: Grammar and style checking using LanguageTool API
// ACTION: Provides professional-grade grammar checking for translated text
// MECHANISM: REST API calls to LanguageTool (public or self-hosted)

const LANGUAGE_TOOL_URL = process.env.NEXT_PUBLIC_LANGUAGE_TOOL_URL || 'https://api.languagetool.org/v2';

export interface GrammarMatch {
  message: string;           // Human-readable explanation
  shortMessage?: string;     // Short version for UI
  offset: number;            // Character offset in text
  length: number;            // Length of the error
  replacements: { value: string }[]; // Suggested corrections
  context: {
    text: string;            // Surrounding text
    offset: number;          // Offset within context
    length: number;          // Length within context
  };
  rule: {
    id: string;              // Rule identifier (e.g., "MORFOLOGIK_RULE_EN")
    description: string;     // Rule description
    category: {
      id: string;            // Category ID (e.g., "TYPOS", "GRAMMAR")
      name: string;          // Category name
    };
  };
  type: {
    typeName: string;        // "misspelling", "grammar", etc.
  };
}

export interface GrammarCheckResult {
  matches: GrammarMatch[];
  language: {
    name: string;
    code: string;
    detectedLanguage?: {
      name: string;
      code: string;
      confidence: number;
    };
  };
}

export interface GrammarCheckOptions {
  language?: string;         // Language code (e.g., 'en-US', 'fr', 'auto')
  enabledRules?: string[];   // Specific rules to enable
  disabledRules?: string[];  // Rules to disable
  enabledCategories?: string[];
  disabledCategories?: string[];
  motherTongue?: string;     // User's native language for better suggestions
  level?: 'picky' | 'default'; // Checking strictness
}

export const languageTool = {
  /**
   * Check text for grammar and style issues
   * @param text - Text to check
   * @param options - Checking options
   */
  async check(text: string, options: GrammarCheckOptions = {}): Promise<GrammarCheckResult> {
    try {
      const params = new URLSearchParams();
      params.append('text', text);
      params.append('language', options.language || 'auto');
      
      if (options.motherTongue) {
        params.append('motherTongue', options.motherTongue);
      }
      if (options.level) {
        params.append('level', options.level);
      }
      if (options.enabledRules?.length) {
        params.append('enabledRules', options.enabledRules.join(','));
      }
      if (options.disabledRules?.length) {
        params.append('disabledRules', options.disabledRules.join(','));
      }
      if (options.enabledCategories?.length) {
        params.append('enabledCategories', options.enabledCategories.join(','));
      }
      if (options.disabledCategories?.length) {
        params.append('disabledCategories', options.disabledCategories.join(','));
      }

      const response = await fetch(`${LANGUAGE_TOOL_URL}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`Grammar check failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        matches: result.matches || [],
        language: result.language,
      };
    } catch (error) {
      console.error('LanguageTool error:', error);
      throw error;
    }
  },

  /**
   * Get list of supported languages
   */
  async getLanguages(): Promise<{ name: string; code: string; longCode: string }[]> {
    try {
      const response = await fetch(`${LANGUAGE_TOOL_URL}/languages`);
      if (!response.ok) {
        throw new Error(`Failed to fetch languages: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch languages:', error);
      return [];
    }
  },

  /**
   * Helper to extract highlighted text with error annotations
   */
  annotateText(text: string, matches: GrammarMatch[]): { 
    segments: Array<{ 
      text: string; 
      isError: boolean; 
      match?: GrammarMatch 
    }> 
  } {
    if (!matches.length) {
      return { segments: [{ text, isError: false }] };
    }

    // Sort matches by offset
    const sortedMatches = [...matches].sort((a, b) => a.offset - b.offset);
    const segments: Array<{ text: string; isError: boolean; match?: GrammarMatch }> = [];
    let lastEnd = 0;

    for (const match of sortedMatches) {
      // Add non-error text before this match
      if (match.offset > lastEnd) {
        segments.push({
          text: text.slice(lastEnd, match.offset),
          isError: false,
        });
      }

      // Add the error segment
      segments.push({
        text: text.slice(match.offset, match.offset + match.length),
        isError: true,
        match,
      });

      lastEnd = match.offset + match.length;
    }

    // Add remaining text after last match
    if (lastEnd < text.length) {
      segments.push({
        text: text.slice(lastEnd),
        isError: false,
      });
    }

    return { segments };
  },

  /**
   * Get severity level for a match (for styling)
   */
  getMatchSeverity(match: GrammarMatch): 'error' | 'warning' | 'suggestion' {
    const categoryId = match.rule.category.id.toLowerCase();
    const typeName = match.type.typeName.toLowerCase();

    // Spelling errors are high priority
    if (typeName === 'misspelling' || categoryId.includes('typos')) {
      return 'error';
    }

    // Grammar issues
    if (categoryId.includes('grammar') || categoryId.includes('confused')) {
      return 'warning';
    }

    // Style suggestions
    return 'suggestion';
  },
};
