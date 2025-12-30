// src/services/library/adapters/tatoeba.ts
// PURPOSE: Tatoeba sentence pairs adapter (🟡 Attribution Required)
// ACTION: Search and fetch bilingual sentence examples
// MECHANISM: REST API to tatoeba.org with author tracking for attribution

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
  ProjectCredits,
} from '../types';

const API_BASE = 'https://tatoeba.org/en/api_v0';

// Tatoeba API response types
interface TatoebaSentence {
  id: number;
  text: string;
  lang: string;
  correctness: number;
  script: string | null;
  license: string;
  translations: TatoebaSentence[][];
  transcriptions: any[];
  audios: any[];
  user: {
    username: string;
  } | null;
}

interface TatoebaSearchResponse {
  paging: {
    Sentences: {
      page: number;
      current: number;
      count: number;
      perPage: number;
      pageCount: number;
    };
  };
  results: TatoebaSentence[];
}

// Language code mapping
const LANG_NAMES: Record<string, string> = {
  eng: 'English', fra: 'French', deu: 'German', spa: 'Spanish',
  ita: 'Italian', por: 'Portuguese', jpn: 'Japanese', cmn: 'Chinese',
  kor: 'Korean', rus: 'Russian', ara: 'Arabic', hin: 'Hindi',
  nld: 'Dutch', pol: 'Polish', tur: 'Turkish', vie: 'Vietnamese',
};

export const tatoebaAdapter: LibraryAdapter = {
  sourceId: 'tatoeba',
  displayName: 'Tatoeba (CC-BY)',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `${API_BASE}/search?query=${encodeURIComponent(query)}&from=eng&to=fra&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Tatoeba search failed: ${response.status}`);
      }

      const data: TatoebaSearchResponse = await response.json();
      
      return data.results.map(sentence => {
        const translation = sentence.translations[0]?.[0];
        
        return {
          id: sentence.id,
          title: sentence.text,
          subtitle: translation?.text || 'No translation',
          meta: {
            lang: sentence.lang,
            targetLang: translation?.lang,
            author: sentence.user?.username,
            translationAuthor: translation?.user?.username,
          },
        };
      });
    } catch (error) {
      console.error('Tatoeba search error:', error);
      return [];
    }
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { searchQuery, randomCount = 50 } = config;

    if (!searchQuery) {
      throw new Error('Search query is required for Tatoeba');
    }

    try {
      const response = await fetch(
        `${API_BASE}/search?query=${encodeURIComponent(searchQuery)}&from=eng&to=fra&limit=${randomCount}`
      );
      
      if (!response.ok) {
        throw new Error(`Tatoeba fetch failed: ${response.status}`);
      }

      const data: TatoebaSearchResponse = await response.json();
      
      if (!data.results.length) {
        throw new Error('No sentences found');
      }

      // Track all authors for attribution
      const authors = new Set<string>();
      
      // Convert to lines
      const lines: IngestedLine[] = [];
      
      data.results.forEach((sentence, idx) => {
        const translation = sentence.translations[0]?.[0];
        
        // Track authors
        if (sentence.user?.username) {
          authors.add(sentence.user.username);
        }
        if (translation?.user?.username) {
          authors.add(translation.user.username);
        }

        // Source sentence
        lines.push({
          id: `sentence-${sentence.id}`,
          type: 'text',
          L1: sentence.text,
          L2: translation?.text || '',
          meta: {
            sourceId: sentence.id.toString(),
            sourceUrl: `https://tatoeba.org/en/sentences/show/${sentence.id}`,
            author: sentence.user?.username,
          },
        });

        // Add separator between pairs every 5 sentences
        if ((idx + 1) % 5 === 0 && idx < data.results.length - 1) {
          lines.push({
            id: `sep-${idx}`,
            type: 'separator',
            L1: '',
            L2: '',
          });
        }
      });

      // Build credits for attribution
      const credits: ProjectCredits = {
        sources: [{
          name: 'Tatoeba',
          license: 'CC-BY 2.0 FR',
          attributionText: `Sentences contributed by: ${Array.from(authors).slice(0, 10).join(', ')}${authors.size > 10 ? ` and ${authors.size - 10} others` : ''}. Via Tatoeba.org.`,
          url: 'https://tatoeba.org',
        }],
        generatedAt: new Date().toISOString(),
      };

      // Create single page with all sentences
      const page: IngestedPage = {
        id: 'page-1',
        number: 1,
        title: `Sentences: "${searchQuery}"`,
        lines,
      };

      return {
        title: `Tatoeba: "${searchQuery}"`,
        description: `${data.results.length} sentence pairs`,
        sourceLang: 'en',
        targetLang: 'fr',
        layout: 'flashcard',
        pages: [page],
        meta: {
          source: 'Tatoeba',
          sourceUrl: 'https://tatoeba.org',
          publicDomain: false, // CC-BY requires attribution
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'attribution',
            name: 'CC-BY 2.0 FR',
            url: 'https://creativecommons.org/licenses/by/2.0/fr/',
            attributionText: credits.sources[0].attributionText,
          },
        },
        credits,
      };
    } catch (error) {
      console.error('Tatoeba fetch error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    const { searchQuery = 'hello' } = config;

    try {
      const response = await fetch(
        `${API_BASE}/search?query=${encodeURIComponent(searchQuery)}&from=eng&to=fra&limit=5`
      );
      
      if (!response.ok) {
        throw new Error('Preview failed');
      }

      const data: TatoebaSearchResponse = await response.json();
      
      return {
        title: `Preview: "${searchQuery}"`,
        description: `${data.results.length} example sentences`,
        pages: [{
          id: 'preview',
          lines: data.results.slice(0, 5).map(sentence => ({
            id: `preview-${sentence.id}`,
            type: 'text' as const,
            L1: sentence.text,
            L2: sentence.translations[0]?.[0]?.text || '',
          })),
        }],
      };
    } catch (error) {
      console.error('Tatoeba preview error:', error);
      throw error;
    }
  },
};

export default tatoebaAdapter;
