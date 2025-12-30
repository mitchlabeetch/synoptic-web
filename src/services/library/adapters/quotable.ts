// src/services/library/adapters/quotable.ts
// PURPOSE: Quotable.io adapter for famous quotes
// ACTION: Fetches random quotes for typography projects
// MECHANISM: REST API to api.quotable.io

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

const API_BASE = 'https://api.quotable.io';

interface Quote {
  _id: string;
  content: string;
  author: string;
  authorSlug: string;
  length: number;
  tags: string[];
  dateAdded: string;
  dateModified: string;
}

interface QuoteListResponse {
  count: number;
  totalCount: number;
  page: number;
  totalPages: number;
  lastItemIndex: number;
  results: Quote[];
}

interface RandomQuote extends Quote {}

export const quotableAdapter: LibraryAdapter = {
  sourceId: 'quotable',
  displayName: 'Quotable.io',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      // Search by author or tag
      const response = await fetch(
        `${API_BASE}/quotes?author=${encodeURIComponent(query)}&limit=${limit}`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data: QuoteListResponse = await response.json();
      
      return data.results.map(quote => ({
        id: quote._id,
        title: quote.content.slice(0, 50) + (quote.content.length > 50 ? '...' : ''),
        subtitle: `— ${quote.author}`,
        meta: {
          author: quote.author,
          tags: quote.tags,
        },
      }));
    } catch (error) {
      console.error('Quotable search error:', error);
      return [];
    }
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { searchQuery, randomCount = 10 } = config;
    
    try {
      let quotes: Quote[];
      
      if (searchQuery) {
        // Search by author or tag
        const response = await fetch(
          `${API_BASE}/quotes?author=${encodeURIComponent(searchQuery)}&limit=${randomCount}`
        );
        if (!response.ok) throw new Error('Failed to fetch quotes');
        const data: QuoteListResponse = await response.json();
        quotes = data.results;
      } else {
        // Random quotes
        const promises = Array(randomCount).fill(null).map(() => 
          fetch(`${API_BASE}/random`).then(r => r.json())
        );
        quotes = await Promise.all(promises);
      }
      
      if (!quotes.length) {
        throw new Error('No quotes found');
      }
      
      // Build pages (one quote per page for poster layout)
      const pages: IngestedPage[] = quotes.map((quote, idx) => {
        const lines: IngestedLine[] = [];
        
        // Quote mark
        lines.push({
          id: `quote-${quote._id}-mark`,
          type: 'text',
          L1: '"',
          L2: '',
        });
        
        // Quote content
        lines.push({
          id: `quote-${quote._id}-content`,
          type: 'text',
          L1: quote.content,
          L2: '',
        });
        
        // Closing quote mark
        lines.push({
          id: `quote-${quote._id}-mark-close`,
          type: 'text',
          L1: '"',
          L2: '',
        });
        
        // Separator
        lines.push({
          id: `quote-${quote._id}-sep`,
          type: 'separator',
          L1: '',
          L2: '',
        });
        
        // Author
        lines.push({
          id: `quote-${quote._id}-author`,
          type: 'text',
          L1: `— ${quote.author}`,
          L2: '',
          meta: {
            author: quote.author,
          },
        });
        
        // Tags (if any)
        if (quote.tags.length > 0) {
          lines.push({
            id: `quote-${quote._id}-tags`,
            type: 'text',
            L1: `#${quote.tags.join(' #')}`,
            L2: '',
          });
        }
        
        return {
          id: `page-${quote._id}`,
          number: idx + 1,
          title: quote.author,
          lines,
        };
      });
      
      const firstQuote = quotes[0];
      
      return {
        title: quotes.length === 1 
          ? `Quote by ${firstQuote.author}` 
          : `Quote Collection (${quotes.length} quotes)`,
        description: searchQuery 
          ? `Quotes by ${searchQuery}` 
          : 'Inspirational quotes for translation',
        sourceLang: 'en',
        layout: 'poster',
        pages,
        meta: {
          source: 'Quotable.io',
          sourceUrl: 'https://quotable.io',
          author: quotes.length === 1 ? firstQuote.author : undefined,
          publicDomain: true,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'Public Domain',
          },
        },
      };
    } catch (error) {
      console.error('Quotable adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    try {
      const response = await fetch(`${API_BASE}/random`);
      if (!response.ok) throw new Error('Preview failed');
      
      const quote: RandomQuote = await response.json();
      
      return {
        title: quote.author,
        description: quote.content.slice(0, 50) + '...',
        pages: [{
          id: 'preview',
          lines: [
            {
              id: 'preview-quote',
              type: 'text',
              L1: `"${quote.content}"`,
              L2: '',
            },
            {
              id: 'preview-author',
              type: 'text',
              L1: `— ${quote.author}`,
              L2: '',
            },
          ],
        }],
      };
    } catch (error) {
      console.error('Quotable preview error:', error);
      throw error;
    }
  },
};

export default quotableAdapter;
