// src/services/library/adapters/bhagavad-gita.ts
// PURPOSE: Bhagavad Gita adapter (🟢 Commercial Safe)
// ACTION: Fetches Sanskrit verses with translations
// MECHANISM: REST API to bhagavadgitaapi.in

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

const API_BASE = 'https://bhagavadgitaapi.in';

// All 18 chapters of the Gita
export const GITA_CHAPTERS = [
  { number: 1, name: 'Arjuna Vishada Yoga', nameHindi: 'अर्जुन विषाद योग', verses: 47 },
  { number: 2, name: 'Sankhya Yoga', nameHindi: 'सांख्य योग', verses: 72 },
  { number: 3, name: 'Karma Yoga', nameHindi: 'कर्म योग', verses: 43 },
  { number: 4, name: 'Jnana Karma Sanyasa Yoga', nameHindi: 'ज्ञान कर्म संन्यास योग', verses: 42 },
  { number: 5, name: 'Karma Sanyasa Yoga', nameHindi: 'कर्म संन्यास योग', verses: 29 },
  { number: 6, name: 'Dhyana Yoga', nameHindi: 'ध्यान योग', verses: 47 },
  { number: 7, name: 'Jnana Vijnana Yoga', nameHindi: 'ज्ञान विज्ञान योग', verses: 30 },
  { number: 8, name: 'Aksara Brahma Yoga', nameHindi: 'अक्षर ब्रह्म योग', verses: 28 },
  { number: 9, name: 'Raja Vidya Raja Guhya Yoga', nameHindi: 'राज विद्या राज गुह्य योग', verses: 34 },
  { number: 10, name: 'Vibhuti Yoga', nameHindi: 'विभूति योग', verses: 42 },
  { number: 11, name: 'Vishvarupa Darshana Yoga', nameHindi: 'विश्वरूप दर्शन योग', verses: 55 },
  { number: 12, name: 'Bhakti Yoga', nameHindi: 'भक्ति योग', verses: 20 },
  { number: 13, name: 'Kshetra Kshetragna Vibhaga Yoga', nameHindi: 'क्षेत्र क्षेत्रज्ञ विभाग योग', verses: 35 },
  { number: 14, name: 'Gunatraya Vibhaga Yoga', nameHindi: 'गुणत्रय विभाग योग', verses: 27 },
  { number: 15, name: 'Purushottama Yoga', nameHindi: 'पुरुषोत्तम योग', verses: 20 },
  { number: 16, name: 'Daivasura Sampad Vibhaga Yoga', nameHindi: 'दैवासुर सम्पद् विभाग योग', verses: 24 },
  { number: 17, name: 'Shraddhatraya Vibhaga Yoga', nameHindi: 'श्रद्धात्रय विभाग योग', verses: 28 },
  { number: 18, name: 'Moksha Sanyasa Yoga', nameHindi: 'मोक्ष संन्यास योग', verses: 78 },
];

interface GitaVerse {
  id: number;
  verse_number: number;
  chapter_number: number;
  slug: string;
  text: string;
  transliteration: string;
  word_meanings: string;
  translations: {
    id: number;
    description: string;
    author_name: string;
    language: string;
  }[];
  commentaries: {
    id: number;
    description: string;
    author_name: string;
    language: string;
  }[];
}

interface GitaChapter {
  id: number;
  slug: string;
  name: string;
  name_transliterated: string;
  name_translated: string;
  verses_count: number;
  chapter_number: number;
  name_meaning: string;
  chapter_summary: string;
  chapter_summary_hindi: string;
}

export const bhagavadGitaAdapter: LibraryAdapter = {
  sourceId: 'gita-api',
  displayName: 'Bhagavad Gita',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    // Search by chapter name
    const q = query.toLowerCase();
    return GITA_CHAPTERS
      .filter(ch => 
        ch.name.toLowerCase().includes(q) || 
        ch.number.toString() === q
      )
      .slice(0, limit)
      .map(ch => ({
        id: ch.number,
        title: `Chapter ${ch.number}: ${ch.name}`,
        subtitle: `${ch.nameHindi} (${ch.verses} verses)`,
        meta: {
          verses: ch.verses,
        },
      }));
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const chapterNumber = config.selectedId || config.chapter || 2; // Default to Chapter 2 (most famous)
    const startVerse = config.startChapter || 1;
    const endVerse = config.endChapter || 10;
    
    try {
      // Fetch chapter info
      const chapterRes = await fetch(`${API_BASE}/chapter/${chapterNumber}/`);
      if (!chapterRes.ok) throw new Error('Failed to fetch chapter');
      const chapter: GitaChapter = await chapterRes.json();
      
      // Fetch verses
      const versesToFetch = Math.min(endVerse, chapter.verses_count);
      const versePromises = [];
      for (let i = startVerse; i <= versesToFetch; i++) {
        versePromises.push(
          fetch(`${API_BASE}/slok/${chapterNumber}/${i}/`).then(r => r.json())
        );
      }
      
      const verses: GitaVerse[] = await Promise.all(versePromises);
      
      // Build lines
      const lines: IngestedLine[] = [];
      
      // Chapter header
      lines.push({
        id: `gita-ch${chapterNumber}-title`,
        type: 'heading',
        L1: `Chapter ${chapter.chapter_number}: ${chapter.name_translated}`,
        L2: chapter.name,
        meta: {
          chapter: chapter.chapter_number,
        },
      });
      
      // Chapter meaning
      lines.push({
        id: `gita-ch${chapterNumber}-meaning`,
        type: 'text',
        L1: `📖 ${chapter.name_meaning}`,
        L2: '',
      });
      
      // Summary
      if (chapter.chapter_summary) {
        lines.push({
          id: `gita-ch${chapterNumber}-summary`,
          type: 'text',
          L1: chapter.chapter_summary.slice(0, 300) + '...',
          L2: '',
        });
      }
      
      // Separator
      lines.push({
        id: `gita-ch${chapterNumber}-sep`,
        type: 'separator',
        L1: '',
        L2: '',
      });
      
      // Each verse
      verses.forEach((verse) => {
        // Sanskrit text
        lines.push({
          id: `gita-${chapterNumber}-${verse.verse_number}-text`,
          type: 'text',
          L1: verse.text,
          L2: '',
          meta: {
            verse: verse.verse_number,
            chapter: Number(chapterNumber),
            reference: `BG ${chapterNumber}.${verse.verse_number}`,
          },
        });
        
        // Transliteration
        lines.push({
          id: `gita-${chapterNumber}-${verse.verse_number}-translit`,
          type: 'text',
          L1: verse.transliteration,
          L2: '',
        });
        
        // English translation (first one)
        const engTranslation = verse.translations?.find(t => t.language === 'english');
        if (engTranslation) {
          lines.push({
            id: `gita-${chapterNumber}-${verse.verse_number}-eng`,
            type: 'text',
            L1: engTranslation.description,
            L2: '',
            meta: {
              author: engTranslation.author_name,
            },
          });
        }
        
        // Word meanings
        if (verse.word_meanings) {
          lines.push({
            id: `gita-${chapterNumber}-${verse.verse_number}-words`,
            type: 'text',
            L1: `📝 ${verse.word_meanings}`,
            L2: '',
          });
        }
        
        // Separator between verses
        lines.push({
          id: `gita-${chapterNumber}-${verse.verse_number}-sep`,
          type: 'separator',
          L1: '',
          L2: '',
        });
      });
      
      const page: IngestedPage = {
        id: `page-ch${chapterNumber}`,
        number: 1,
        title: chapter.name_translated,
        lines,
      };
      
      return {
        title: `Bhagavad Gita Chapter ${chapterNumber}`,
        description: `${chapter.name_translated} (${verses.length} verses)`,
        sourceLang: 'sa', // Sanskrit
        targetLang: 'en',
        layout: 'book',
        pages: [page],
        meta: {
          source: 'Bhagavad Gita API',
          sourceUrl: 'https://bhagavadgita.io',
          publicDomain: true,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'Public Domain',
          },
        },
      };
    } catch (error) {
      console.error('Bhagavad Gita adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    try {
      // Preview of famous verse BG 2.47
      const verse: GitaVerse = await fetch(`${API_BASE}/slok/2/47/`).then(r => r.json());
      
      return {
        title: 'Bhagavad Gita 2.47',
        description: 'The famous "Karma Yoga" verse',
        pages: [{
          id: 'preview',
          lines: [
            {
              id: 'preview-text',
              type: 'text',
              L1: verse.text,
              L2: '',
            },
            {
              id: 'preview-translit',
              type: 'text',
              L1: verse.transliteration,
              L2: '',
            },
            {
              id: 'preview-eng',
              type: 'text',
              L1: verse.translations?.find(t => t.language === 'english')?.description || '',
              L2: '',
            },
          ],
        }],
      };
    } catch (error) {
      console.error('Bhagavad Gita preview error:', error);
      throw error;
    }
  },
};

export default bhagavadGitaAdapter;
