// src/services/library/adapters/open-library.ts
// PURPOSE: Open Library adapter for book metadata and excerpts
// ACTION: Fetches book information and subject data
// MECHANISM: REST API to openlibrary.org

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

const API_BASE = 'https://openlibrary.org';

interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
  language?: string[];
  publisher?: string[];
  isbn?: string[];
  first_sentence?: string[];
  edition_count?: number;
}

interface SearchResponse {
  numFound: number;
  start: number;
  docs: OpenLibraryDoc[];
}

interface WorkDetails {
  title: string;
  description?: string | { type: string; value: string };
  subjects?: string[];
  subject_places?: string[];
  subject_times?: string[];
  first_sentence?: { type: string; value: string };
  covers?: number[];
  first_publish_date?: string;
  authors?: { author: { key: string } }[];
}

interface AuthorDetails {
  name: string;
  birth_date?: string;
  death_date?: string;
  bio?: string | { type: string; value: string };
  photos?: number[];
}

function getCoverUrl(coverId: number, size: 'S' | 'M' | 'L' = 'M'): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

function getDescription(desc: string | { type: string; value: string } | undefined): string {
  if (!desc) return '';
  if (typeof desc === 'string') return desc;
  return desc.value || '';
}

export const openLibraryAdapter: LibraryAdapter = {
  sourceId: 'open-library',
  displayName: 'Open Library',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `${API_BASE}/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=key,title,author_name,first_publish_year,cover_i,subject,first_sentence`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data: SearchResponse = await response.json();
      
      return data.docs.map(doc => ({
        id: doc.key, // e.g., "/works/OL123W"
        title: doc.title,
        subtitle: doc.author_name?.join(', ') || 'Unknown author',
        thumbnail: doc.cover_i ? getCoverUrl(doc.cover_i, 'S') : undefined,
        meta: {
          year: doc.first_publish_year,
          editions: doc.edition_count,
          subjects: doc.subject?.slice(0, 5),
        },
      }));
    } catch (error) {
      console.error('Open Library search error:', error);
      return [];
    }
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, searchQuery, randomCount = 5 } = config;
    
    try {
      let works: { work: OpenLibraryDoc; details?: WorkDetails }[] = [];
      
      if (selectedId) {
        // Fetch specific work
        const searchRes = await fetch(
          `${API_BASE}/search.json?q=key:${selectedId}&limit=1`
        );
        const searchData: SearchResponse = await searchRes.json();
        
        if (searchData.docs.length > 0) {
          // Get full details
          const detailsRes = await fetch(`${API_BASE}${selectedId}.json`);
          const details: WorkDetails = await detailsRes.json();
          
          works = [{ work: searchData.docs[0], details }];
        }
      } else if (searchQuery) {
        // Search
        const response = await fetch(
          `${API_BASE}/search.json?q=${encodeURIComponent(searchQuery)}&limit=${randomCount}`
        );
        const data: SearchResponse = await response.json();
        works = data.docs.map(doc => ({ work: doc }));
      } else {
        // Get trending or random
        const response = await fetch(
          `${API_BASE}/search.json?q=subject:fiction&limit=${randomCount}&sort=editions`
        );
        const data: SearchResponse = await response.json();
        works = data.docs.map(doc => ({ work: doc }));
      }
      
      if (!works.length) {
        throw new Error('No books found');
      }
      
      // Build pages
      const pages: IngestedPage[] = await Promise.all(works.map(async ({ work, details }, idx) => {
        const lines: IngestedLine[] = [];
        
        // Cover image
        if (work.cover_i) {
          lines.push({
            id: `book-${idx}-cover`,
            type: 'image',
            L1: getCoverUrl(work.cover_i, 'L'),
            L2: '',
            meta: {
              imageUrl: getCoverUrl(work.cover_i, 'L'),
              thumbnailUrl: getCoverUrl(work.cover_i, 'M'),
            },
          });
        }
        
        // Title
        lines.push({
          id: `book-${idx}-title`,
          type: 'heading',
          L1: work.title,
          L2: '',
        });
        
        // Author
        if (work.author_name?.length) {
          lines.push({
            id: `book-${idx}-author`,
            type: 'text',
            L1: `✍️ ${work.author_name.join(', ')}`,
            L2: '',
          });
        }
        
        // Year
        if (work.first_publish_year) {
          lines.push({
            id: `book-${idx}-year`,
            type: 'text',
            L1: `📅 First published: ${work.first_publish_year}`,
            L2: '',
          });
        }
        
        // Separator
        lines.push({
          id: `book-${idx}-sep`,
          type: 'separator',
          L1: '',
          L2: '',
        });
        
        // First sentence
        if (work.first_sentence?.length) {
          lines.push({
            id: `book-${idx}-first-sentence-label`,
            type: 'text',
            L1: '📖 Opening line:',
            L2: '',
          });
          lines.push({
            id: `book-${idx}-first-sentence`,
            type: 'text',
            L1: `"${work.first_sentence[0]}"`,
            L2: '',
          });
        }
        
        // Description (if we have full details)
        if (details) {
          const desc = getDescription(details.description);
          if (desc) {
            lines.push({
              id: `book-${idx}-desc-sep`,
              type: 'separator',
              L1: '',
              L2: '',
            });
            lines.push({
              id: `book-${idx}-desc-label`,
              type: 'text',
              L1: '📝 Description:',
              L2: '',
            });
            // Split description into chunks
            const chunks = desc.match(/.{1,300}(?:\s|$)/g) || [desc];
            chunks.slice(0, 3).forEach((chunk, i) => {
              lines.push({
                id: `book-${idx}-desc-${i}`,
                type: 'text',
                L1: chunk.trim(),
                L2: '',
              });
            });
          }
        }
        
        // Subjects
        if (work.subject?.length) {
          lines.push({
            id: `book-${idx}-subjects`,
            type: 'text',
            L1: `🏷️ Subjects: ${work.subject.slice(0, 5).join(', ')}`,
            L2: '',
          });
        }
        
        // Link
        lines.push({
          id: `book-${idx}-link`,
          type: 'text',
          L1: `🔗 openlibrary.org${work.key}`,
          L2: '',
          meta: {
            sourceUrl: `https://openlibrary.org${work.key}`,
          },
        });
        
        return {
          id: `page-${idx}`,
          number: idx + 1,
          title: work.title,
          lines,
        };
      }));
      
      const firstWork = works[0].work;
      
      return {
        title: works.length === 1 
          ? firstWork.title 
          : `Book Collection (${works.length} books)`,
        description: works.length === 1 
          ? firstWork.author_name?.join(', ') || 'Open Library'
          : 'Book metadata from Open Library',
        sourceLang: 'en',
        layout: 'book',
        pages,
        meta: {
          source: 'Open Library',
          sourceUrl: 'https://openlibrary.org',
          coverImageUrl: firstWork.cover_i ? getCoverUrl(firstWork.cover_i, 'M') : undefined,
          publicDomain: true, // Metadata is public
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'Open Data',
            attributionText: 'Book metadata from Open Library (openlibrary.org).',
          },
        },
      };
    } catch (error) {
      console.error('Open Library adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    try {
      const response = await fetch(
        `${API_BASE}/search.json?q=subject:fiction&limit=1&sort=editions`
      );
      const data: SearchResponse = await response.json();
      const work = data.docs[0];
      
      if (!work) throw new Error('No book found');
      
      return {
        title: work.title,
        description: work.author_name?.join(', '),
        pages: [{
          id: 'preview',
          lines: [
            {
              id: 'preview-cover',
              type: 'image',
              L1: work.cover_i ? getCoverUrl(work.cover_i, 'M') : '',
              L2: '',
            },
            {
              id: 'preview-title',
              type: 'heading',
              L1: work.title,
              L2: '',
            },
            {
              id: 'preview-author',
              type: 'text',
              L1: work.author_name?.join(', ') || 'Unknown author',
              L2: '',
            },
          ],
        }],
      };
    } catch (error) {
      console.error('Open Library preview error:', error);
      throw error;
    }
  },
};

export default openLibraryAdapter;
