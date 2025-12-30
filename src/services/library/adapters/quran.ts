// src/services/library/adapters/quran.ts
// PURPOSE: Quran adapter for AlQuran Cloud API
// ACTION: Fetches Quran surahs with translations and audio
// MECHANISM: REST API to api.alquran.cloud

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

const API_BASE = 'https://api.alquran.cloud/v1';

// All 114 Surahs
export const QURAN_SURAHS = [
  { number: 1, name: 'Al-Fatihah', englishName: 'The Opening', numberOfAyahs: 7 },
  { number: 2, name: 'Al-Baqarah', englishName: 'The Cow', numberOfAyahs: 286 },
  { number: 3, name: 'Aal-E-Imran', englishName: 'The Family of Imran', numberOfAyahs: 200 },
  { number: 4, name: 'An-Nisa', englishName: 'The Women', numberOfAyahs: 176 },
  { number: 5, name: 'Al-Ma\'idah', englishName: 'The Table', numberOfAyahs: 120 },
  { number: 6, name: 'Al-An\'am', englishName: 'The Cattle', numberOfAyahs: 165 },
  { number: 7, name: 'Al-A\'raf', englishName: 'The Heights', numberOfAyahs: 206 },
  { number: 36, name: 'Ya-Sin', englishName: 'Ya Sin', numberOfAyahs: 83 },
  { number: 55, name: 'Ar-Rahman', englishName: 'The Merciful', numberOfAyahs: 78 },
  { number: 56, name: 'Al-Waqi\'ah', englishName: 'The Event', numberOfAyahs: 96 },
  { number: 67, name: 'Al-Mulk', englishName: 'The Sovereignty', numberOfAyahs: 30 },
  { number: 78, name: 'An-Naba', englishName: 'The Tidings', numberOfAyahs: 40 },
  { number: 112, name: 'Al-Ikhlas', englishName: 'Sincerity', numberOfAyahs: 4 },
  { number: 113, name: 'Al-Falaq', englishName: 'The Daybreak', numberOfAyahs: 5 },
  { number: 114, name: 'An-Nas', englishName: 'Mankind', numberOfAyahs: 6 },
];

interface QuranAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
}

interface QuranSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: QuranAyah[];
}

interface QuranResponse {
  code: number;
  status: string;
  data: QuranSurah;
}

export const quranAdapter: LibraryAdapter = {
  sourceId: 'alquran-cloud',
  displayName: 'Quran (AlQuran Cloud)',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    // Search by surah name
    const q = query.toLowerCase();
    return QURAN_SURAHS
      .filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.englishName.toLowerCase().includes(q) ||
        s.number.toString() === q
      )
      .slice(0, limit)
      .map(s => ({
        id: s.number,
        title: `${s.number}. ${s.name}`,
        subtitle: `${s.englishName} (${s.numberOfAyahs} verses)`,
        meta: {
          numberOfAyahs: s.numberOfAyahs,
        },
      }));
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const surahNumber = config.selectedId || config.chapter || 1;
    
    try {
      // Fetch Arabic text
      const arabicResponse = await fetch(`${API_BASE}/surah/${surahNumber}`);
      if (!arabicResponse.ok) throw new Error('Failed to fetch Arabic text');
      const arabicData: QuranResponse = await arabicResponse.json();
      
      // Fetch English translation
      const englishResponse = await fetch(`${API_BASE}/surah/${surahNumber}/en.sahih`);
      if (!englishResponse.ok) throw new Error('Failed to fetch English translation');
      const englishData: QuranResponse = await englishResponse.json();
      
      const surah = arabicData.data;
      const translation = englishData.data;
      
      // Build lines
      const lines: IngestedLine[] = [];
      
      // Surah header
      lines.push({
        id: `surah-${surah.number}-title`,
        type: 'heading',
        L1: `سورة ${surah.name}`,
        L2: `Surah ${surah.englishName}`,
        meta: {
          reference: `Surah ${surah.number}`,
        },
      });
      
      // Bismillah (except for Surah 9)
      if (surah.number !== 9 && surah.number !== 1) {
        lines.push({
          id: `surah-${surah.number}-bismillah`,
          type: 'text',
          L1: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          L2: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
        });
      }
      
      // Separator
      lines.push({
        id: `surah-${surah.number}-sep`,
        type: 'separator',
        L1: '',
        L2: '',
      });
      
      // Each ayah
      surah.ayahs.forEach((ayah, idx) => {
        const englishAyah = translation.ayahs[idx];
        
        lines.push({
          id: `ayah-${surah.number}-${ayah.numberInSurah}`,
          type: 'text',
          L1: `${ayah.text} ﴿${ayah.numberInSurah}﴾`,
          L2: `${englishAyah?.text || ''} (${ayah.numberInSurah})`,
          meta: {
            verse: ayah.numberInSurah,
            chapter: surah.number,
            reference: `${surah.englishName} ${surah.number}:${ayah.numberInSurah}`,
          },
        });
      });
      
      const page: IngestedPage = {
        id: `page-surah-${surah.number}`,
        number: 1,
        title: surah.englishName,
        lines,
      };
      
      return {
        title: `Surah ${surah.englishName}`,
        description: `${surah.englishNameTranslation} • ${surah.numberOfAyahs} verses`,
        sourceLang: 'ar',
        targetLang: 'en',
        layout: 'book',
        pages: [page],
        meta: {
          source: 'AlQuran Cloud',
          sourceUrl: 'https://alquran.cloud',
          publicDomain: true,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'Public Domain',
          },
        },
      };
    } catch (error) {
      console.error('Quran adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    const surahNumber = config.selectedId || 1;
    
    try {
      const response = await fetch(`${API_BASE}/surah/${surahNumber}/en.sahih`);
      if (!response.ok) throw new Error('Preview failed');
      
      const data: QuranResponse = await response.json();
      const surah = data.data;
      
      return {
        title: `Surah ${surah.englishName}`,
        description: `${surah.numberOfAyahs} verses`,
        pages: [{
          id: 'preview',
          lines: surah.ayahs.slice(0, 5).map(ayah => ({
            id: `preview-${ayah.numberInSurah}`,
            type: 'text' as const,
            L1: '',
            L2: `${ayah.numberInSurah}. ${ayah.text}`,
          })),
        }],
      };
    } catch (error) {
      console.error('Quran preview error:', error);
      throw error;
    }
  },
};

export default quranAdapter;
