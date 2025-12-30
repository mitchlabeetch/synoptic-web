// src/services/dictionary.ts
// PURPOSE: Dictionary and etymology lookup using multiple free APIs
// ACTION: Provides word definitions for double-click-to-define feature
// MECHANISM: Combines Free Dictionary API and Wiktionary for comprehensive results

export interface DictionaryDefinition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface DictionaryMeaning {
  partOfSpeech: string;  // noun, verb, adjective, etc.
  definitions: DictionaryDefinition[];
}

export interface PhoneticsInfo {
  text?: string;         // IPA transcription
  audio?: string;        // Audio URL
}

export interface DictionaryEntry {
  word: string;
  phonetics: PhoneticsInfo[];
  meanings: DictionaryMeaning[];
  origin?: string;       // Etymology
  sourceUrl?: string;
}

export interface WiktionaryEntry {
  word: string;
  etymology?: string;
  definitions: {
    partOfSpeech: string;
    text: string;
    examples?: string[];
  }[];
  relatedWords?: string[];
  translations?: { [lang: string]: string[] };
}

export const dictionary = {
  /**
   * Get word definition from Free Dictionary API
   * @param word - Word to define
   * @param lang - Language code (default: 'en')
   */
  async define(word: string, lang: string = 'en'): Promise<DictionaryEntry | null> {
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/${lang}/${encodeURIComponent(word.toLowerCase())}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Word not found
        }
        throw new Error(`Dictionary lookup failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.length) return null;

      const entry = data[0];
      return {
        word: entry.word,
        phonetics: entry.phonetics || [],
        meanings: entry.meanings || [],
        origin: entry.origin,
        sourceUrl: entry.sourceUrls?.[0],
      };
    } catch (error) {
      console.error('Dictionary API error:', error);
      return null;
    }
  },

  /**
   * Get word info from Wiktionary (more comprehensive for rare words)
   * @param word - Word to look up
   * @param lang - Language code (e.g., 'en', 'fr')
   */
  async lookupWiktionary(word: string, lang: string = 'en'): Promise<WiktionaryEntry | null> {
    try {
      const wikiLang = lang === 'en' ? 'en' : lang;
      const response = await fetch(
        `https://${wikiLang}.wiktionary.org/w/api.php?` +
        new URLSearchParams({
          action: 'parse',
          page: word.toLowerCase(),
          prop: 'wikitext',
          format: 'json',
          origin: '*',
        }).toString()
      );

      if (!response.ok) {
        throw new Error(`Wiktionary lookup failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        return null; // Page not found
      }

      const wikitext = data.parse?.wikitext?.['*'] || '';
      
      // Basic parsing of Wiktionary format (simplified)
      return this.parseWikitext(word, wikitext);
    } catch (error) {
      console.error('Wiktionary API error:', error);
      return null;
    }
  },

  /**
   * Parse Wiktionary wikitext format (simplified extraction)
   */
  parseWikitext(word: string, wikitext: string): WiktionaryEntry {
    const entry: WiktionaryEntry = {
      word,
      definitions: [],
    };

    // Extract etymology (appears after ==Etymology==)
    const etymologyMatch = wikitext.match(/===?Etymology===?\s*\n([^=]+)/);
    if (etymologyMatch) {
      entry.etymology = etymologyMatch[1]
        .replace(/\{\{[^}]+\}\}/g, '') // Remove templates
        .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, '$2$1') // Convert links
        .trim()
        .slice(0, 500); // Limit length
    }

    // Extract definitions by part of speech
    const posMatches = wikitext.matchAll(/===\s*(Noun|Verb|Adjective|Adverb|Pronoun|Preposition|Conjunction|Interjection)\s*===\s*\n([\s\S]*?)(?====|$)/gi);
    
    for (const match of posMatches) {
      const partOfSpeech = match[1];
      const section = match[2];
      
      // Extract numbered definitions
      const defMatches = section.matchAll(/^# ([^\n]+)/gm);
      for (const defMatch of defMatches) {
        entry.definitions.push({
          partOfSpeech: partOfSpeech.toLowerCase(),
          text: defMatch[1]
            .replace(/\{\{[^}]+\}\}/g, '')
            .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, '$2$1')
            .trim(),
        });
      }
    }

    return entry;
  },

  /**
   * Combined lookup - tries Free Dictionary first, falls back to Wiktionary
   */
  async lookup(word: string, lang: string = 'en'): Promise<DictionaryEntry | null> {
    // Try Free Dictionary API first (better structured)
    const entry = await this.define(word, lang);
    if (entry && entry.meanings.length > 0) {
      return entry;
    }

    // Fall back to Wiktionary for rare words
    const wikiEntry = await this.lookupWiktionary(word, lang);
    if (wikiEntry && wikiEntry.definitions.length > 0) {
      // Convert Wiktionary format to DictionaryEntry
      return {
        word: wikiEntry.word,
        phonetics: [],
        meanings: wikiEntry.definitions.map(d => ({
          partOfSpeech: d.partOfSpeech,
          definitions: [{
            definition: d.text,
            example: d.examples?.[0],
          }],
        })),
        origin: wikiEntry.etymology,
      };
    }

    return null;
  },

  /**
   * Get audio pronunciation URL if available
   */
  getAudioUrl(entry: DictionaryEntry): string | null {
    for (const phonetic of entry.phonetics) {
      if (phonetic.audio && phonetic.audio.startsWith('http')) {
        return phonetic.audio;
      }
    }
    return null;
  },

  /**
   * Format phonetic text for display
   */
  getPhonetic(entry: DictionaryEntry): string | null {
    for (const phonetic of entry.phonetics) {
      if (phonetic.text) {
        return phonetic.text;
      }
    }
    return null;
  },
};
