// src/services/library/adapters/gutendex.ts
// PURPOSE: Project Gutenberg adapter via Gutendex API
// ACTION: Search and fetch public domain books
// MECHANISM: REST API to gutendex.com

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

const API_BASE = 'https://gutendex.com';

interface GutendexBook {
  id: number;
  title: string;
  authors: { name: string; birth_year: number | null; death_year: number | null }[];
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  copyright: boolean;
  media_type: string;
  formats: Record<string, string>;
  download_count: number;
}

interface GutendexResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GutendexBook[];
}

export const gutendexAdapter: LibraryAdapter = {
  sourceId: 'gutendex',
  displayName: 'Project Gutenberg',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `${API_BASE}/books?search=${encodeURIComponent(query)}&languages=en`
      );
      
      if (!response.ok) {
        throw new Error(`Gutendex search failed: ${response.status}`);
      }

      const data: GutendexResponse = await response.json();
      
      return data.results.slice(0, limit).map(book => ({
        id: book.id,
        title: book.title,
        subtitle: book.authors.map(a => a.name).join(', ') || 'Unknown Author',
        thumbnail: book.formats['image/jpeg'],
        meta: {
          downloadCount: book.download_count,
          subjects: book.subjects,
          languages: book.languages,
        },
      }));
    } catch (error) {
      console.error('Gutendex search error:', error);
      return [];
    }
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, importRange = 'chapters', startChapter = 1, endChapter = 3 } = config;
    
    if (!selectedId) {
      throw new Error('No book selected');
    }

    try {
      // Get book metadata
      const metaResponse = await fetch(`${API_BASE}/books/${selectedId}`);
      if (!metaResponse.ok) throw new Error('Failed to fetch book metadata');
      
      const book: GutendexBook = await metaResponse.json();
      
      // Get plain text URL
      const textUrl = book.formats['text/plain; charset=utf-8'] 
        || book.formats['text/plain']
        || book.formats['text/html'];
      
      if (!textUrl) {
        throw new Error('No readable format available for this book');
      }

      // Fetch the text content
      const textResponse = await fetch(textUrl);
      if (!textResponse.ok) throw new Error('Failed to fetch book text');
      
      const fullText = await textResponse.text();
      
      // Parse the text into pages/chapters
      const pages = parseBookText(fullText, book.title, importRange, startChapter, endChapter);
      
      return {
        title: book.title,
        description: `By ${book.authors.map(a => a.name).join(', ')}`,
        sourceLang: book.languages[0] || 'en',
        layout: 'book',
        pages,
        meta: {
          source: 'Project Gutenberg',
          sourceUrl: `https://www.gutenberg.org/ebooks/${book.id}`,
          author: book.authors.map(a => a.name).join(', '),
          coverImageUrl: book.formats['image/jpeg'],
          publicDomain: !book.copyright,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'Public Domain',
          },
        },
      };
    } catch (error) {
      console.error('Gutendex fetch error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    const { selectedId } = config;
    
    if (!selectedId) {
      throw new Error('No book selected');
    }

    try {
      const metaResponse = await fetch(`${API_BASE}/books/${selectedId}`);
      if (!metaResponse.ok) throw new Error('Failed to fetch book');
      
      const book: GutendexBook = await metaResponse.json();
      
      // Get just the first bit of text
      const textUrl = book.formats['text/plain; charset=utf-8'] 
        || book.formats['text/plain'];
      
      if (!textUrl) {
        return {
          title: book.title,
          description: `By ${book.authors.map(a => a.name).join(', ')}`,
          pages: [{
            id: 'preview',
            lines: [{
              id: 'preview-note',
              type: 'text',
              L1: 'Full text preview not available. Click import to fetch the complete book.',
              L2: '',
            }],
          }],
        };
      }

      const textResponse = await fetch(textUrl);
      const fullText = await textResponse.text();
      
      // Get first 500 characters as preview
      const previewText = fullText.substring(0, 2000)
        .split('\n')
        .filter(line => line.trim().length > 10)
        .slice(0, 10);

      return {
        title: book.title,
        description: `By ${book.authors.map(a => a.name).join(', ')}`,
        pages: [{
          id: 'preview',
          lines: previewText.map((line, i) => ({
            id: `preview-${i}`,
            type: 'text' as const,
            L1: line.trim(),
            L2: '',
          })),
        }],
      };
    } catch (error) {
      console.error('Gutendex preview error:', error);
      throw error;
    }
  },
};

/**
 * Parse raw book text into structured pages
 */
function parseBookText(
  text: string, 
  title: string,
  importRange: string,
  startChapter: number,
  endChapter: number
): IngestedPage[] {
  // Remove Gutenberg header/footer
  const startMarker = '*** START OF';
  const endMarker = '*** END OF';
  
  let cleanText = text;
  const startIndex = text.indexOf(startMarker);
  const endIndex = text.indexOf(endMarker);
  
  if (startIndex !== -1) {
    cleanText = text.substring(text.indexOf('\n', startIndex) + 1);
  }
  if (endIndex !== -1) {
    cleanText = cleanText.substring(0, cleanText.indexOf(endMarker));
  }

  // Split into chapters/sections
  const chapterPatterns = [
    /^CHAPTER\s+[IVXLCDM\d]+/im,
    /^Chapter\s+[IVXLCDM\d]+/m,
    /^BOOK\s+[IVXLCDM\d]+/im,
    /^Part\s+[IVXLCDM\d]+/im,
    /^\d+\./m,
  ];

  let chapters: string[] = [];
  
  for (const pattern of chapterPatterns) {
    const parts = cleanText.split(pattern);
    if (parts.length > 3) {
      chapters = parts.filter(p => p.trim().length > 100);
      break;
    }
  }

  // If no chapters found, split by paragraphs into virtual pages
  if (chapters.length === 0) {
    const paragraphs = cleanText
      .split(/\n\s*\n/)
      .filter(p => p.trim().length > 20);
    
    // Group into pages of ~10 paragraphs each
    const pageSize = 10;
    for (let i = 0; i < paragraphs.length; i += pageSize) {
      chapters.push(paragraphs.slice(i, i + pageSize).join('\n\n'));
    }
  }

  // Apply range filter
  let selectedChapters = chapters;
  if (importRange === 'chapters') {
    selectedChapters = chapters.slice(startChapter - 1, endChapter);
  } else if (importRange !== 'full') {
    selectedChapters = chapters.slice(0, 5); // Default to first 5
  }

  // Convert to pages
  return selectedChapters.map((chapterText, idx) => {
    const paragraphs = chapterText
      .split(/\n\s*\n/)
      .filter(p => p.trim().length > 0);

    const lines: IngestedLine[] = paragraphs.map((para, pIdx) => ({
      id: `chapter-${idx + 1}-para-${pIdx + 1}`,
      type: 'text' as const,
      L1: para.replace(/\s+/g, ' ').trim(),
      L2: '',
      meta: {
        chapter: idx + 1,
        page: pIdx + 1,
      },
    }));

    return {
      id: `page-${idx + 1}`,
      number: idx + 1,
      title: `Chapter ${idx + startChapter}`,
      lines,
    };
  });
}

export default gutendexAdapter;
