# SYNOPTIC LIBRARY - Adapter Implementation Guide

> Adapters are the "Universal Translators" between external APIs and Synoptic's internal data format.
> Each adapter normalizes chaotic API responses into clean `IngestedContent` structures.

---

## Table of Contents

1. [Adapter Architecture](#architecture)
2. [Core Types](#core-types)
3. [API Ingestor Route](#api-route)
4. [Priority 1 Adapters](#priority-1) (MVP)
5. [Priority 2 Adapters](#priority-2)
6. [Static Data Adapters](#static-data)
7. [Utility Adapters](#utilities)

---

## Adapter Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADAPTER HUB                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  External API      →  Adapter         →  IngestedContent        │
│  ────────────         ─────────          ───────────────        │
│  bible-api.com        BibleAdapter       { pages, lines, meta } │
│  alquran.cloud        QuranAdapter       { pages, lines, meta } │
│  gutendex.com         GutendexAdapter    { pages, lines, meta } │
│  metmuseum.github     MetMuseumAdapter   { pages, lines, meta } │
│  ...                  ...                ...                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Types

### File: `src/services/library/types.ts`

```typescript
// ════════════════════════════════════════════
// INGESTED LINE (Normalized content unit)
// ════════════════════════════════════════════

export interface IngestedLine {
  id: string;
  type: 'text' | 'image' | 'heading' | 'separator' | 'quiz';

  // Language content
  L1: string; // Source language text (or image URL for image type)
  L2: string; // Target language (usually empty, user fills)

  // Optional metadata
  meta?: {
    // Reference info
    verse?: number;
    chapter?: number;
    page?: number;
    reference?: string;

    // Media
    audioUrl?: string;
    imageUrl?: string;
    thumbnailUrl?: string;

    // Attribution
    artistName?: string;
    artistNationality?: string;
    objectDate?: string;
    medium?: string;

    // Linguistic
    transliteration?: string;
    pronunciation?: string;
    partOfSpeech?: string;

    // Visual
    hex?: string;
    colorName?: string;

    // Source tracking
    sourceUrl?: string;
    sourceId?: string;
  };
}

// ════════════════════════════════════════════
// INGESTED PAGE (Collection of lines)
// ════════════════════════════════════════════

export interface IngestedPage {
  id: string;
  number?: number;
  title?: string;
  lines: IngestedLine[];
}

// ════════════════════════════════════════════
// INGESTED CONTENT (Full project import)
// ════════════════════════════════════════════

export interface IngestedContent {
  title: string;
  description?: string;
  sourceLang: string;
  targetLang?: string;
  layout: TileLayout;
  pages: IngestedPage[];

  // Metadata for project creation
  meta?: {
    source: string;
    sourceUrl?: string;
    author?: string;
    coverImageUrl?: string;
    publicDomain: boolean;
    fetchedAt: string;
  };
}

// ════════════════════════════════════════════
// ADAPTER INTERFACE
// ════════════════════════════════════════════

export interface LibraryAdapter {
  sourceId: string;
  displayName: string;

  // Search capability (if supportsSearch = true)
  search?: (query: string) => Promise<SearchResult[]>;

  // Fetch full content
  fetch: (config: WizardConfig) => Promise<IngestedContent>;
}

export interface SearchResult {
  id: string | number;
  title: string;
  subtitle?: string;
  thumbnail?: string;
}
```

---

## API Ingestor Route

### File: `src/app/api/library/ingest/route.ts`

This is the central endpoint that routes to the appropriate adapter.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateId } from '@/lib/utils';

// Import all adapters
import { BibleAdapter } from '@/services/library/adapters/bible';
import { QuranAdapter } from '@/services/library/adapters/quran';
import { GitaAdapter } from '@/services/library/adapters/gita';
import { GutendexAdapter } from '@/services/library/adapters/gutendex';
import { PoetryDBAdapter } from '@/services/library/adapters/poetrydb';
import { MetMuseumAdapter } from '@/services/library/adapters/met-museum';
import { UselessFactsAdapter } from '@/services/library/adapters/useless-facts';
import { StaticDataAdapter } from '@/services/library/adapters/static-data';

// Adapter registry
const ADAPTERS: Record<string, LibraryAdapter> = {
  'bible-api': BibleAdapter,
  alquran: QuranAdapter,
  'gita-api': GitaAdapter,
  gutendex: GutendexAdapter,
  poetrydb: PoetryDBAdapter,
  'met-museum': MetMuseumAdapter,
  'useless-facts': UselessFactsAdapter,
  'urban-dictionary': StaticDataAdapter,
  // ... add more as implemented
};

export async function POST(req: NextRequest) {
  try {
    const { sourceId, config, layout } = await req.json();

    // Validate source
    const adapter = ADAPTERS[sourceId];
    if (!adapter) {
      return NextResponse.json(
        { error: `Unknown source: ${sourceId}` },
        { status: 400 }
      );
    }

    // Fetch content through adapter
    const content = await adapter.fetch(config);

    // Ensure pages have IDs
    content.pages = content.pages.map((page, idx) => ({
      ...page,
      id: page.id || generateId(),
      number: page.number || idx + 1,
      lines: page.lines.map((line) => ({
        ...line,
        id: line.id || generateId(),
      })),
    }));

    return NextResponse.json(content);
  } catch (error) {
    console.error('Ingestion error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}
```

### Search Endpoint

### File: `src/app/api/library/search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source');
  const query = searchParams.get('q');

  if (!source || !query) {
    return NextResponse.json({ results: [] });
  }

  try {
    let results: SearchResult[] = [];

    switch (source) {
      case 'gutendex':
        const gutRes = await fetch(
          `https://gutendex.com/books?search=${encodeURIComponent(
            query
          )}&languages=en,fr,de,es`
        );
        const gutData = await gutRes.json();
        results = gutData.results.slice(0, 10).map((book: any) => ({
          id: book.id,
          title: book.title,
          subtitle: book.authors[0]?.name || 'Unknown Author',
          thumbnail: book.formats['image/jpeg'],
        }));
        break;

      case 'met-museum':
        const metSearchRes = await fetch(
          `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(
            query
          )}&hasImages=true&isPublicDomain=true`
        );
        const metSearchData = await metSearchRes.json();
        const objectIds = (metSearchData.objectIDs || []).slice(0, 10);

        // Fetch details for each object
        results = await Promise.all(
          objectIds.map(async (id: number) => {
            const objRes = await fetch(
              `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`
            );
            const obj = await objRes.json();
            return {
              id: obj.objectID,
              title: obj.title,
              subtitle: obj.artistDisplayName || obj.objectDate,
              thumbnail: obj.primaryImageSmall,
            };
          })
        );
        break;

      case 'poetrydb':
        const poetryRes = await fetch(
          `https://poetrydb.org/title/${encodeURIComponent(query)}`
        );
        const poetryData = await poetryRes.json();
        if (Array.isArray(poetryData)) {
          results = poetryData.slice(0, 10).map((poem: any) => ({
            id: poem.title,
            title: poem.title,
            subtitle: `by ${poem.author}`,
            thumbnail: undefined,
          }));
        }
        break;

      // Add more search implementations...
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [] });
  }
}
```

---

## Priority 1 Adapters (MVP)

### 1. Bible Adapter

```typescript
// src/services/library/adapters/bible.ts

import { LibraryAdapter, IngestedContent, IngestedLine } from '../types';
import { generateId } from '@/lib/utils';

export const BibleAdapter: LibraryAdapter = {
  sourceId: 'bible-api',
  displayName: 'Bible (Public Domain)',

  async fetch(config): Promise<IngestedContent> {
    const { book, chapter, importRange } = config;

    // Construct API URL
    // bible-api.com uses format: /john+3 or /john+3:16
    const reference = chapter ? `${book}+${chapter}` : book;
    const url = `https://bible-api.com/${encodeURIComponent(reference)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Bible API error: ${response.status}`);
    }

    const data = await response.json();

    // Normalize verses into lines
    const lines: IngestedLine[] = data.verses.map((verse: any) => ({
      id: generateId(),
      type: 'text',
      L1: verse.text.trim(),
      L2: '',
      meta: {
        verse: verse.verse,
        chapter: parseInt(chapter) || 1,
        reference: `${book} ${chapter}:${verse.verse}`,
        sourceId: `bible-${book}-${chapter}-${verse.verse}`,
      },
    }));

    // Add chapter heading
    lines.unshift({
      id: generateId(),
      type: 'heading',
      L1: `${book} Chapter ${chapter}`,
      L2: '',
      meta: { reference: `${book} ${chapter}` },
    });

    return {
      title: `${book} ${chapter}`,
      description: `From the ${data.translation_name || 'World English Bible'}`,
      sourceLang: 'en',
      layout: 'book',
      pages: [{ id: generateId(), lines }],
      meta: {
        source: 'bible-api.com',
        sourceUrl: url,
        publicDomain: true,
        fetchedAt: new Date().toISOString(),
      },
    };
  },
};
```

### 2. Quran Adapter

```typescript
// src/services/library/adapters/quran.ts

import { LibraryAdapter, IngestedContent, IngestedLine } from '../types';
import { generateId } from '@/lib/utils';

export const QuranAdapter: LibraryAdapter = {
  sourceId: 'alquran',
  displayName: 'Quran with Audio',

  async fetch(config): Promise<IngestedContent> {
    const surahNumber = parseInt(config.book?.split('.')[0]) || 1;

    // Fetch surah with audio
    const url = `http://api.alquran.cloud/v1/surah/${surahNumber}/ar.alafasy`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Quran API error: ${response.status}`);
    }

    const { data } = await response.json();

    // Normalize ayahs into lines
    const lines: IngestedLine[] = data.ayahs.map((ayah: any) => ({
      id: generateId(),
      type: 'text',
      L1: ayah.text,
      L2: '',
      meta: {
        verse: ayah.numberInSurah,
        chapter: surahNumber,
        reference: `${data.englishName} ${ayah.numberInSurah}`,
        audioUrl: ayah.audio, // MP3 URL for each ayah!
        sourceId: `quran-${surahNumber}-${ayah.numberInSurah}`,
      },
    }));

    // Add surah heading
    lines.unshift({
      id: generateId(),
      type: 'heading',
      L1: data.name, // Arabic name
      L2: data.englishName,
      meta: {
        transliteration: data.englishNameTranslation,
        reference: `Surah ${surahNumber}`,
      },
    });

    return {
      title: `Surah ${data.englishName}`,
      description: `${data.numberOfAyahs} ayahs • ${data.revelationType}`,
      sourceLang: 'ar',
      layout: 'book',
      pages: [{ id: generateId(), lines }],
      meta: {
        source: 'alquran.cloud',
        publicDomain: true,
        fetchedAt: new Date().toISOString(),
      },
    };
  },
};
```

### 3. Gutendex Adapter (Project Gutenberg)

```typescript
// src/services/library/adapters/gutendex.ts

import {
  LibraryAdapter,
  IngestedContent,
  IngestedLine,
  SearchResult,
} from '../types';
import { generateId } from '@/lib/utils';

export const GutendexAdapter: LibraryAdapter = {
  sourceId: 'gutendex',
  displayName: 'Project Gutenberg',

  async search(query: string): Promise<SearchResult[]> {
    const url = `https://gutendex.com/books?search=${encodeURIComponent(
      query
    )}&languages=en,fr,de,es`;
    const response = await fetch(url);
    const data = await response.json();

    return data.results.slice(0, 10).map((book: any) => ({
      id: book.id,
      title: book.title,
      subtitle: book.authors[0]?.name || 'Unknown Author',
      thumbnail: book.formats['image/jpeg'],
    }));
  },

  async fetch(config): Promise<IngestedContent> {
    const bookId = config.selectedId;

    // Step 1: Get book metadata
    const metaUrl = `https://gutendex.com/books/${bookId}`;
    const metaRes = await fetch(metaUrl);
    const bookMeta = await metaRes.json();

    // Step 2: Get text content
    const textUrl =
      bookMeta.formats['text/plain; charset=utf-8'] ||
      bookMeta.formats['text/plain; charset=us-ascii'] ||
      bookMeta.formats['text/plain'];

    if (!textUrl) {
      throw new Error('No text format available for this book');
    }

    const textRes = await fetch(textUrl);
    const rawText = await textRes.text();

    // Step 3: Parse text into paragraphs
    // Remove Gutenberg header/footer
    const cleanedText = removeGutenbergBoilerplate(rawText);

    // Split into paragraphs
    const paragraphs = cleanedText
      .split(/\n\s*\n/)
      .filter((p) => p.trim().length > 20) // Filter out short lines
      .slice(0, 100); // Limit to first 100 paragraphs for performance

    const lines: IngestedLine[] = paragraphs.map((para, idx) => ({
      id: generateId(),
      type:
        para.toUpperCase() === para && para.length < 100 ? 'heading' : 'text',
      L1: para.trim(),
      L2: '',
      meta: {
        paragraph: idx + 1,
        sourceId: `gutenberg-${bookId}-${idx}`,
      },
    }));

    return {
      title: bookMeta.title,
      description: bookMeta.authors[0]?.name,
      sourceLang: bookMeta.languages[0] || 'en',
      layout: 'book',
      pages: [{ id: generateId(), lines }],
      meta: {
        source: 'gutendex.com',
        sourceUrl: `https://www.gutenberg.org/ebooks/${bookId}`,
        author: bookMeta.authors[0]?.name,
        coverImageUrl: bookMeta.formats['image/jpeg'],
        publicDomain: !bookMeta.copyright,
        fetchedAt: new Date().toISOString(),
      },
    };
  },
};

// Helper: Remove Project Gutenberg boilerplate text
function removeGutenbergBoilerplate(text: string): string {
  // Find start marker
  const startMarkers = [
    '*** START OF THIS PROJECT GUTENBERG',
    '*** START OF THE PROJECT GUTENBERG',
    '*END*THE SMALL PRINT',
  ];

  // Find end marker
  const endMarkers = [
    '*** END OF THIS PROJECT GUTENBERG',
    '*** END OF THE PROJECT GUTENBERG',
    'End of the Project Gutenberg',
  ];

  let startIdx = 0;
  let endIdx = text.length;

  for (const marker of startMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      startIdx = text.indexOf('\n', idx) + 1;
      break;
    }
  }

  for (const marker of endMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      endIdx = idx;
      break;
    }
  }

  return text.slice(startIdx, endIdx);
}
```

### 4. PoetryDB Adapter

```typescript
// src/services/library/adapters/poetrydb.ts

import { LibraryAdapter, IngestedContent, IngestedLine } from '../types';
import { generateId } from '@/lib/utils';

export const PoetryDBAdapter: LibraryAdapter = {
  sourceId: 'poetrydb',
  displayName: 'Poetry Database',

  async search(query: string) {
    const url = `https://poetrydb.org/title/${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 404) return [];

    return data.slice(0, 10).map((poem: any) => ({
      id: poem.title,
      title: poem.title,
      subtitle: `by ${poem.author}`,
    }));
  },

  async fetch(config): Promise<IngestedContent> {
    let url: string;
    let data: any;

    if (config.randomCount) {
      // Random poem
      url = 'https://poetrydb.org/random';
      const response = await fetch(url);
      data = await response.json();
      if (Array.isArray(data)) data = data[0];
    } else if (config.selectedId) {
      // Specific poem by title
      url = `https://poetrydb.org/title/${encodeURIComponent(
        config.selectedId as string
      )}`;
      const response = await fetch(url);
      const result = await response.json();
      data = Array.isArray(result) ? result[0] : result;
    } else {
      throw new Error('No poem selection provided');
    }

    if (!data || data.status === 404) {
      throw new Error('Poem not found');
    }

    // Convert lines to our format
    const lines: IngestedLine[] = [
      // Title
      {
        id: generateId(),
        type: 'heading',
        L1: data.title,
        L2: '',
        meta: { author: data.author },
      },
      // Author line
      {
        id: generateId(),
        type: 'text',
        L1: `— ${data.author}`,
        L2: '',
        meta: {},
      },
      // Separator
      {
        id: generateId(),
        type: 'separator',
        L1: '',
        L2: '',
        meta: {},
      },
      // Poem lines
      ...data.lines.map((line: string, idx: number) => ({
        id: generateId(),
        type: 'text' as const,
        L1: line,
        L2: '',
        meta: {
          lineNumber: idx + 1,
          sourceId: `poem-${data.title}-${idx}`,
        },
      })),
    ];

    return {
      title: data.title,
      description: `by ${data.author} • ${data.linecount} lines`,
      sourceLang: 'en',
      layout: 'workbook',
      pages: [{ id: generateId(), lines }],
      meta: {
        source: 'poetrydb.org',
        author: data.author,
        publicDomain: true,
        fetchedAt: new Date().toISOString(),
      },
    };
  },
};
```

### 5. Met Museum Adapter

```typescript
// src/services/library/adapters/met-museum.ts

import {
  LibraryAdapter,
  IngestedContent,
  IngestedLine,
  SearchResult,
} from '../types';
import { generateId } from '@/lib/utils';

export const MetMuseumAdapter: LibraryAdapter = {
  sourceId: 'met-museum',
  displayName: 'The Metropolitan Museum of Art',

  async search(query: string): Promise<SearchResult[]> {
    const searchUrl = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(
      query
    )}&hasImages=true&isPublicDomain=true`;
    const searchRes = await fetch(searchUrl);
    const { objectIDs } = await searchRes.json();

    if (!objectIDs || objectIDs.length === 0) return [];

    // Fetch details for first 10 objects
    const results = await Promise.all(
      objectIDs.slice(0, 10).map(async (id: number) => {
        const objRes = await fetch(
          `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`
        );
        const obj = await objRes.json();
        return {
          id: obj.objectID,
          title: obj.title,
          subtitle: obj.artistDisplayName || obj.objectDate,
          thumbnail: obj.primaryImageSmall,
        };
      })
    );

    return results;
  },

  async fetch(config): Promise<IngestedContent> {
    const objectId = config.selectedId;
    const url = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectId}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Met Museum API error: ${response.status}`);
    }

    const artwork = await response.json();

    // Create lines for split-panel layout
    const lines: IngestedLine[] = [
      // Image block
      {
        id: generateId(),
        type: 'image',
        L1: artwork.primaryImage,
        L2: '',
        meta: {
          imageUrl: artwork.primaryImage,
          thumbnailUrl: artwork.primaryImageSmall,
          objectId: artwork.objectID,
        },
      },
      // Title
      {
        id: generateId(),
        type: 'heading',
        L1: artwork.title,
        L2: '', // User translates
        meta: {},
      },
      // Artist info
      {
        id: generateId(),
        type: 'text',
        L1: [
          artwork.artistDisplayName && `Artist: ${artwork.artistDisplayName}`,
          artwork.artistNationality && `(${artwork.artistNationality})`,
          artwork.objectDate && `Date: ${artwork.objectDate}`,
          artwork.medium && `Medium: ${artwork.medium}`,
          artwork.dimensions && `Dimensions: ${artwork.dimensions}`,
        ]
          .filter(Boolean)
          .join('\n'),
        L2: '',
        meta: {
          artistName: artwork.artistDisplayName,
          artistNationality: artwork.artistNationality,
          objectDate: artwork.objectDate,
          medium: artwork.medium,
        },
      },
      // Description prompt
      {
        id: generateId(),
        type: 'text',
        L1: 'Describe this artwork in your own words...',
        L2: '',
        meta: { isPrompt: true },
      },
    ];

    return {
      title: artwork.title,
      description: artwork.artistDisplayName,
      sourceLang: 'en',
      layout: 'split-panel',
      pages: [{ id: generateId(), lines }],
      meta: {
        source: 'metmuseum.github.io',
        sourceUrl: artwork.objectURL,
        author: artwork.artistDisplayName,
        coverImageUrl: artwork.primaryImageSmall,
        publicDomain: artwork.isPublicDomain,
        fetchedAt: new Date().toISOString(),
      },
    };
  },
};
```

### 6. Useless Facts Adapter

```typescript
// src/services/library/adapters/useless-facts.ts

import { LibraryAdapter, IngestedContent, IngestedLine } from '../types';
import { generateId } from '@/lib/utils';

export const UselessFactsAdapter: LibraryAdapter = {
  sourceId: 'useless-facts',
  displayName: 'Useless Facts',

  async fetch(config): Promise<IngestedContent> {
    const count = config.randomCount || 1;
    const facts: any[] = [];

    // Fetch multiple random facts
    for (let i = 0; i < Math.min(count, 10); i++) {
      const response = await fetch(
        'https://uselessfacts.jsph.pl/api/v2/facts/random'
      );
      if (response.ok) {
        const fact = await response.json();
        facts.push(fact);
      }
    }

    if (facts.length === 0) {
      throw new Error('Failed to fetch facts');
    }

    const lines: IngestedLine[] = facts.map((fact, idx) => ({
      id: generateId(),
      type: 'text',
      L1: fact.text,
      L2: '',
      meta: {
        sourceUrl: fact.source_url,
        factId: fact.id,
        index: idx + 1,
      },
    }));

    return {
      title: 'Did You Know?',
      description: `${facts.length} random fact${facts.length > 1 ? 's' : ''}`,
      sourceLang: 'en',
      layout: 'social',
      pages: [{ id: generateId(), lines }],
      meta: {
        source: 'uselessfacts.jsph.pl',
        publicDomain: true,
        fetchedAt: new Date().toISOString(),
      },
    };
  },
};
```

---

## Priority 2 Adapters

### Gita Adapter

```typescript
// src/services/library/adapters/gita.ts

import { LibraryAdapter, IngestedContent, IngestedLine } from '../types';
import { generateId } from '@/lib/utils';

export const GitaAdapter: LibraryAdapter = {
  sourceId: 'gita-api',
  displayName: 'Bhagavad Gita',

  async fetch(config): Promise<IngestedContent> {
    const chapterNumber = parseInt(config.book?.split('.')[0]) || 1;

    // Fetch chapter
    const url = `https://gita-api.vercel.app/chapter/${chapterNumber}`;
    const response = await fetch(url);
    const chapter = await response.json();

    // Fetch all slokas in chapter
    const slokas: any[] = [];
    for (let verse = 1; verse <= chapter.verses_count; verse++) {
      const slokaRes = await fetch(
        `https://gita-api.vercel.app/slok/${chapterNumber}/${verse}`
      );
      if (slokaRes.ok) {
        const sloka = await slokaRes.json();
        slokas.push(sloka);
      }
    }

    const lines: IngestedLine[] = [
      // Chapter heading
      {
        id: generateId(),
        type: 'heading',
        L1: chapter.name,
        L2: chapter.meaning?.en || '',
        meta: {
          chapter: chapterNumber,
          transliteration: chapter.transliteration,
        },
      },
      // Slokas
      ...slokas.map((sloka, idx) => ({
        id: generateId(),
        type: 'text' as const,
        L1: sloka.slok,
        L2: '',
        meta: {
          verse: idx + 1,
          transliteration: sloka.transliteration,
          hindiTranslation: sloka.tej?.ht,
          englishTranslation: sloka.tej?.et,
        },
      })),
    ];

    return {
      title: `Chapter ${chapterNumber}: ${chapter.transliteration}`,
      description: chapter.meaning?.en,
      sourceLang: 'sa', // Sanskrit
      layout: 'book',
      pages: [{ id: generateId(), lines }],
      meta: {
        source: 'gita-api.vercel.app',
        publicDomain: true,
        fetchedAt: new Date().toISOString(),
      },
    };
  },
};
```

### Thirukkural Adapter

```typescript
// src/services/library/adapters/thirukkural.ts

import { LibraryAdapter, IngestedContent, IngestedLine } from '../types';
import { generateId } from '@/lib/utils';

export const ThirukkuralAdapter: LibraryAdapter = {
  sourceId: 'thirukkural',
  displayName: 'Thirukkural',

  async fetch(config): Promise<IngestedContent> {
    const chapterNumber = parseInt(config.chapter) || 1;

    const url = `https://api-thirukkural.web.app/api/chapter/${chapterNumber}`;
    const response = await fetch(url);
    const data = await response.json();

    const kurals = data.kurals || [];

    const lines: IngestedLine[] = [
      // Chapter heading
      {
        id: generateId(),
        type: 'heading',
        L1: data.name || `Chapter ${chapterNumber}`,
        L2: '',
        meta: { chapter: chapterNumber },
      },
      // Kurals
      ...kurals.map((kural: any) => ({
        id: generateId(),
        type: 'text' as const,
        L1: kural.kural,
        L2: '',
        meta: {
          number: kural.number,
          englishTranslation: kural.translation,
          explanation: kural.explanation,
        },
      })),
    ];

    return {
      title: `Thirukkural: ${data.name || `Chapter ${chapterNumber}`}`,
      sourceLang: 'ta', // Tamil
      layout: 'book',
      pages: [{ id: generateId(), lines }],
      meta: {
        source: 'api-thirukkural.web.app',
        publicDomain: true,
        fetchedAt: new Date().toISOString(),
      },
    };
  },
};
```

---

## Static Data Adapters

For datasets that don't have live APIs, we pre-seed the data.

### File: `src/services/library/adapters/static-data.ts`

```typescript
import { LibraryAdapter, IngestedContent, IngestedLine } from '../types';
import { generateId } from '@/lib/utils';

// Import seeded data
import urbanDictionary from '@/data/seeds/urban-dictionary-top-1000.json';
import politicalSpeeches from '@/data/seeds/political-speeches-de.json';

export const StaticDataAdapter: LibraryAdapter = {
  sourceId: 'static',
  displayName: 'Static Dataset',

  async fetch(config): Promise<IngestedContent> {
    const { datasetId, randomCount = 5 } = config;

    switch (datasetId) {
      case 'urban-dictionary':
        return fetchUrbanDictionary(randomCount);
      case 'political-speeches':
        return fetchPoliticalSpeeches(config);
      default:
        throw new Error(`Unknown static dataset: ${datasetId}`);
    }
  },
};

function fetchUrbanDictionary(count: number): IngestedContent {
  // Randomly select words
  const shuffled = [...urbanDictionary].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  const lines: IngestedLine[] = selected.map((word: any) => ({
    id: generateId(),
    type: 'quiz',
    L1: word.word,
    L2: '',
    meta: {
      definition: word.definition,
      example: word.example,
      upvotes: word.upvotes,
    },
  }));

  return {
    title: 'Slang Flashcards',
    sourceLang: 'en',
    layout: 'social',
    pages: [{ id: generateId(), lines }],
    meta: {
      source: 'urban-dictionary',
      publicDomain: false, // User-generated content
      fetchedAt: new Date().toISOString(),
    },
  };
}

function fetchPoliticalSpeeches(config: any): IngestedContent {
  const speechId = config.selectedId;
  const speech = politicalSpeeches.find((s: any) => s.id === speechId);

  if (!speech) {
    throw new Error('Speech not found');
  }

  const lines: IngestedLine[] = [
    {
      id: generateId(),
      type: 'heading',
      L1: speech.title,
      L2: '',
      meta: { speaker: speech.speaker, date: speech.date },
    },
    ...speech.paragraphs.map((para: string, idx: number) => ({
      id: generateId(),
      type: 'text' as const,
      L1: para,
      L2: '',
      meta: { paragraph: idx + 1 },
    })),
  ];

  return {
    title: speech.title,
    description: `${speech.speaker}, ${speech.date}`,
    sourceLang: 'de',
    layout: 'book',
    pages: [{ id: generateId(), lines }],
    meta: {
      source: 'politische-reden.eu',
      author: speech.speaker,
      publicDomain: true,
      fetchedAt: new Date().toISOString(),
    },
  };
}
```

---

## Utility Adapters

These aren't content sources – they're tools that enhance the editor.

### LibreTranslate Adapter

```typescript
// src/services/library/utilities/libretranslate.ts

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const response = await fetch('https://libretranslate.com/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text',
    }),
  });

  if (!response.ok) {
    throw new Error('Translation failed');
  }

  const data = await response.json();
  return data.translatedText;
}
```

### DictionaryAPI Adapter

```typescript
// src/services/library/utilities/dictionary.ts

export async function defineWord(word: string): Promise<
  {
    definition: string;
    phonetic: string;
    partOfSpeech: string;
    example?: string;
  }[]
> {
  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
      word
    )}`
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const entry = data[0];

  return entry.meanings.flatMap((meaning: any) =>
    meaning.definitions.map((def: any) => ({
      definition: def.definition,
      phonetic: entry.phonetic || '',
      partOfSpeech: meaning.partOfSpeech,
      example: def.example,
    }))
  );
}
```

---

## Summary

The adapter system provides:

1. **Uniform Interface**: All adapters return `IngestedContent` regardless of source
2. **Search Support**: Adapters with search capability can be queried before fetching
3. **Metadata Preservation**: Source attribution, URLs, and licensing info are preserved
4. **Static Data Fallback**: For sources without live APIs, we use seeded JSON files
5. **Utility Tools**: Translation and dictionary APIs enhance the editor experience

---

_END OF ADAPTER IMPLEMENTATION GUIDE_
