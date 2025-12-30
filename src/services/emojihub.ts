// src/services/emojihub.ts
// PURPOSE: Wrapper for EmojiHub API - Visual asset bank
// ACTION: Provides categorized emoji access for educational materials
// MECHANISM: REST API calls to EmojiHub (emojihub.yurace.pro)

const BASE_URL = 'https://emojihub.yurace.pro/api';

export interface EmojiAsset {
  name: string;
  category: string;
  group: string;
  htmlCode: string[]; // e.g. ["&#128512;"]
  unicode: string[];  // e.g. ["U+1F600"]
}

// Cache for the full library (it's small enough)
let libraryCache: EmojiAsset[] | null = null;
let categoriesCache: string[] | null = null;

export const assetBank = {
  /**
   * Fetch all categories to build UI tabs
   */
  async getCategories(): Promise<string[]> {
    if (categoriesCache) return categoriesCache;
    
    const library = await this.getLibrary();
    categoriesCache = Array.from(new Set(library.map(e => e.category)));
    return categoriesCache;
  },

  /**
   * Fetch full library (Cache client-side)
   */
  async getLibrary(): Promise<EmojiAsset[]> {
    if (libraryCache) return libraryCache;
    
    try {
      const res = await fetch(`${BASE_URL}/all`);
      if (!res.ok) return [];
      libraryCache = await res.json();
      return libraryCache || [];
    } catch (error) {
      console.error('EmojiHub fetch error:', error);
      return [];
    }
  },

  /**
   * Get emojis by category
   */
  async getByCategory(category: string): Promise<EmojiAsset[]> {
    const library = await this.getLibrary();
    return library.filter(e => 
      e.category.toLowerCase() === category.toLowerCase()
    );
  },

  /**
   * Search emojis by name
   */
  async search(query: string): Promise<EmojiAsset[]> {
    const library = await this.getLibrary();
    const lowerQuery = query.toLowerCase();
    return library.filter(e => 
      e.name.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Get a random emoji (for fun UI elements)
   */
  async getRandom(): Promise<EmojiAsset | null> {
    try {
      const res = await fetch(`${BASE_URL}/random`);
      if (!res.ok) return null;
      return res.json();
    } catch (error) {
      return null;
    }
  },

  /**
   * Clear the cache (useful for testing)
   */
  clearCache(): void {
    libraryCache = null;
    categoriesCache = null;
  },
};
