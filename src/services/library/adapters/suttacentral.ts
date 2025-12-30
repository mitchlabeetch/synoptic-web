// src/services/library/adapters/suttacentral.ts
// PURPOSE: SuttaCentral adapter for Buddhist texts (🟢 Commercial Safe)
// ACTION: Fetches Pali suttas with translations
// MECHANISM: REST API to suttacentral.net

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

const API_BASE = 'https://suttacentral.net/api';

interface SuttaSearchResult {
  uid: string;
  name: string;
  translated_title?: string;
  root_lang: string;
  acronym?: string;
}

interface SuttaText {
  uid: string;
  title: string;
  text: string;
  lang: string;
  author: string;
}

// Popular suttas
export const POPULAR_SUTTAS = [
  { uid: 'dn1', name: 'Brahmajāla Sutta', meaning: 'The All-Embracing Net of Views' },
  { uid: 'dn2', name: 'Sāmaññaphala Sutta', meaning: 'The Fruits of the Contemplative Life' },
  { uid: 'mn1', name: 'Mūlapariyāya Sutta', meaning: 'The Root of All Things' },
  { uid: 'mn2', name: 'Sabbāsava Sutta', meaning: 'All the Taints' },
  { uid: 'sn12.2', name: 'Vibhaṅga Sutta', meaning: 'Analysis' },
  { uid: 'sn22.59', name: 'Anattalakkhaṇa Sutta', meaning: 'The Not-self Characteristic' },
  { uid: 'sn56.11', name: 'Dhammacakkappavattana Sutta', meaning: 'Setting in Motion the Wheel of Dhamma' },
  { uid: 'an3.65', name: 'Kālāma Sutta', meaning: 'To the Kālāmas' },
  { uid: 'an4.28', name: 'Ariyavaṃsa Sutta', meaning: 'Traditions of the Noble Ones' },
  { uid: 'dhp1', name: 'Dhammapada', meaning: 'Pairs' },
];

export const suttacentralAdapter: LibraryAdapter = {
  sourceId: 'suttacentral',
  displayName: 'SuttaCentral',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `${API_BASE}/search?query=${encodeURIComponent(query)}&limit=${limit}&lang=en`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      const results = data.hits || [];
      
      return results.slice(0, limit).map((hit: SuttaSearchResult) => ({
        id: hit.uid,
        title: hit.name,
        subtitle: hit.translated_title || hit.acronym || '',
        meta: {
          rootLang: hit.root_lang,
        },
      }));
    } catch (error) {
      console.error('SuttaCentral search error:', error);
      // Fallback to popular suttas
      const q = query.toLowerCase();
      return POPULAR_SUTTAS
        .filter(s => s.name.toLowerCase().includes(q) || s.meaning.toLowerCase().includes(q))
        .map(s => ({
          id: s.uid,
          title: s.name,
          subtitle: s.meaning,
          meta: {},
        }));
    }
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, searchQuery } = config;
    const uid = selectedId || searchQuery || 'dhp1';
    
    try {
      // Fetch sutta text
      const response = await fetch(
        `${API_BASE}/bilarasuttas/${uid}/sujato?lang=en`
      );
      
      if (!response.ok) {
        // Try alternative endpoint
        const altResponse = await fetch(`${API_BASE}/suttas/${uid}?lang=en&author=sujato`);
        if (!altResponse.ok) throw new Error('Failed to fetch sutta');
        
        const altData = await altResponse.json();
        // Handle alternative format
        return createContentFromAltFormat(altData, uid as string);
      }
      
      const data = await response.json();
      
      // Build lines from bilara format
      const lines: IngestedLine[] = [];
      
      // Title
      lines.push({
        id: 'sutta-title',
        type: 'heading',
        L1: data.root_text?.['0:0'] || uid,
        L2: data.translation_text?.['0:0'] || '',
      });
      
      // Separator
      lines.push({
        id: 'sutta-sep',
        type: 'separator',
        L1: '',
        L2: '',
      });
      
      // Extract segments
      const rootText = data.root_text || {};
      const translationText = data.translation_text || {};
      
      const segments = Object.keys(rootText).filter(k => k !== '0:0');
      segments.forEach((key, idx) => {
        const pali = rootText[key] || '';
        const english = translationText[key] || '';
        
        if (pali.trim() || english.trim()) {
          lines.push({
            id: `segment-${idx}`,
            type: 'text',
            L1: pali.trim(),
            L2: english.trim(),
            meta: {
              reference: key,
            },
          });
        }
      });
      
      const page: IngestedPage = {
        id: `page-${uid}`,
        number: 1,
        title: String(uid),
        lines,
      };
      
      return {
        title: data.translation_text?.['0:0'] || String(uid),
        description: 'Pali Canon',
        sourceLang: 'pi', // Pali
        targetLang: 'en',
        layout: 'book',
        pages: [page],
        meta: {
          source: 'SuttaCentral',
          sourceUrl: `https://suttacentral.net/${uid}`,
          author: 'Bhikkhu Sujato',
          publicDomain: true,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'CC0 (Public Domain Dedication)',
            url: 'https://creativecommons.org/publicdomain/zero/1.0/',
          },
        },
      };
    } catch (error) {
      console.error('SuttaCentral adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    const popular = POPULAR_SUTTAS[Math.floor(Math.random() * POPULAR_SUTTAS.length)];
    
    return {
      title: popular.name,
      description: popular.meaning,
      pages: [{
        id: 'preview',
        lines: [
          {
            id: 'preview-title',
            type: 'heading',
            L1: popular.name,
            L2: popular.meaning,
          },
          {
            id: 'preview-uid',
            type: 'text',
            L1: `Sutta: ${popular.uid}`,
            L2: '',
          },
        ],
      }],
    };
  },
};

// Helper for alternative API format
function createContentFromAltFormat(data: SuttaText, uid: string): IngestedContent {
  const lines: IngestedLine[] = [];
  
  lines.push({
    id: 'sutta-title',
    type: 'heading',
    L1: data.title,
    L2: '',
  });
  
  lines.push({
    id: 'sutta-sep',
    type: 'separator',
    L1: '',
    L2: '',
  });
  
  // Split text into paragraphs
  const paragraphs = data.text.split(/\n\n+/);
  paragraphs.forEach((para, idx) => {
    const cleanPara = para.replace(/<[^>]+>/g, '').trim();
    if (cleanPara) {
      lines.push({
        id: `para-${idx}`,
        type: 'text',
        L1: '',
        L2: cleanPara,
      });
    }
  });
  
  return {
    title: data.title,
    description: `${data.author}'s translation`,
    sourceLang: data.lang,
    layout: 'book',
    pages: [{
      id: `page-${uid}`,
      number: 1,
      title: data.title,
      lines,
    }],
    meta: {
      source: 'SuttaCentral',
      sourceUrl: `https://suttacentral.net/${uid}`,
      author: data.author,
      publicDomain: true,
      fetchedAt: new Date().toISOString(),
      license: {
        type: 'commercial-safe',
        name: 'CC0',
      },
    },
  };
}

export default suttacentralAdapter;
