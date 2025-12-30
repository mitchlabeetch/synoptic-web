// src/services/synonyms.ts
// PURPOSE: Thesaurus service combining multiple APIs for synonym suggestions
// ACTION: Powers the right-click → Synonyms feature in the editor
// MECHANISM: Combines Datamuse (already integrated) with fallback options

// Note: synonyms.com requires an API key for heavy usage
// We use Datamuse as primary source (free, no key) and can add synonyms.com as premium tier

export interface SynonymResult {
  word: string;
  score: number;        // Relevance score (higher = more similar)
  partOfSpeech?: string;
  definition?: string;
  tags?: string[];
}

export interface SynonymGroup {
  meaning: string;       // The sense/meaning being matched
  synonyms: SynonymResult[];
}

export const synonymsService = {
  /**
   * Get synonyms for a word (uses Datamuse - same word, similar meaning)
   * @param word - Word to find synonyms for
   * @param max - Maximum number of results
   */
  async getSynonyms(word: string, max: number = 20): Promise<SynonymResult[]> {
    try {
      // ml = "meaning like" - words with similar meaning
      const response = await fetch(
        `https://api.datamuse.com/words?ml=${encodeURIComponent(word)}&max=${max}&md=dp`
      );

      if (!response.ok) {
        throw new Error(`Synonym lookup failed: ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((item: any) => ({
        word: item.word,
        score: item.score || 0,
        partOfSpeech: this.parsePartOfSpeech(item.tags),
        definition: item.defs?.[0]?.split('\t')[1], // Format: "n\tdefinition"
        tags: item.tags,
      }));
    } catch (error) {
      console.error('Synonym lookup error:', error);
      return [];
    }
  },

  /**
   * Get "related" words (triggered by/associated with)
   * @param word - Word to find related words for
   */
  async getRelated(word: string, max: number = 10): Promise<SynonymResult[]> {
    try {
      // rel_trg = "triggered by" - words associated with the input
      const response = await fetch(
        `https://api.datamuse.com/words?rel_trg=${encodeURIComponent(word)}&max=${max}`
      );

      if (!response.ok) {
        throw new Error(`Related words lookup failed: ${response.status}`);
      }

      const data = await response.json();
      return data.map((item: any) => ({
        word: item.word,
        score: item.score || 0,
      }));
    } catch (error) {
      console.error('Related words lookup error:', error);
      return [];
    }
  },

  /**
   * Get antonyms for a word
   * @param word - Word to find antonyms for
   */
  async getAntonyms(word: string, max: number = 10): Promise<SynonymResult[]> {
    try {
      // rel_ant = antonyms
      const response = await fetch(
        `https://api.datamuse.com/words?rel_ant=${encodeURIComponent(word)}&max=${max}`
      );

      if (!response.ok) {
        throw new Error(`Antonym lookup failed: ${response.status}`);
      }

      const data = await response.json();
      return data.map((item: any) => ({
        word: item.word,
        score: item.score || 0,
      }));
    } catch (error) {
      console.error('Antonym lookup error:', error);
      return [];
    }
  },

  /**
   * Get words that are a "kind of" this word (hyponyms)
   * e.g., "dog" returns "poodle", "beagle", etc.
   */
  async getHyponyms(word: string, max: number = 10): Promise<SynonymResult[]> {
    try {
      // rel_spc = "specific examples of"
      const response = await fetch(
        `https://api.datamuse.com/words?rel_spc=${encodeURIComponent(word)}&max=${max}`
      );

      if (!response.ok) {
        throw new Error(`Hyponym lookup failed: ${response.status}`);
      }

      const data = await response.json();
      return data.map((item: any) => ({
        word: item.word,
        score: item.score || 0,
      }));
    } catch (error) {
      console.error('Hyponym lookup error:', error);
      return [];
    }
  },

  /**
   * Get words that are more general than this word (hypernyms)
   * e.g., "poodle" returns "dog", "animal", etc.
   */
  async getHypernyms(word: string, max: number = 10): Promise<SynonymResult[]> {
    try {
      // rel_gen = "more general than"
      const response = await fetch(
        `https://api.datamuse.com/words?rel_gen=${encodeURIComponent(word)}&max=${max}`
      );

      if (!response.ok) {
        throw new Error(`Hypernym lookup failed: ${response.status}`);
      }

      const data = await response.json();
      return data.map((item: any) => ({
        word: item.word,
        score: item.score || 0,
      }));
    } catch (error) {
      console.error('Hypernym lookup error:', error);
      return [];
    }
  },

  /**
   * Comprehensive thesaurus lookup - retrieves all word relationships
   */
  async fullThesaurus(word: string): Promise<{
    synonyms: SynonymResult[];
    antonyms: SynonymResult[];
    related: SynonymResult[];
    hyponyms: SynonymResult[];
    hypernyms: SynonymResult[];
  }> {
    const [synonyms, antonyms, related, hyponyms, hypernyms] = await Promise.all([
      this.getSynonyms(word, 10),
      this.getAntonyms(word, 5),
      this.getRelated(word, 5),
      this.getHyponyms(word, 5),
      this.getHypernyms(word, 5),
    ]);

    return { synonyms, antonyms, related, hyponyms, hypernyms };
  },

  /**
   * Parse part of speech from Datamuse tags
   */
  parsePartOfSpeech(tags?: string[]): string | undefined {
    if (!tags) return undefined;
    
    const posMap: Record<string, string> = {
      'n': 'noun',
      'v': 'verb',
      'adj': 'adjective',
      'adv': 'adverb',
      'prop': 'proper noun',
    };

    for (const tag of tags) {
      if (posMap[tag]) {
        return posMap[tag];
      }
    }
    return undefined;
  },

  /**
   * Group synonyms by their part of speech
   */
  groupByPartOfSpeech(synonyms: SynonymResult[]): Record<string, SynonymResult[]> {
    const groups: Record<string, SynonymResult[]> = {
      'noun': [],
      'verb': [],
      'adjective': [],
      'adverb': [],
      'other': [],
    };

    for (const syn of synonyms) {
      const pos = syn.partOfSpeech || 'other';
      if (groups[pos]) {
        groups[pos].push(syn);
      } else {
        groups['other'].push(syn);
      }
    }

    // Remove empty groups
    for (const key of Object.keys(groups)) {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    }

    return groups;
  },
};
