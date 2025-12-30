// src/services/library/adapters/poetrydb.ts
// PURPOSE: PoetryDB adapter for poetry collection
// ACTION: Search and fetch public domain poems
// MECHANISM: REST API to poetrydb.org

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

const API_BASE = 'https://poetrydb.org';

interface PoetryDBPoem {
  title: string;
  author: string;
  lines: string[];
  linecount: string;
}

export const poetrydbAdapter: LibraryAdapter = {
  sourceId: 'poetrydb',
  displayName: 'PoetryDB',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      // Search by title or author
      const [titleResults, authorResults] = await Promise.all([
        fetch(`${API_BASE}/title/${encodeURIComponent(query)}`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE}/author/${encodeURIComponent(query)}`).then(r => r.json()).catch(() => []),
      ]);

      const allPoems: PoetryDBPoem[] = [];
      
      if (Array.isArray(titleResults)) {
        allPoems.push(...titleResults);
      }
      if (Array.isArray(authorResults)) {
        allPoems.push(...authorResults);
      }

      // Deduplicate by title
      const seen = new Set<string>();
      const unique = allPoems.filter(poem => {
        const key = `${poem.title}-${poem.author}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return unique.slice(0, limit).map((poem, idx) => ({
        id: `${poem.author}-${poem.title}`.replace(/\s+/g, '-').toLowerCase(),
        title: poem.title,
        subtitle: poem.author,
        meta: {
          linecount: poem.linecount,
          fullPoem: poem, // Store for later fetch
        },
      }));
    } catch (error) {
      console.error('PoetryDB search error:', error);
      return [];
    }
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { searchQuery, selectedId, randomCount = 1 } = config;

    try {
      let poems: PoetryDBPoem[] = [];

      if (selectedId && typeof selectedId === 'string') {
        // If we have a cached poem from search, use it
        // Otherwise fetch by title
        const titlePart = selectedId.split('-').slice(1).join(' ');
        const response = await fetch(`${API_BASE}/title/${encodeURIComponent(titlePart)}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          poems = data;
        }
      } else if (searchQuery) {
        // Fetch by author or title
        const response = await fetch(`${API_BASE}/author/${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          poems = data.slice(0, 10);
        }
      } else {
        // Random poems
        const response = await fetch(`${API_BASE}/random/${randomCount}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          poems = data;
        }
      }

      if (!poems.length) {
        throw new Error('No poems found');
      }

      // Convert poems to pages
      const pages: IngestedPage[] = poems.map((poem, idx) => {
        const lines: IngestedLine[] = [];

        // Add title as heading
        lines.push({
          id: `poem-${idx}-title`,
          type: 'heading',
          L1: poem.title,
          L2: '',
          meta: {
            author: poem.author,
          },
        });

        // Add byline
        lines.push({
          id: `poem-${idx}-author`,
          type: 'text',
          L1: `— ${poem.author}`,
          L2: '',
        });

        // Add separator
        lines.push({
          id: `poem-${idx}-sep`,
          type: 'separator',
          L1: '',
          L2: '',
        });

        // Add each line of the poem
        poem.lines.forEach((line, lineIdx) => {
          lines.push({
            id: `poem-${idx}-line-${lineIdx}`,
            type: 'text',
            L1: line,
            L2: '',
            meta: {
              verse: lineIdx + 1,
            },
          });
        });

        return {
          id: `page-${idx}`,
          number: idx + 1,
          title: poem.title,
          lines,
        };
      });

      const firstPoem = poems[0];
      
      return {
        title: poems.length === 1 ? firstPoem.title : `Poetry Collection`,
        description: poems.length === 1 
          ? `By ${firstPoem.author}`
          : `${poems.length} poems`,
        sourceLang: 'en',
        layout: 'workbook',
        pages,
        meta: {
          source: 'PoetryDB',
          sourceUrl: 'https://poetrydb.org',
          author: poems.length === 1 ? firstPoem.author : undefined,
          publicDomain: true,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'Public Domain',
          },
        },
      };
    } catch (error) {
      console.error('PoetryDB fetch error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    // Get a random poem for preview
    try {
      const response = await fetch(`${API_BASE}/random/1`);
      const data = await response.json();
      
      if (!Array.isArray(data) || !data.length) {
        throw new Error('No poem received');
      }

      const poem = data[0];
      
      return {
        title: poem.title,
        description: `By ${poem.author}`,
        pages: [{
          id: 'preview',
          lines: [
            {
              id: 'preview-title',
              type: 'heading',
              L1: poem.title,
              L2: '',
            },
            ...poem.lines.slice(0, 8).map((line: string, i: number) => ({
              id: `preview-line-${i}`,
              type: 'text' as const,
              L1: line,
              L2: '',
            })),
            ...(poem.lines.length > 8 ? [{
              id: 'preview-more',
              type: 'text' as const,
              L1: `... ${poem.lines.length - 8} more lines`,
              L2: '',
            }] : []),
          ],
        }],
      };
    } catch (error) {
      console.error('PoetryDB preview error:', error);
      throw error;
    }
  },
};

export default poetrydbAdapter;
