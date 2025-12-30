// src/services/library/adapters/sefaria.ts
// PURPOSE: Sefaria adapter for Jewish texts (🟢 Commercial Safe)
// ACTION: Fetches Torah, Talmud, Mishnah with commentaries
// MECHANISM: REST API to sefaria.org

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

const API_BASE = 'https://www.sefaria.org/api';

interface SefariaText {
  ref: string;
  heRef: string;
  text: string | string[] | string[][];
  he: string | string[] | string[][];
  versions: { versionTitle: string; language: string }[];
  categories: string[];
  book: string;
  heTitle: string;
  primary_category: string;
  type: string;
}

interface SefariaSearchResult {
  ref: string;
  heRef: string;
  text: string;
  he: string;
  type: string;
}

// Popular texts
export const SEFARIA_BOOKS = [
  { ref: 'Genesis', heRef: 'בראשית', category: 'Torah' },
  { ref: 'Exodus', heRef: 'שמות', category: 'Torah' },
  { ref: 'Leviticus', heRef: 'ויקרא', category: 'Torah' },
  { ref: 'Numbers', heRef: 'במדבר', category: 'Torah' },
  { ref: 'Deuteronomy', heRef: 'דברים', category: 'Torah' },
  { ref: 'Psalms', heRef: 'תהילים', category: 'Writings' },
  { ref: 'Proverbs', heRef: 'משלי', category: 'Writings' },
  { ref: 'Isaiah', heRef: 'ישעיהו', category: 'Prophets' },
  { ref: 'Pirkei Avot', heRef: 'פרקי אבות', category: 'Mishnah' },
  { ref: 'Berakhot', heRef: 'ברכות', category: 'Talmud' },
];

function flattenText(text: string | string[] | string[][]): string[] {
  if (typeof text === 'string') return [text];
  if (Array.isArray(text)) {
    return text.flatMap(t => flattenText(t as string | string[] | string[][]));
  }
  return [];
}

export const sefariaAdapter: LibraryAdapter = {
  sourceId: 'sefaria',
  displayName: 'Sefaria',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `${API_BASE}/search-wrapper?q=${encodeURIComponent(query)}&size=${limit}&type=text`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      const hits = data.hits?.hits || [];
      
      return hits.slice(0, limit).map((hit: { _source: SefariaSearchResult }) => ({
        id: hit._source.ref,
        title: hit._source.ref,
        subtitle: hit._source.heRef,
        meta: {
          type: hit._source.type,
        },
      }));
    } catch (error) {
      console.error('Sefaria search error:', error);
      // Fallback to book list
      const q = query.toLowerCase();
      return SEFARIA_BOOKS
        .filter(b => b.ref.toLowerCase().includes(q) || b.heRef.includes(query))
        .map(b => ({
          id: b.ref,
          title: b.ref,
          subtitle: b.heRef,
          meta: { category: b.category },
        }));
    }
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, searchQuery, chapter } = config;
    const ref = selectedId || searchQuery || 'Genesis 1';
    
    // Add chapter if specified
    const fullRef = chapter ? `${ref} ${chapter}` : ref;
    
    try {
      const response = await fetch(
        `${API_BASE}/texts/${encodeURIComponent(fullRef as string)}?context=0`
      );
      
      if (!response.ok) throw new Error('Failed to fetch text');
      
      const data: SefariaText = await response.json();
      
      // Flatten text arrays
      const englishLines = flattenText(data.text);
      const hebrewLines = flattenText(data.he);
      
      // Build lines
      const lines: IngestedLine[] = [];
      
      // Title
      lines.push({
        id: 'sefaria-title',
        type: 'heading',
        L1: data.ref,
        L2: data.heRef,
      });
      
      // Category
      lines.push({
        id: 'sefaria-category',
        type: 'text',
        L1: `📚 ${data.categories.join(' > ')}`,
        L2: '',
      });
      
      // Separator
      lines.push({
        id: 'sefaria-sep',
        type: 'separator',
        L1: '',
        L2: '',
      });
      
      // Each verse/line
      const maxLines = Math.max(englishLines.length, hebrewLines.length);
      for (let i = 0; i < maxLines && i < 100; i++) {
        const eng = englishLines[i] || '';
        const heb = hebrewLines[i] || '';
        
        // Strip HTML tags
        const cleanEng = eng.replace(/<[^>]+>/g, '').trim();
        const cleanHeb = heb.replace(/<[^>]+>/g, '').trim();
        
        if (cleanEng || cleanHeb) {
          lines.push({
            id: `verse-${i + 1}`,
            type: 'text',
            L1: cleanHeb, // Hebrew as L1
            L2: cleanEng, // English as L2
            meta: {
              verse: i + 1,
              reference: `${data.ref}:${i + 1}`,
            },
          });
        }
      }
      
      const page: IngestedPage = {
        id: `page-${data.ref}`,
        number: 1,
        title: data.ref,
        lines,
      };
      
      return {
        title: data.ref,
        description: data.heRef,
        sourceLang: 'he',
        targetLang: 'en',
        layout: 'book',
        pages: [page],
        meta: {
          source: 'Sefaria',
          sourceUrl: `https://www.sefaria.org/${encodeURIComponent(data.ref)}`,
          publicDomain: true,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'CC0 / Public Domain',
            url: 'https://creativecommons.org/publicdomain/zero/1.0/',
          },
        },
      };
    } catch (error) {
      console.error('Sefaria adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    try {
      const response = await fetch(`${API_BASE}/texts/Genesis 1:1-3?context=0`);
      if (!response.ok) throw new Error('Preview failed');
      
      const data: SefariaText = await response.json();
      const englishLines = flattenText(data.text).slice(0, 3);
      const hebrewLines = flattenText(data.he).slice(0, 3);
      
      return {
        title: 'Genesis',
        description: 'בראשית',
        pages: [{
          id: 'preview',
          lines: englishLines.map((eng, i) => ({
            id: `preview-${i}`,
            type: 'text' as const,
            L1: hebrewLines[i]?.replace(/<[^>]+>/g, '') || '',
            L2: eng.replace(/<[^>]+>/g, ''),
          })),
        }],
      };
    } catch (error) {
      console.error('Sefaria preview error:', error);
      throw error;
    }
  },
};

export default sefariaAdapter;
