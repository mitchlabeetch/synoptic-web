// src/services/library/adapters/wikipedia.ts
// PURPOSE: Wikipedia adapter (🟡 Attribution Required - CC BY-SA)
// ACTION: Fetches Wikipedia articles with extracts and images
// MECHANISM: REST API to en.wikipedia.org/api/rest_v1
// LICENSE: CC BY-SA 3.0 - Attribution required!

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
  ProjectCredits,
} from '../types';

const API_BASE = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_API = 'https://en.wikipedia.org/w/api.php';

interface WikiSummary {
  type: string;
  title: string;
  displaytitle: string;
  namespace: { id: number; text: string };
  wikibase_item: string;
  titles: { canonical: string; normalized: string; display: string };
  pageid: number;
  thumbnail?: { source: string; width: number; height: number };
  originalimage?: { source: string; width: number; height: number };
  lang: string;
  dir: string;
  revision: string;
  tid: string;
  timestamp: string;
  description?: string;
  description_source?: string;
  content_urls: {
    desktop: { page: string; revisions: string; edit: string; talk: string };
    mobile: { page: string; revisions: string; edit: string; talk: string };
  };
  extract: string;
  extract_html: string;
}

interface WikiSearch {
  pages: Array<{
    id: number;
    key: string;
    title: string;
    excerpt: string;
    matched_title: string | null;
    description: string | null;
    thumbnail?: { mimetype: string; size: number; width: number; height: number; duration: null; url: string };
  }>;
}

interface WikiMobileSection {
  id: number;
  text: string;
  toclevel?: number;
  line?: string;
  anchor?: string;
}

interface WikiMobileSections {
  lead: {
    id: number;
    revision: string;
    lastmodified: string;
    displaytitle: string;
    normalizedtitle: string;
    wikibase_item: string;
    description?: string;
    protection: any;
    editable: boolean;
    languagecount: number;
    image?: { file: string; urls: Record<string, string> };
    pronunciations?: any[];
    sections: WikiMobileSection[];
  };
  remaining: {
    sections: WikiMobileSection[];
  };
}

export const wikipediaAdapter: LibraryAdapter = {
  sourceId: 'wikipedia',
  displayName: 'Wikipedia (CC BY-SA)',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `${API_BASE}/page/search/${encodeURIComponent(query)}?limit=${limit}`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data: WikiSearch = await response.json();
      
      return data.pages.map(page => ({
        id: page.key,
        title: page.title,
        subtitle: page.description || page.excerpt?.slice(0, 100) || '',
        thumbnail: page.thumbnail?.url ? `https:${page.thumbnail.url}` : undefined,
        meta: {
          pageId: page.id,
        },
      }));
    } catch (error) {
      console.error('Wikipedia search error:', error);
      return [];
    }
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, searchQuery } = config;
    
    if (!selectedId && !searchQuery) {
      throw new Error('Please provide a search term or select an article');
    }
    
    const articleKey = selectedId || encodeURIComponent(searchQuery!);
    
    try {
      // Get summary
      const summaryRes = await fetch(`${API_BASE}/page/summary/${articleKey}`);
      if (!summaryRes.ok) throw new Error('Failed to fetch article summary');
      const summary: WikiSummary = await summaryRes.json();
      
      // Get mobile sections for full content
      let sections: { title: string; content: string }[] = [];
      try {
        const sectionsRes = await fetch(`${API_BASE}/page/mobile-sections/${articleKey}`);
        if (sectionsRes.ok) {
          const sectionsData: WikiMobileSections = await sectionsRes.json();
          
          // Extract text from sections
          sections = sectionsData.remaining.sections
            .filter(s => s.line && s.text)
            .map(s => ({
              title: s.line || 'Section',
              content: s.text
                .replace(/<[^>]+>/g, '') // Strip HTML
                .replace(/\s+/g, ' ')     // Normalize whitespace
                .trim(),
            }))
            .filter(s => s.content.length > 50); // Only meaningful sections
        }
      } catch {
        // Fall back to just the summary
      }
      
      // Build lines
      const lines: IngestedLine[] = [];
      
      // Image (if available)
      if (summary.originalimage || summary.thumbnail) {
        lines.push({
          id: `wiki-${summary.pageid}-image`,
          type: 'image',
          L1: summary.originalimage?.source || summary.thumbnail?.source || '',
          L2: '',
          meta: {
            imageUrl: summary.originalimage?.source,
            thumbnailUrl: summary.thumbnail?.source,
          },
        });
      }
      
      // Title
      lines.push({
        id: `wiki-${summary.pageid}-title`,
        type: 'heading',
        L1: summary.title,
        L2: '',
      });
      
      // Description (short)
      if (summary.description) {
        lines.push({
          id: `wiki-${summary.pageid}-desc`,
          type: 'text',
          L1: summary.description,
          L2: '',
        });
      }
      
      // Separator
      lines.push({
        id: `wiki-${summary.pageid}-sep1`,
        type: 'separator',
        L1: '',
        L2: '',
      });
      
      // Extract (summary paragraph)
      if (summary.extract) {
        const paragraphs = summary.extract.split('\n\n');
        paragraphs.forEach((para, i) => {
          if (para.trim()) {
            lines.push({
              id: `wiki-${summary.pageid}-extract-${i}`,
              type: 'text',
              L1: para.trim(),
              L2: '',
            });
          }
        });
      }
      
      // Additional sections
      sections.slice(0, 5).forEach((section, idx) => {
        lines.push({
          id: `wiki-${summary.pageid}-section-${idx}-sep`,
          type: 'separator',
          L1: '',
          L2: '',
        });
        lines.push({
          id: `wiki-${summary.pageid}-section-${idx}-title`,
          type: 'heading',
          L1: section.title,
          L2: '',
        });
        
        // Split into paragraphs
        const paras = section.content.split(/\n+/).filter(p => p.trim().length > 30);
        paras.slice(0, 3).forEach((para, pIdx) => {
          lines.push({
            id: `wiki-${summary.pageid}-section-${idx}-para-${pIdx}`,
            type: 'text',
            L1: para.trim(),
            L2: '',
          });
        });
      });
      
      // Source attribution
      lines.push({
        id: `wiki-${summary.pageid}-attribution`,
        type: 'text',
        L1: `📚 Source: Wikipedia (${summary.timestamp.split('T')[0]})`,
        L2: '',
        meta: {
          sourceUrl: summary.content_urls.desktop.page,
        },
      });
      
      // Build credits for attribution
      const credits: ProjectCredits = {
        sources: [{
          name: 'Wikipedia',
          license: 'CC BY-SA 3.0',
          attributionText: `"${summary.title}" from Wikipedia, licensed under CC BY-SA 3.0. Source: ${summary.content_urls.desktop.page}`,
          url: summary.content_urls.desktop.page,
        }],
        generatedAt: new Date().toISOString(),
      };
      
      const page: IngestedPage = {
        id: `page-${summary.pageid}`,
        number: 1,
        title: summary.title,
        lines,
      };
      
      return {
        title: summary.title,
        description: summary.description || 'Wikipedia article',
        sourceLang: 'en',
        layout: 'workbook',
        pages: [page],
        meta: {
          source: 'Wikipedia',
          sourceUrl: summary.content_urls.desktop.page,
          coverImageUrl: summary.thumbnail?.source,
          publicDomain: false, // CC BY-SA requires attribution
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'attribution',
            name: 'CC BY-SA 3.0',
            url: 'https://creativecommons.org/licenses/by-sa/3.0/',
            attributionText: `"${summary.title}" from Wikipedia, licensed under CC BY-SA 3.0.`,
          },
        },
        credits,
      };
    } catch (error) {
      console.error('Wikipedia adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    const { selectedId, searchQuery } = config;
    const articleKey = selectedId || (searchQuery ? encodeURIComponent(searchQuery) : 'Main_Page');
    
    try {
      const response = await fetch(`${API_BASE}/page/summary/${articleKey}`);
      if (!response.ok) throw new Error('Preview failed');
      
      const summary: WikiSummary = await response.json();
      
      return {
        title: summary.title,
        description: summary.description,
        pages: [{
          id: 'preview',
          lines: [
            {
              id: 'preview-image',
              type: 'image',
              L1: summary.thumbnail?.source || '',
              L2: '',
            },
            {
              id: 'preview-title',
              type: 'heading',
              L1: summary.title,
              L2: '',
            },
            {
              id: 'preview-extract',
              type: 'text',
              L1: summary.extract?.slice(0, 200) + '...',
              L2: '',
            },
            {
              id: 'preview-license',
              type: 'text',
              L1: '📋 Attribution required (CC BY-SA)',
              L2: '',
            },
          ],
        }],
      };
    } catch (error) {
      console.error('Wikipedia preview error:', error);
      throw error;
    }
  },
};

export default wikipediaAdapter;
