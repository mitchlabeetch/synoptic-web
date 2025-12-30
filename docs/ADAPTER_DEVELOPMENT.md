# Synoptic Adapter Development Guide

> Step-by-step guide for creating new content adapters

---

## Overview

Adapters are the bridge between external APIs/data sources and Synoptic's normalized `IngestedContent` format. Each adapter handles:

1. **Searching** content (optional)
2. **Fetching** content based on wizard configuration
3. **Transforming** API responses into `IngestedContent`
4. **Handling errors** gracefully

---

## Quick Start Template

```typescript
// src/services/library/adapters/my-adapter.ts

import {
  LibraryAdapter,
  IngestedContent,
  IngestedLine,
  IngestedPage,
  WizardConfig,
  SearchResult,
  LicenseInfo,
} from '../types';

// ═══════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════

const API_BASE = 'https://api.example.com';

const LICENSE: LicenseInfo = {
  type: 'commercial-safe', // or 'attribution' or 'personal-only'
  name: 'Public Domain',
  url: 'https://example.com/license',
};

// ═══════════════════════════════════════════════════════════════════
// Adapter Implementation
// ═══════════════════════════════════════════════════════════════════

export const myAdapter: LibraryAdapter = {
  sourceId: 'my-source',
  displayName: 'My Source',

  // Optional: Enable search in wizard
  async search(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `${API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      return data.results.map((item: any) => ({
        id: item.id,
        title: item.title,
        subtitle: item.author || item.description?.substring(0, 100),
        imageUrl: item.thumbnail,
      }));
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },

  // Required: Fetch content for import
  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, searchQuery, randomCount = 10 } = config;

    // Determine what to fetch
    let endpoint = `${API_BASE}/content`;
    if (selectedId) {
      endpoint = `${API_BASE}/items/${selectedId}`;
    } else if (searchQuery) {
      endpoint = `${API_BASE}/search?q=${encodeURIComponent(searchQuery)}`;
    }

    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }

    const data = await response.json();

    // Transform to IngestedContent
    return transformToIngestedContent(data);
  },

  // Optional: Quick preview (lighter than full fetch)
  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    // Return first page or summary
    const fullContent = await this.fetch(config);
    return {
      title: fullContent.title,
      description: fullContent.description,
      pages: fullContent.pages.slice(0, 1),
    };
  },
};

// ═══════════════════════════════════════════════════════════════════
// Transform Helper
// ═══════════════════════════════════════════════════════════════════

function transformToIngestedContent(data: any): IngestedContent {
  const lines: IngestedLine[] = [];

  // Add title
  if (data.title) {
    lines.push({
      id: 'title',
      type: 'heading',
      L1: data.title,
      L2: '',
    });
  }

  // Add content paragraphs
  const paragraphs = data.text?.split('\n\n') || data.content || [];
  paragraphs.forEach((para: string, idx: number) => {
    if (para.trim()) {
      lines.push({
        id: `p-${idx}`,
        type: 'text',
        L1: para.trim(),
        L2: '',
        meta: {
          sourceUrl: data.url,
        },
      });
    }
  });

  return {
    title: data.title || 'Untitled',
    description: data.description,
    sourceLang: 'en',
    layout: 'book',
    pages: [
      {
        id: 'page-1',
        number: 1,
        title: data.title,
        lines,
      },
    ],
    meta: {
      source: 'My Source',
      sourceUrl: data.url || 'https://example.com',
      author: data.author,
      publicDomain: true,
      fetchedAt: new Date().toISOString(),
      license: LICENSE,
    },
    credits:
      LICENSE.type === 'attribution'
        ? {
            required: true,
            sources: [
              {
                name: 'My Source',
                url: data.url,
                license: LICENSE.name,
              },
            ],
          }
        : undefined,
  };
}

export default myAdapter;
```

---

## Step-by-Step Guide

### Step 1: Research the API

Before coding, understand:

1. **Base URL** and authentication requirements
2. **Rate limits** (important for preview/search)
3. **Response format** (JSON, XML, etc.)
4. **License terms** for the content
5. **Endpoints** for search vs. fetch

### Step 2: Create Adapter File

Create `src/services/library/adapters/[source-name].ts`

Naming convention: lowercase, hyphens (e.g., `my-source.ts`)

### Step 3: Implement Required Methods

#### `fetch(config: WizardConfig): Promise<IngestedContent>`

This is the only **required** method. It must:

1. Accept a `WizardConfig` with user selections
2. Call the external API
3. Transform response to `IngestedContent`
4. Handle errors gracefully

```typescript
async fetch(config: WizardConfig): Promise<IngestedContent> {
  const { selectedId, chapter, verse, searchQuery } = config;

  // Build API URL based on config
  // Fetch from API
  // Transform to IngestedContent
  // Return
}
```

#### `search(query, limit): Promise<SearchResult[]>` (Optional)

Enable if the source supports text search:

```typescript
async search(query: string, limit = 20): Promise<SearchResult[]> {
  // Call search endpoint
  // Return array of { id, title, subtitle, imageUrl? }
}
```

#### `preview(config): Promise<Partial<IngestedContent>>` (Optional)

Provide a quick preview before full import:

```typescript
async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
  // Return first page or summary
  // Less data than full fetch
}
```

### Step 4: Handle Different Content Types

#### Structured Texts (Bible, Quran, etc.)

```typescript
// Use chapter/verse from config
const { book, chapter, verse } = config;
const url = `${API}/books/${book}/chapters/${chapter}`;
```

#### Search-Based Sources

```typescript
// Use searchQuery or selectedId
if (config.selectedId) {
  url = `${API}/items/${config.selectedId}`;
} else if (config.searchQuery) {
  url = `${API}/search?q=${config.searchQuery}`;
}
```

#### Random/Date Sources

```typescript
// Use randomCount or date
const { randomCount = 10, date } = config;
if (date) {
  url = `${API}/content?date=${date}`;
} else {
  url = `${API}/random?count=${randomCount}`;
}
```

### Step 5: Register the Adapter

Add to `src/services/library/adapters/index.ts`:

```typescript
// Import
import { myAdapter } from './my-adapter';

// Add to ADAPTERS map
const ADAPTERS: Record<string, LibraryAdapter> = {
  // ... existing adapters
  'my-source': myAdapter,
};

// Add to license map
const licenseMap: Record<string, LicenseType> = {
  // ... existing
  'my-source': 'commercial-safe',
};

// Export
export { myAdapter } from './my-adapter';
```

### Step 6: Create Tiles

Add tiles to `src/services/library/registry.ts`:

```typescript
{
  id: 'my-source-explore',
  title: 'Explore My Source',
  subtitle: 'Compelling subtitle',
  description: 'Full description of what users can do...',
  tileColor: 'bg-gradient-to-br from-blue-200 via-indigo-100 to-violet-100',
  size: 'md',
  icon: 'BookOpen',
  sourceId: 'my-source',  // Must match adapter.sourceId
  category: 'literature',
  layout: 'book',
  capabilities: {
    supportsSearch: true,
    supportsReference: false,
    supportsRandom: true,
    supportsDateRange: false,
    supportsPagination: true,
    hasVisuals: false,
    hasAudio: false,
    requiresAuth: false,
  },
  tags: ['keyword1', 'keyword2'],
  difficulty: 'beginner',
  enabledUtilities: ['translate', 'dictionary'],
  license: {
    type: 'commercial-safe',
    name: 'Public Domain',
  },
  sourceName: 'My Source',
  sourceUrl: 'https://example.com',
},
```

---

## IngestedContent Structure

### Complete Interface

```typescript
interface IngestedContent {
  // Basic info
  title: string;
  description?: string;

  // Language settings
  sourceLang: string; // ISO 639-1 (e.g., 'en', 'fr', 'ar')
  targetLang?: string;

  // Layout hint for editor
  layout:
    | 'book'
    | 'poster'
    | 'flashcard'
    | 'workbook'
    | 'split-panel'
    | 'picture-book'
    | 'social'
    | 'academic';

  // Content pages
  pages: IngestedPage[];

  // Metadata
  meta: {
    source: string; // Display name
    sourceUrl: string; // Link to source
    author?: string;
    publicDomain?: boolean;
    fetchedAt: string; // ISO timestamp
    license: LicenseInfo;
  };

  // Attribution tracking
  credits?: {
    required: boolean;
    sources: CreditSource[];
  };
}

interface IngestedPage {
  id: string;
  number?: number;
  title?: string;
  lines: IngestedLine[];
}

interface IngestedLine {
  id: string;
  type: 'heading' | 'text' | 'image' | 'separator';
  L1: string; // Source language
  L2?: string; // Target language (usually empty on import)
  meta?: {
    verse?: number;
    chapter?: number;
    page?: number;
    reference?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    audioUrl?: string;
    sourceUrl?: string;
    author?: string;
    speaker?: string;
    transliteration?: string;
    altText?: string;
    copyright?: string;
    // Add custom fields as needed
  };
}
```

### Line Types

| Type        | Use Case              | Example                                                   |
| ----------- | --------------------- | --------------------------------------------------------- |
| `heading`   | Titles, chapter names | `type: 'heading', L1: 'Chapter 1'`                        |
| `text`      | Regular paragraphs    | `type: 'text', L1: 'Once upon a time...'`                 |
| `image`     | Images with captions  | `type: 'image', L1: 'Caption', meta: { imageUrl: '...' }` |
| `separator` | Visual breaks         | `type: 'separator', L1: '---'`                            |

---

## Capabilities Reference

Set these based on what your API supports:

| Capability           | When to Enable                 | Wizard UI          |
| -------------------- | ------------------------------ | ------------------ |
| `supportsSearch`     | API has search endpoint        | Text search input  |
| `supportsReference`  | Structured text (book/chapter) | Dropdown selectors |
| `supportsRandom`     | Can fetch random items         | "Random" button    |
| `supportsDateRange`  | Content by date                | Date picker        |
| `supportsPagination` | Paged results                  | Page navigation    |
| `hasVisuals`         | Returns images                 | Image preview      |
| `hasAudio`           | Has audio content              | Audio player       |
| `requiresAuth`       | Needs API key                  | Auth UI (future)   |

---

## Error Handling

### Recommended Pattern

```typescript
async fetch(config: WizardConfig): Promise<IngestedContent> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      // Handle HTTP errors
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || !data.content) {
      // Handle empty/invalid responses
      throw new Error('No content found');
    }

    return transform(data);

  } catch (error) {
    // Log for debugging
    console.error(`[${this.sourceId}] Fetch error:`, error);

    // Re-throw with user-friendly message
    throw new Error(
      `Failed to fetch from ${this.displayName}. Please try again.`
    );
  }
}
```

### Fallback Content

For unreliable APIs, provide fallback content:

```typescript
async fetch(config: WizardConfig): Promise<IngestedContent> {
  try {
    return await this.fetchFromAPI(config);
  } catch (error) {
    console.warn('API unavailable, using fallback');
    return this.getFallbackContent(config);
  }
}

private getFallbackContent(config: WizardConfig): IngestedContent {
  return {
    title: 'Sample Content',
    pages: [{
      id: 'fallback',
      lines: [
        { id: '1', type: 'text', L1: 'Sample text...', L2: '' },
      ],
    }],
    // ... rest of structure
  };
}
```

---

## Testing Your Adapter

### Unit Test Example

```typescript
// src/services/library/adapters/__tests__/my-adapter.test.ts

import { myAdapter } from '../my-adapter';

describe('myAdapter', () => {
  it('has correct sourceId', () => {
    expect(myAdapter.sourceId).toBe('my-source');
  });

  it('searches successfully', async () => {
    const results = await myAdapter.search?.('test');
    expect(Array.isArray(results)).toBe(true);
  });

  it('fetches content', async () => {
    const content = await myAdapter.fetch({ selectedId: '1' });
    expect(content.title).toBeDefined();
    expect(content.pages.length).toBeGreaterThan(0);
  });
});
```

### Manual Testing

1. Start dev server: `npm run dev`
2. Navigate to `/library`
3. Find your tile
4. Click to open wizard
5. Test search, selection, and import
6. Verify content in project

---

## Common Patterns

### Splitting Long Text into Pages

```typescript
function splitIntoPages(text: string, linesPerPage = 50): IngestedPage[] {
  const paragraphs = text.split('\n\n').filter((p) => p.trim());
  const pages: IngestedPage[] = [];

  for (let i = 0; i < paragraphs.length; i += linesPerPage) {
    const pageParas = paragraphs.slice(i, i + linesPerPage);
    pages.push({
      id: `page-${pages.length + 1}`,
      number: pages.length + 1,
      lines: pageParas.map((para, idx) => ({
        id: `p${pages.length}-${idx}`,
        type: 'text' as const,
        L1: para.trim(),
        L2: '',
      })),
    });
  }

  return pages;
}
```

### Handling Multiple Languages

```typescript
function createBilingualLine(
  id: string,
  original: string,
  translation: string,
  originalLang: string
): IngestedLine {
  return {
    id,
    type: 'text',
    L1: original,
    L2: translation,
    meta: {
      originalLang,
    },
  };
}
```

### Adding Images

```typescript
lines.push({
  id: 'image-1',
  type: 'image',
  L1: imageData.caption || '',
  L2: '',
  meta: {
    imageUrl: imageData.url,
    thumbnailUrl: imageData.thumbnail,
    altText: imageData.alt,
    copyright: imageData.credit,
  },
});
```

---

## Checklist

Before submitting your adapter:

- [ ] Adapter file created in `src/services/library/adapters/`
- [ ] `sourceId` is unique and kebab-case
- [ ] `fetch()` method implemented and working
- [ ] `search()` method implemented (if applicable)
- [ ] Error handling with helpful messages
- [ ] Registered in `adapters/index.ts`
- [ ] License type correctly set
- [ ] At least one tile created in `registry.ts`
- [ ] Tile has compelling title and description
- [ ] Tile has appropriate tags
- [ ] Type check passes: `npx tsc --noEmit`
- [ ] Manual testing completed
