// src/services/datamuse.ts
// PURPOSE: Wrapper for Datamuse API - Word polishing service
// ACTION: Provides synonym, rhyme, and "sounds like" word suggestions
// MECHANISM: REST API calls to datamuse.com (no API key required)

const BASE_URL = 'https://api.datamuse.com/words';

export interface DatamuseResult {
  word: string;
  score: number;
  tags?: string[]; // e.g., ['n', 'adj']
  defs?: string[]; // Definitions if requested
}

export const wordPolisher = {
  /**
   * Find synonyms (Meaning Like)
   * Great for L2 learners finding precise English words
   */
  async getSynonyms(word: string): Promise<DatamuseResult[]> {
    const res = await fetch(
      `${BASE_URL}?ml=${encodeURIComponent(word)}&max=10&md=d`
    );
    if (!res.ok) return [];
    return res.json();
  },

  /**
   * Find Rhymes (Perfect for poetry translation)
   */
  async getRhymes(word: string): Promise<DatamuseResult[]> {
    const res = await fetch(
      `${BASE_URL}?rel_rhy=${encodeURIComponent(word)}&max=10`
    );
    if (!res.ok) return [];
    return res.json();
  },

  /**
   * "Sounds Like" (Great for correcting phonetic spelling errors by students)
   */
  async getSoundsLike(word: string): Promise<DatamuseResult[]> {
    const res = await fetch(
      `${BASE_URL}?sl=${encodeURIComponent(word)}&max=5`
    );
    if (!res.ok) return [];
    return res.json();
  },

  /**
   * Words that are triggered by a topic/context
   * e.g., topic="ocean" might return "beach", "waves", etc.
   */
  async getRelatedWords(topic: string): Promise<DatamuseResult[]> {
    const res = await fetch(
      `${BASE_URL}?rel_trg=${encodeURIComponent(topic)}&max=10`
    );
    if (!res.ok) return [];
    return res.json();
  },
};
