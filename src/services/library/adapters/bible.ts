// src/services/library/adapters/bible.ts
// PURPOSE: Bible API adapter for bible-api.com
// ACTION: Fetches Bible passages and normalizes to IngestedContent
// MECHANISM: REST API to bible-api.com (no auth required)

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

const API_BASE = 'https://bible-api.com';

// Available Bible books for reference picker
export const BIBLE_BOOKS = [
  // Old Testament
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
  'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  // New Testament
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation',
];

// Chapter counts per book
export const BIBLE_CHAPTERS: Record<string, number> = {
  'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36,
  'Deuteronomy': 34, 'Joshua': 24, 'Judges': 21, 'Ruth': 4,
  '1 Samuel': 31, '2 Samuel': 24, '1 Kings': 22, '2 Kings': 25,
  '1 Chronicles': 29, '2 Chronicles': 36, 'Ezra': 10, 'Nehemiah': 13,
  'Esther': 10, 'Job': 42, 'Psalms': 150, 'Proverbs': 31,
  'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66,
  'Jeremiah': 52, 'Lamentations': 5, 'Ezekiel': 48, 'Daniel': 12,
  'Hosea': 14, 'Joel': 3, 'Amos': 9, 'Obadiah': 1, 'Jonah': 4,
  'Micah': 7, 'Nahum': 3, 'Habakkuk': 3, 'Zephaniah': 3,
  'Haggai': 2, 'Zechariah': 14, 'Malachi': 4,
  'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28,
  'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13,
  'Galatians': 6, 'Ephesians': 6, 'Philippians': 4, 'Colossians': 4,
  '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6,
  '2 Timothy': 4, 'Titus': 3, 'Philemon': 1, 'Hebrews': 13,
  'James': 5, '1 Peter': 5, '2 Peter': 3, '1 John': 5,
  '2 John': 1, '3 John': 1, 'Jude': 1, 'Revelation': 22,
};

interface BibleApiResponse {
  reference: string;
  verses: {
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }[];
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
}

export const bibleAdapter: LibraryAdapter = {
  sourceId: 'bible-api',
  displayName: 'Bible (KJV/WEB)',

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { book = 'John', chapter = 1 } = config;
    
    // Build reference string
    const reference = `${book}+${chapter}`;
    
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(reference)}`);
      
      if (!response.ok) {
        throw new Error(`Bible API error: ${response.status}`);
      }

      const data: BibleApiResponse = await response.json();
      
      // Convert verses to IngestedLines
      const lines: IngestedLine[] = [];
      
      // Add chapter heading
      lines.push({
        id: `heading-${book}-${chapter}`,
        type: 'heading',
        L1: data.reference,
        L2: '',
        meta: {
          chapter: Number(chapter),
          reference: data.reference,
        },
      });

      // Add each verse
      for (const verse of data.verses) {
        lines.push({
          id: `verse-${verse.book_name}-${verse.chapter}-${verse.verse}`,
          type: 'text',
          L1: verse.text.trim(),
          L2: '', // Empty for translation
          meta: {
            verse: verse.verse,
            chapter: verse.chapter,
            reference: `${verse.book_name} ${verse.chapter}:${verse.verse}`,
          },
        });
      }

      // Create single page
      const page: IngestedPage = {
        id: `page-${book}-${chapter}`,
        number: 1,
        title: data.reference,
        lines,
      };

      return {
        title: `${book} ${chapter}`,
        description: `${data.translation_name} translation`,
        sourceLang: 'en',
        layout: 'book',
        pages: [page],
        meta: {
          source: 'Bible-API.com',
          sourceUrl: 'https://bible-api.com',
          publicDomain: true,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'Public Domain',
          },
        },
      };
    } catch (error) {
      console.error('Bible adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    const { book = 'John', chapter = 1 } = config;
    const reference = `${book}+${chapter}:1-5`;
    
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(reference)}`);
      if (!response.ok) throw new Error('Preview failed');
      
      const data: BibleApiResponse = await response.json();
      
      return {
        title: `${book} ${chapter}`,
        description: `Preview: First 5 verses`,
        pages: [{
          id: 'preview',
          lines: data.verses.slice(0, 5).map(v => ({
            id: `preview-${v.verse}`,
            type: 'text' as const,
            L1: v.text.trim(),
            L2: '',
            meta: { verse: v.verse },
          })),
        }],
      };
    } catch (error) {
      console.error('Bible preview error:', error);
      throw error;
    }
  },
};

export default bibleAdapter;
