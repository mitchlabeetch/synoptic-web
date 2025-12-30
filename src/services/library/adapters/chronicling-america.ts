// src/services/library/adapters/chronicling-america.ts
// PURPOSE: Chronicling America adapter for historic newspapers (🟢 Commercial Safe)
// ACTION: Fetches newspaper front pages from Library of Congress
// MECHANISM: REST API to chroniclingamerica.loc.gov

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

const API_BASE = 'https://chroniclingamerica.loc.gov';

interface NewspaperTitle {
  lccn: string;
  name: string;
  place_of_publication: string;
  start_year: string;
  end_year: string;
  url: string;
}

interface PageResult {
  url: string;
  title: string;
  date: string;
  edition: number;
  sequence: number;
  lccn: string;
  city: string[];
  state: string[];
  words: string[];
}

interface SearchResponse {
  totalItems: number;
  itemsPerPage: number;
  items: PageResult[];
}

// Function to get date 100 years ago
function get100YearsAgo(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 100);
  return date.toISOString().split('T')[0];
}

// Function to format date for API
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0].replace(/-/g, '');
}

export const chroniclingAmericaAdapter: LibraryAdapter = {
  sourceId: 'chronicling-america',
  displayName: 'Chronicling America',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      const params = new URLSearchParams({
        andtext: query,
        format: 'json',
        rows: limit.toString(),
      });
      
      const response = await fetch(`${API_BASE}/search/pages/results/?${params}`);
      if (!response.ok) throw new Error('Search failed');
      
      const data: SearchResponse = await response.json();
      
      return data.items.slice(0, limit).map(item => ({
        id: item.url,
        title: item.title,
        subtitle: `${item.date} - ${item.city?.[0] || ''}, ${item.state?.[0] || ''}`,
        meta: {
          date: item.date,
          lccn: item.lccn,
        },
      }));
    } catch (error) {
      console.error('Chronicling America search error:', error);
      return [];
    }
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { date, searchQuery, randomCount = 5 } = config;
    
    try {
      let pages: PageResult[] = [];
      
      // Get date - default to 100 years ago today
      const targetDate = date ? formatDate(date) : formatDate(get100YearsAgo());
      
      const params = new URLSearchParams({
        format: 'json',
        rows: randomCount.toString(),
        dateFilterType: 'range',
        date1: targetDate.slice(0, 4) + '-' + targetDate.slice(4, 6) + '-' + targetDate.slice(6),
        date2: targetDate.slice(0, 4) + '-' + targetDate.slice(4, 6) + '-' + targetDate.slice(6),
      });
      
      if (searchQuery) {
        params.set('andtext', searchQuery);
      }
      
      const response = await fetch(`${API_BASE}/search/pages/results/?${params}`);
      if (!response.ok) throw new Error('Failed to fetch newspapers');
      
      const data: SearchResponse = await response.json();
      pages = data.items;
      
      if (!pages.length) {
        // Try broader date range
        const startDate = new Date(get100YearsAgo());
        startDate.setMonth(startDate.getMonth() - 1);
        const endDate = new Date(get100YearsAgo());
        endDate.setMonth(endDate.getMonth() + 1);
        
        params.set('date1', startDate.toISOString().split('T')[0]);
        params.set('date2', endDate.toISOString().split('T')[0]);
        
        const retryResponse = await fetch(`${API_BASE}/search/pages/results/?${params}`);
        if (retryResponse.ok) {
          const retryData: SearchResponse = await retryResponse.json();
          pages = retryData.items;
        }
      }
      
      if (!pages.length) {
        throw new Error('No newspapers found for this date');
      }
      
      // Build pages
      const ingestedPages: IngestedPage[] = pages.map((page, idx) => {
        const lines: IngestedLine[] = [];
        
        // Newspaper title
        lines.push({
          id: `paper-${idx}-title`,
          type: 'heading',
          L1: page.title,
          L2: '',
        });
        
        // Date and location
        lines.push({
          id: `paper-${idx}-date`,
          type: 'text',
          L1: `📰 ${page.date}`,
          L2: '',
        });
        
        if (page.city?.length || page.state?.length) {
          lines.push({
            id: `paper-${idx}-location`,
            type: 'text',
            L1: `📍 ${page.city?.[0] || ''}, ${page.state?.[0] || ''}`,
            L2: '',
          });
        }
        
        // Separator
        lines.push({
          id: `paper-${idx}-sep`,
          type: 'separator',
          L1: '',
          L2: '',
        });
        
        // Image link (page scan)
        const imageUrl = page.url.replace('.json', '.jp2') + '&sq=500';
        lines.push({
          id: `paper-${idx}-image`,
          type: 'image',
          L1: imageUrl,
          L2: '',
          meta: {
            imageUrl: page.url.replace('.json', '/full/pct:50/0/default.jpg'),
            thumbnailUrl: page.url.replace('.json', '/full/pct:10/0/default.jpg'),
          },
        });
        
        // OCR text snippets (if available)
        if (page.words?.length) {
          const textSample = page.words.slice(0, 50).join(' ');
          lines.push({
            id: `paper-${idx}-text`,
            type: 'text',
            L1: `📝 OCR: "${textSample}..."`,
            L2: '',
          });
        }
        
        // Source link
        lines.push({
          id: `paper-${idx}-link`,
          type: 'text',
          L1: `🔗 ${API_BASE}${page.url.replace('.json', '')}`,
          L2: '',
          meta: {
            sourceUrl: `${API_BASE}${page.url.replace('.json', '')}`,
          },
        });
        
        return {
          id: `page-${idx}`,
          number: idx + 1,
          title: page.title,
          lines,
        };
      });
      
      const firstPage = pages[0];
      
      return {
        title: `Historic Newspapers (${pages.length} pages)`,
        description: `From ${targetDate.slice(0, 4)}-${targetDate.slice(4, 6)}-${targetDate.slice(6)}`,
        sourceLang: 'en',
        layout: 'newspaper',
        pages: ingestedPages,
        meta: {
          source: 'Library of Congress',
          sourceUrl: 'https://chroniclingamerica.loc.gov',
          publicDomain: true,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'Public Domain',
          },
        },
      };
    } catch (error) {
      console.error('Chronicling America adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    try {
      const date100YearsAgo = get100YearsAgo();
      
      const params = new URLSearchParams({
        format: 'json',
        rows: '1',
        dateFilterType: 'range',
        date1: date100YearsAgo,
        date2: date100YearsAgo,
      });
      
      const response = await fetch(`${API_BASE}/search/pages/results/?${params}`);
      if (!response.ok) throw new Error('Preview failed');
      
      const data: SearchResponse = await response.json();
      const page = data.items[0];
      
      if (!page) {
        return {
          title: 'Historic Newspapers',
          description: `Front pages from ${date100YearsAgo}`,
          pages: [{
            id: 'preview',
            lines: [
              {
                id: 'preview-info',
                type: 'text',
                L1: `Newspapers from 100 years ago today`,
                L2: '',
              },
            ],
          }],
        };
      }
      
      return {
        title: page.title,
        description: page.date,
        pages: [{
          id: 'preview',
          lines: [
            {
              id: 'preview-title',
              type: 'heading',
              L1: page.title,
              L2: '',
            },
            {
              id: 'preview-date',
              type: 'text',
              L1: `📰 ${page.date} - ${page.city?.[0] || ''}, ${page.state?.[0] || ''}`,
              L2: '',
            },
          ],
        }],
      };
    } catch (error) {
      console.error('Chronicling America preview error:', error);
      throw error;
    }
  },
};

export default chroniclingAmericaAdapter;
