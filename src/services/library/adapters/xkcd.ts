// src/services/library/adapters/xkcd.ts
// PURPOSE: xkcd adapter (🔴 Personal Only - NC License)
// ACTION: Fetches xkcd comics for language learning
// MECHANISM: REST API to xkcd.com
// LICENSE: CC BY-NC 2.5 - Non-commercial only!

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
} from '../types';

const API_BASE = 'https://xkcd.com';

interface XKCDComic {
  num: number;
  title: string;
  alt: string;
  img: string;
  year: string;
  month: string;
  day: string;
  safe_title: string;
  transcript?: string;
  link?: string;
  news?: string;
}

export const xkcdAdapter: LibraryAdapter = {
  sourceId: 'xkcd',
  displayName: 'xkcd (Personal Use Only)',

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, randomCount = 5 } = config;
    
    try {
      let comics: XKCDComic[] = [];
      
      // Get latest comic number first
      const latestRes = await fetch(`${API_BASE}/info.0.json`);
      if (!latestRes.ok) throw new Error('Failed to fetch latest comic');
      const latest: XKCDComic = await latestRes.json();
      const maxNum = latest.num;
      
      if (selectedId) {
        // Fetch specific comic
        const response = await fetch(`${API_BASE}/${selectedId}/info.0.json`);
        if (!response.ok) throw new Error('Failed to fetch comic');
        comics = [await response.json()];
      } else {
        // Random comics
        const randomNums = new Set<number>();
        while (randomNums.size < randomCount && randomNums.size < maxNum) {
          randomNums.add(Math.floor(Math.random() * maxNum) + 1);
        }
        
        const promises = Array.from(randomNums).map(async num => {
          try {
            const r = await fetch(`${API_BASE}/${num}/info.0.json`);
            if (!r.ok) return null;
            return await r.json() as XKCDComic;
          } catch {
            return null;
          }
        });
        
        const results = await Promise.all(promises);
        comics = results.filter((c): c is XKCDComic => c !== null);
      }
      
      if (!comics.length) {
        throw new Error('No comics found');
      }
      
      // Build pages
      const pages: IngestedPage[] = comics.map((comic, idx) => {
        const lines: IngestedLine[] = [];
        
        // Comic number and date
        lines.push({
          id: `xkcd-${comic.num}-meta`,
          type: 'text',
          L1: `xkcd #${comic.num} (${comic.year}-${comic.month.padStart(2, '0')}-${comic.day.padStart(2, '0')})`,
          L2: '',
        });
        
        // Title
        lines.push({
          id: `xkcd-${comic.num}-title`,
          type: 'heading',
          L1: comic.title,
          L2: '',
        });
        
        // Image
        lines.push({
          id: `xkcd-${comic.num}-image`,
          type: 'image',
          L1: comic.img,
          L2: '',
          meta: {
            imageUrl: comic.img,
          },
        });
        
        // Alt text (the trademark xkcd humor)
        lines.push({
          id: `xkcd-${comic.num}-alt`,
          type: 'text',
          L1: `💬 Alt text: "${comic.alt}"`,
          L2: '',
        });
        
        // Transcript (if available)
        if (comic.transcript) {
          lines.push({
            id: `xkcd-${comic.num}-sep`,
            type: 'separator',
            L1: '',
            L2: '',
          });
          lines.push({
            id: `xkcd-${comic.num}-transcript-label`,
            type: 'text',
            L1: '📝 Transcript:',
            L2: '',
          });
          lines.push({
            id: `xkcd-${comic.num}-transcript`,
            type: 'text',
            L1: comic.transcript.slice(0, 500) + (comic.transcript.length > 500 ? '...' : ''),
            L2: '',
          });
        }
        
        // License warning
        lines.push({
          id: `xkcd-${comic.num}-license`,
          type: 'text',
          L1: '⚠️ CC BY-NC 2.5 - For personal study only',
          L2: '',
        });
        
        return {
          id: `page-${comic.num}`,
          number: idx + 1,
          title: comic.title,
          lines,
        };
      });
      
      const firstComic = comics[0];
      
      return {
        title: comics.length === 1 
          ? `xkcd #${firstComic.num}: ${firstComic.title}` 
          : `xkcd Collection (${comics.length} comics)`,
        description: comics.length === 1 
          ? firstComic.alt.slice(0, 100) + '...'
          : 'A webcomic of romance, sarcasm, math, and language',
        sourceLang: 'en',
        layout: 'poster',
        pages,
        meta: {
          source: 'xkcd',
          sourceUrl: 'https://xkcd.com',
          coverImageUrl: firstComic.img,
          publicDomain: false,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'personal-only',
            name: 'CC BY-NC 2.5',
            url: 'https://creativecommons.org/licenses/by-nc/2.5/',
            warningText: 'xkcd comics are licensed under CC BY-NC 2.5. You may NOT use them for commercial purposes. This includes selling translations, publishing ebooks, or monetizing any derivative works.',
          },
        },
      };
    } catch (error) {
      console.error('xkcd adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    try {
      // Get latest comic
      const response = await fetch(`${API_BASE}/info.0.json`);
      if (!response.ok) throw new Error('Preview failed');
      
      const comic: XKCDComic = await response.json();
      
      return {
        title: `xkcd #${comic.num}: ${comic.title}`,
        description: comic.alt.slice(0, 80) + '...',
        pages: [{
          id: 'preview',
          lines: [
            {
              id: 'preview-image',
              type: 'image',
              L1: comic.img,
              L2: '',
            },
            {
              id: 'preview-title',
              type: 'heading',
              L1: comic.title,
              L2: '',
            },
            {
              id: 'preview-warning',
              type: 'text',
              L1: '⚠️ Personal study only (CC BY-NC)',
              L2: '',
            },
          ],
        }],
      };
    } catch (error) {
      console.error('xkcd preview error:', error);
      throw error;
    }
  },
};

export default xkcdAdapter;
