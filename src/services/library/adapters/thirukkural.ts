// src/services/library/adapters/thirukkural.ts
// PURPOSE: Thirukkural adapter for Tamil wisdom poetry (🟢 Commercial Safe)
// ACTION: Fetches 1330 ethical couplets with translations
// MECHANISM: REST API to api-thirukkural.web.app

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

const API_BASE = 'https://api-thirukkural.web.app/api';

interface ThirukkuralVerse {
  Number: number;
  Line1: string;
  Line2: string;
  Translation: string;
  explanation: string;
  clesing: string;
  transliteration1: string;
  transliteration2: string;
}

interface ThirukkuralChapter {
  name: string;
  number: number;
  translation: string;
  start: number;
  end: number;
}

// The three main sections
export const THIRUKKURAL_SECTIONS = [
  { name: 'Aram (Virtue)', start: 1, end: 380 },
  { name: 'Porul (Wealth)', start: 381, end: 1080 },
  { name: 'Inbam (Love)', start: 1081, end: 1330 },
];

// Notable chapters
export const THIRUKKURAL_CHAPTERS: ThirukkuralChapter[] = [
  { name: 'Praise of God', number: 1, translation: 'கடவுள் வாழ்த்து', start: 1, end: 10 },
  { name: 'Praise of Rain', number: 2, translation: 'வான்சிறப்பு', start: 11, end: 20 },
  { name: 'The Greatness of Ascetics', number: 3, translation: 'நீத்தார் பெருமை', start: 21, end: 30 },
  { name: 'Assertion of Virtue', number: 4, translation: 'அறன் வலியுறுத்தல்', start: 31, end: 40 },
  { name: 'Domestic Life', number: 5, translation: 'இல்வாழ்க்கை', start: 41, end: 50 },
];

export const thirukkuralAdapter: LibraryAdapter = {
  sourceId: 'thirukkural-api',
  displayName: 'Thirukkural',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    // Search by chapter name or number
    const q = query.toLowerCase();
    
    // First check chapters
    const matchingChapters = THIRUKKURAL_CHAPTERS
      .filter(ch => 
        ch.name.toLowerCase().includes(q) || 
        ch.number.toString() === q
      )
      .slice(0, limit)
      .map(ch => ({
        id: ch.number,
        title: `Chapter ${ch.number}: ${ch.name}`,
        subtitle: ch.translation,
        meta: {
          start: ch.start,
          end: ch.end,
        },
      }));
    
    if (matchingChapters.length > 0) return matchingChapters;
    
    // Fallback: search by verse number
    const verseNum = parseInt(query);
    if (!isNaN(verseNum) && verseNum >= 1 && verseNum <= 1330) {
      return [{
        id: verseNum,
        title: `Kural ${verseNum}`,
        subtitle: 'Individual verse',
        meta: {},
      }];
    }
    
    return [];
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, randomCount = 10 } = config;
    
    try {
      let verses: ThirukkuralVerse[] = [];
      
      if (selectedId) {
        const num = Number(selectedId);
        
        // Check if it's a chapter number (1-133)
        if (num >= 1 && num <= 133) {
          // Fetch chapter (10 verses each)
          const startVerse = (num - 1) * 10 + 1;
          const endVerse = num * 10;
          
          const promises = [];
          for (let i = startVerse; i <= endVerse; i++) {
            promises.push(
              fetch(`${API_BASE}?num=${i}`).then(r => r.json())
            );
          }
          verses = await Promise.all(promises);
        } else if (num >= 1 && num <= 1330) {
          // Single verse
          const response = await fetch(`${API_BASE}?num=${num}`);
          verses = [await response.json()];
        }
      } else {
        // Random verses
        const randomNums = new Set<number>();
        while (randomNums.size < randomCount) {
          randomNums.add(Math.floor(Math.random() * 1330) + 1);
        }
        
        const promises = Array.from(randomNums).map(num =>
          fetch(`${API_BASE}?num=${num}`).then(r => r.json())
        );
        verses = await Promise.all(promises);
      }
      
      if (!verses.length) {
        throw new Error('No verses found');
      }
      
      // Build lines
      const lines: IngestedLine[] = [];
      
      // Title
      lines.push({
        id: 'thirukkural-title',
        type: 'heading',
        L1: 'திருக்குறள்',
        L2: 'Thirukkural',
      });
      
      lines.push({
        id: 'thirukkural-subtitle',
        type: 'text',
        L1: `${verses.length} கு குறள்கள்`,
        L2: `${verses.length} verses of wisdom`,
      });
      
      lines.push({
        id: 'thirukkural-sep',
        type: 'separator',
        L1: '',
        L2: '',
      });
      
      // Each verse
      verses.forEach((verse) => {
        // Kural number
        lines.push({
          id: `kural-${verse.Number}-num`,
          type: 'text',
          L1: `குறள் ${verse.Number}`,
          L2: `Kural ${verse.Number}`,
        });
        
        // Tamil verse (both lines)
        lines.push({
          id: `kural-${verse.Number}-tamil`,
          type: 'text',
          L1: `${verse.Line1}\n${verse.Line2}`,
          L2: '',
        });
        
        // Transliteration
        if (verse.transliteration1 && verse.transliteration2) {
          lines.push({
            id: `kural-${verse.Number}-translit`,
            type: 'text',
            L1: `${verse.transliteration1}\n${verse.transliteration2}`,
            L2: '',
            meta: {
              transliteration: `${verse.transliteration1} ${verse.transliteration2}`,
            },
          });
        }
        
        // Translation
        lines.push({
          id: `kural-${verse.Number}-translation`,
          type: 'text',
          L1: '',
          L2: verse.Translation,
        });
        
        // Explanation
        if (verse.explanation) {
          lines.push({
            id: `kural-${verse.Number}-explanation`,
            type: 'text',
            L1: '',
            L2: `📖 ${verse.explanation}`,
          });
        }
        
        // Separator
        lines.push({
          id: `kural-${verse.Number}-sep`,
          type: 'separator',
          L1: '',
          L2: '',
        });
      });
      
      const page: IngestedPage = {
        id: 'page-thirukkural',
        number: 1,
        title: 'Thirukkural',
        lines,
      };
      
      return {
        title: `Thirukkural (${verses.length} verses)`,
        description: 'Tamil ethical poetry by Thiruvalluvar',
        sourceLang: 'ta',
        targetLang: 'en',
        layout: 'book',
        pages: [page],
        meta: {
          source: 'Thirukkural API',
          sourceUrl: 'https://thirukkural.gokulnath.com',
          author: 'Thiruvalluvar',
          publicDomain: true,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'Public Domain',
          },
        },
      };
    } catch (error) {
      console.error('Thirukkural adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    try {
      // Famous kural 391 (first of wealth section)
      const response = await fetch(`${API_BASE}?num=391`);
      if (!response.ok) throw new Error('Preview failed');
      
      const verse: ThirukkuralVerse = await response.json();
      
      return {
        title: 'Thirukkural',
        description: `Kural ${verse.Number}`,
        pages: [{
          id: 'preview',
          lines: [
            {
              id: 'preview-tamil',
              type: 'text',
              L1: `${verse.Line1}\n${verse.Line2}`,
              L2: '',
            },
            {
              id: 'preview-translation',
              type: 'text',
              L1: '',
              L2: verse.Translation,
            },
          ],
        }],
      };
    } catch (error) {
      console.error('Thirukkural preview error:', error);
      throw error;
    }
  },
};

export default thirukkuralAdapter;
