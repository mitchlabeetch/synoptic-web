# Synoptic Discovery Library - Technical Documentation

## Overview

The **Discovery Library** is a content ingestion engine that normalizes 28+ free/open APIs and datasets into bilingual book projects. It follows the "ONE IDEA = ONE TILE" marketing principle with an asymmetric Bento-Grid UI and dynamic Source Wizard for frictionless project creation.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Sources & Adapters](#data-sources--adapters)
3. [Tile Registry System](#tile-registry-system)
4. [Wizard System](#wizard-system)
5. [License Guard System](#license-guard-system)
6. [Component Structure](#component-structure)
7. [API Reference](#api-reference)
8. [Adding New Adapters](#adding-new-adapters)
9. [Adding New Tiles](#adding-new-tiles)
10. [Quick Reference Tables](#quick-reference-tables)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DISCOVERY LIBRARY                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │   TILES     │───▶│   WIZARD    │───▶│      ADAPTERS           │  │
│  │  (registry) │    │  (config UI)│    │  (API integration)      │  │
│  └─────────────┘    └─────────────┘    └─────────────────────────┘  │
│         │                  │                       │                 │
│         ▼                  ▼                       ▼                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │ LibraryGrid │    │PreviewModal │    │   IngestedContent       │  │
│  │  TileCard   │    │SourceWizard│    │   (normalized output)   │  │
│  └─────────────┘    └─────────────┘    └─────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Flow

1. **User browses tiles** in the LibraryGrid (Bento layout)
2. **User clicks a tile** → Opens PreviewModal with SourceWizard
3. **User configures options** (book, chapter, search term, etc.)
4. **Wizard calls adapter** → Adapter fetches from external API
5. **Adapter returns IngestedContent** → Normalized format
6. **Content imported** into Synoptic project

---

## Data Sources & Adapters

### Adapter Location

```
src/services/library/adapters/
├── index.ts                  # Central registry (exports all adapters)
├── bible.ts                  # Bible-API
├── quran.ts                  # AlQuran Cloud
├── gutendex.ts               # Project Gutenberg
├── poetrydb.ts               # PoetryDB
├── met-museum.ts             # Metropolitan Museum
├── ... (28 total adapters)
```

### Adapter Interface

Every adapter must implement the `LibraryAdapter` interface:

```typescript
interface LibraryAdapter {
  sourceId: string; // Unique ID matching tile's sourceId
  displayName: string; // Human-readable name

  // Optional: Search for content
  search?(query: string, limit?: number): Promise<SearchResult[]>;

  // Required: Fetch content based on wizard configuration
  fetch(config: WizardConfig): Promise<IngestedContent>;

  // Optional: Quick preview without full fetch
  preview?(config: WizardConfig): Promise<Partial<IngestedContent>>;
}
```

### Adapter Registry

The central registry in `src/services/library/adapters/index.ts`:

```typescript
const ADAPTERS: Record<string, LibraryAdapter> = {
  'bible-api': bibleAdapter,
  'alquran-cloud': quranAdapter,
  gutendex: gutendexAdapter,
  // ... 28 total
};

// Functions
export function getAdapter(sourceId: string): LibraryAdapter | undefined;
export function hasAdapter(sourceId: string): boolean;
export function getAvailableAdapters(): string[];
export function getAdaptersByLicense(type): string[];
```

### Complete Adapter List

| Category    | Adapter File             | Source ID              | API/Source         |
| ----------- | ------------------------ | ---------------------- | ------------------ |
| **Sacred**  | bible.ts                 | `bible-api`            | bible-api.com      |
| **Sacred**  | quran.ts                 | `alquran-cloud`        | alquran.cloud      |
| **Sacred**  | bhagavad-gita.ts         | `gita-api`             | bhagavadgita.io    |
| **Sacred**  | sefaria.ts               | `sefaria`              | sefaria.org        |
| **Sacred**  | suttacentral.ts          | `suttacentral`         | suttacentral.net   |
| **Sacred**  | thirukkural.ts           | `thirukkural-api`      | API                |
| **Lit**     | gutendex.ts              | `gutendex`             | gutenberg.org      |
| **Lit**     | poetrydb.ts              | `poetrydb`             | poetrydb.org       |
| **Lit**     | open-library.ts          | `open-library`         | openlibrary.org    |
| **Lit**     | standard-ebooks.ts       | `standardebooks`       | standardebooks.org |
| **Lit**     | folger-shakespeare.ts    | `gutendex-shakespeare` | folger.edu         |
| **Lit**     | folklore.ts              | `static-folklore`      | Static data        |
| **Art**     | met-museum.ts            | `met-museum`           | metmuseum.org      |
| **Art**     | art-institute-chicago.ts | `artic`                | artic.edu          |
| **Art**     | rijksmuseum.ts           | `rijksmuseum`          | rijksmuseum.nl     |
| **Art**     | nasa-apod.ts             | `nasa-apod`            | apod.nasa.gov      |
| **Art**     | color-names.ts           | `color-names`          | Static data        |
| **Facts**   | restcountries.ts         | `restcountries`        | restcountries.com  |
| **Facts**   | quotable.ts              | `quotable`             | quotable.io        |
| **Facts**   | themealdb.ts             | `themealdb`            | themealdb.com      |
| **Facts**   | useless-facts.ts         | `useless-facts`        | API                |
| **Facts**   | free-dictionary.ts       | `free-dictionary`      | dictionaryapi.dev  |
| **History** | chronicling-america.ts   | `chronicling-america`  | loc.gov            |
| **History** | eurlex.ts                | `eurlex`               | eur-lex.europa.eu  |
| **Lang**    | tatoeba.ts               | `tatoeba`              | tatoeba.org        |
| **Lang**    | wikipedia.ts             | `wikipedia`            | wikipedia.org      |
| **Pop**     | xkcd.ts                  | `xkcd`                 | xkcd.com           |
| **Pop**     | pokeapi.ts               | `pokeapi`              | pokeapi.co         |

---

## Tile Registry System

### Location

```
src/services/library/registry.ts
```

### Tile Structure

Each tile in `LIBRARY_TILES` array:

```typescript
interface LibraryTile {
  // Identity
  id: string; // Unique tile ID (kebab-case)
  sourceId: string; // Maps to adapter

  // Marketing Copy
  title: string; // Primary headline (action-oriented)
  subtitle: string; // Secondary line
  description?: string; // Longer explanation

  // Visual Design
  tileColor: string; // Tailwind gradient classes
  size: 'sm' | 'md' | 'lg'; // Bento grid sizing
  icon: string; // Lucide icon name
  coverImage?: string; // Optional background image

  // Categorization
  category: TileCategory; // sacred, literature, visual, etc.
  layout: LayoutType; // book, poster, flashcard, etc.
  tags: string[]; // Searchable keywords (max 5)
  difficulty: 'beginner' | 'intermediate' | 'expert';

  // Capabilities
  capabilities: SourceCapabilities;
  enabledUtilities: string[]; // translate, grammar, dictionary, etc.

  // Licensing
  license: LicenseInfo;
  sourceName: string;
  sourceUrl: string;
}
```

### Categories

| Category        | Key          | Description               |
| --------------- | ------------ | ------------------------- |
| Sacred & Wisdom | `sacred`     | Religious/spiritual texts |
| Literature      | `literature` | Novels, poetry, drama     |
| Visual & Art    | `visual`     | Museum art, photography   |
| Knowledge       | `knowledge`  | Facts, quotes, recipes    |
| Language        | `language`   | Sentences, vocabulary     |
| History         | `history`    | Archives, newspapers      |
| Academic        | `academic`   | Research, formal texts    |
| Pop Culture     | `popculture` | Comics, games             |
| News            | `news`       | Headlines, articles       |

### Size Distribution

- `lg` (hero): Featured tiles, double height/width
- `md` (standard): Default size
- `sm` (compact): Quick-access tiles

### Helper Functions

```typescript
getTileById(id: string): LibraryTile | undefined;
getTilesByCategory(category: TileCategory): LibraryTile[];
getTilesBySourceId(sourceId: string): LibraryTile[];
getCommercialSafeTiles(): LibraryTile[];
getAttributionTiles(): LibraryTile[];
getPersonalOnlyTiles(): LibraryTile[];
searchTiles(query: string): LibraryTile[];
getFeaturedTiles(): LibraryTile[];
getTilesByDifficulty(difficulty): LibraryTile[];
getTileStats(): { total, commercial, attribution, personal, categories, sources };
```

---

## Wizard System

### Location

```
src/components/library/SourceWizard.tsx
src/components/library/PreviewModal.tsx
```

### WizardConfig Interface

Configuration passed from wizard to adapter:

```typescript
interface WizardConfig {
  // Selection
  selectedId?: string | number; // Selected item ID
  searchQuery?: string; // Search terms

  // Range selection (for structured texts)
  book?: string;
  chapter?: string | number;
  verse?: string | number;
  startChapter?: number;
  endChapter?: number;
  startVerse?: number;
  endVerse?: number;

  // Pagination & Random
  randomCount?: number; // How many random items
  page?: number;
  pageSize?: number;

  // Date range (for time-based content)
  date?: string;
  startDate?: string;
  endDate?: string;

  // Source-specific
  author?: string;
  language?: string;
  category?: string;
}
```

### Wizard Modes by Capability

The wizard adapts its UI based on tile capabilities:

| Capability           | Wizard UI                    |
| -------------------- | ---------------------------- |
| `supportsSearch`     | Text search input            |
| `supportsReference`  | Book/chapter/verse dropdowns |
| `supportsRandom`     | Random count slider          |
| `supportsDateRange`  | Date picker(s)               |
| `supportsPagination` | Page navigation              |
| `hasVisuals`         | Image preview grid           |
| `hasAudio`           | Audio player controls        |

---

## License Guard System

### License Types

```typescript
type LicenseType = 'commercial-safe' | 'attribution' | 'personal-only';

interface LicenseInfo {
  type: LicenseType;
  name: string; // e.g., "CC0", "CC-BY-SA 3.0"
  url?: string; // Link to license
  attributionText?: string; // Required credit text
  warningText?: string; // Warning for personal-only
}
```

### Visual Indicators

| Type               | Icon        | Color  | Meaning          |
| ------------------ | ----------- | ------ | ---------------- |
| 🟢 Commercial Safe | ShieldCheck | Green  | Free to monetize |
| 🟡 Attribution     | ShieldAlert | Yellow | Credit required  |
| 🔴 Personal Only   | ShieldX     | Red    | Study use only   |

### Auto-Credits Generation

When `license.type === 'attribution'`, the system auto-generates a Credits page:

```typescript
function generateCreditsPage(sources: CreditSource[]): IngestedPage {
  // Creates a formatted credits page with:
  // - Source names and URLs
  // - License information
  // - Required attribution text
}
```

---

## Component Structure

### Library Components

```
src/components/library/
├── index.ts                 # Barrel exports
├── LibraryGrid.tsx          # Main Bento grid container
├── TileCard.tsx             # Individual tile component
├── SearchToolbar.tsx        # Search, filters, quick tags
├── PreviewModal.tsx         # Modal wrapper for wizard
├── SourceWizard.tsx         # Configuration wizard
├── LicenseBadge.tsx         # License indicator
└── CreditsPageGenerator.ts  # Auto-credits utility
```

### Key Components

#### LibraryGrid

- Receives array of tiles
- Manages filter state (search, category, license, difficulty)
- Groups tiles by category
- Renders responsive Bento grid

#### SearchToolbar

- Text search (matches title, subtitle, tags, description)
- Category tabs (10 categories)
- License filter dropdown
- Difficulty filter dropdown
- Quick filter tags (bestseller, daily, quick, gift, etc.)
- Results count with clear button

#### TileCard

- Displays tile marketing info
- Dynamic Lucide icon
- License indicator badge
- Difficulty indicator dot
- Hover effects and animations
- Size-based grid spanning

---

## API Reference

### Adapter Functions

```typescript
// Get adapter by source ID
getAdapter(sourceId: string): LibraryAdapter | undefined

// Check if adapter exists
hasAdapter(sourceId: string): boolean

// Get all registered adapter IDs
getAvailableAdapters(): string[]

// Get adapter display names
getAdapterNames(): Record<string, string>

// Filter by license
getAdaptersByLicense(type: LicenseType): string[]

// Get statistics
getAdapterStats(): { total, safe, attribution, personal }
```

### Tile Functions

```typescript
// Lookups
getTileById(id: string): LibraryTile | undefined
getTilesByCategory(category: TileCategory): LibraryTile[]
getTilesBySourceId(sourceId: string): LibraryTile[]

// License filtering
getCommercialSafeTiles(): LibraryTile[]
getAttributionTiles(): LibraryTile[]
getPersonalOnlyTiles(): LibraryTile[]

// Search & filter
searchTiles(query: string): LibraryTile[]
getFeaturedTiles(): LibraryTile[]
getTilesByDifficulty(difficulty: Difficulty): LibraryTile[]

// Statistics
getTileStats(): TileStats
```

### IngestedContent Structure

```typescript
interface IngestedContent {
  title: string;
  description?: string;
  sourceLang: string; // ISO 639-1 code
  targetLang?: string;
  layout: LayoutType;
  pages: IngestedPage[];

  meta: {
    source: string;
    sourceUrl: string;
    author?: string;
    publicDomain?: boolean;
    fetchedAt: string;
    license: LicenseInfo;
  };

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
  L1: string; // Source language content
  L2?: string; // Target language content
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
    transliteration?: string;
    // ... other metadata
  };
}
```

---

## Adding New Adapters

### Step 1: Create Adapter File

```typescript
// src/services/library/adapters/my-source.ts

import {
  LibraryAdapter,
  IngestedContent,
  IngestedLine,
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

const API_BASE = 'https://api.example.com';

export const mySourceAdapter: LibraryAdapter = {
  sourceId: 'my-source',
  displayName: 'My Source',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    // Implement search (optional)
    const response = await fetch(`${API_BASE}/search?q=${query}`);
    const data = await response.json();
    return data.results.map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.description,
    }));
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, searchQuery } = config;

    // Fetch from API
    const response = await fetch(`${API_BASE}/items/${selectedId}`);
    const data = await response.json();

    // Transform to IngestedContent
    const lines: IngestedLine[] = [
      {
        id: 'title',
        type: 'heading',
        L1: data.title,
        L2: '',
      },
      // ... more lines
    ];

    return {
      title: data.title,
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
        sourceUrl: 'https://example.com',
        publicDomain: true,
        fetchedAt: new Date().toISOString(),
        license: {
          type: 'commercial-safe',
          name: 'Public Domain',
        },
      },
    };
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    // Return quick preview (optional)
    return {
      title: 'Preview Title',
      pages: [
        {
          id: 'preview',
          lines: [{ id: 'p1', type: 'text', L1: 'Preview text...', L2: '' }],
        },
      ],
    };
  },
};

export default mySourceAdapter;
```

### Step 2: Register in Index

```typescript
// src/services/library/adapters/index.ts

import { mySourceAdapter } from './my-source';

const ADAPTERS: Record<string, LibraryAdapter> = {
  // ... existing adapters
  'my-source': mySourceAdapter,
};

// Update getAdaptersByLicense
const licenseMap = {
  // ... existing
  'my-source': 'commercial-safe',
};

// Export
export { mySourceAdapter } from './my-source';
```

### Step 3: Create Tiles

Add tiles to `src/services/library/registry.ts`:

```typescript
{
  id: 'my-source-main',
  title: 'My Source Collection',
  subtitle: 'Marketing subtitle',
  description: 'Detailed description...',
  tileColor: 'bg-gradient-to-br from-blue-200 via-indigo-100 to-violet-100',
  size: 'md',
  icon: 'BookOpen',
  sourceId: 'my-source',
  category: 'literature',
  layout: 'book',
  capabilities: CAP_SEARCH,
  tags: ['keyword1', 'keyword2', 'bestseller'],
  difficulty: 'beginner',
  enabledUtilities: ['translate', 'dictionary'],
  license: LICENSE_PUBLIC_DOMAIN,
  sourceName: 'My Source',
  sourceUrl: 'https://example.com',
},
```

---

## Adding New Tiles

### Design Guidelines

1. **Title**: Action-oriented, compelling (e.g., "Build Your Bilingual Bible")
2. **Subtitle**: Clear value proposition (e.g., "Side-by-side verse comparison")
3. **Description**: Explain the use case and benefits
4. **Colors**: Use beautiful gradients matching the content mood
5. **Tags**: Include searchable terms (max 5, use existing tags when possible)
6. **Size**: Use `lg` for hero content, `md` for standard, `sm` for compact

### Available Tags (Popular)

| Tag          | Purpose              |
| ------------ | -------------------- |
| `bestseller` | Featured content     |
| `daily`      | Daily practice       |
| `quick`      | Short sessions       |
| `gift`       | Gift product ideas   |
| `poster`     | Wall art format      |
| `flashcard`  | Study cards          |
| `vocabulary` | Word learning        |
| `social`     | Social media content |
| `print`      | Print-ready          |
| `holiday`    | Seasonal content     |

### Color Template Examples

```
Sacred:      from-amber-100 via-amber-50 to-orange-100
Literature:  from-stone-200 via-stone-100 to-amber-50
Visual:      from-rose-200 via-pink-100 to-red-100
Knowledge:   from-yellow-200 via-amber-100 to-orange-100
Language:    from-violet-200 via-indigo-100 to-blue-100
History:     from-amber-300 via-yellow-200 to-orange-200
Dark theme:  from-gray-900 via-purple-900 to-black text-white
```

---

## Quick Reference Tables

### Tile Count by Category

| Category        | Count   |
| --------------- | ------- |
| Sacred & Wisdom | ~20     |
| Literature      | ~22     |
| Visual & Art    | ~12     |
| Knowledge       | ~15     |
| Language        | ~8      |
| History         | ~4      |
| Academic        | ~5      |
| Pop Culture     | ~4      |
| News            | ~2      |
| **Total**       | **~90** |

### License Distribution

| License            | Count | %   |
| ------------------ | ----- | --- |
| 🟢 Commercial Safe | ~85   | 95% |
| 🟡 Attribution     | ~3    | 3%  |
| 🔴 Personal Only   | ~4    | 4%  |

### Difficulty Distribution

| Level           | Count |
| --------------- | ----- |
| 🟢 Beginner     | ~45   |
| 🟡 Intermediate | ~35   |
| 🔴 Expert       | ~10   |

---

## File Structure Summary

```
src/services/library/
├── adapters/
│   ├── index.ts              # Adapter registry
│   └── [28 adapter files]    # Individual adapters
├── types.ts                  # TypeScript interfaces
├── registry.ts               # Tile definitions (~90 tiles)
└── index.ts                  # Barrel exports

src/components/library/
├── index.ts                  # Component exports
├── LibraryGrid.tsx           # Main grid layout
├── TileCard.tsx              # Individual tile
├── SearchToolbar.tsx         # Filters & search
├── PreviewModal.tsx          # Import modal
├── SourceWizard.tsx          # Config wizard
├── LicenseBadge.tsx          # License indicator
└── CreditsPageGenerator.ts   # Auto-credits

src/app/(marketing)/library/
├── page.tsx                  # Server component wrapper
└── LibraryPageClient.tsx     # Client component
```

---

## Version History

- **v1.0** (Dec 2024): Initial 20 adapters, 55 tiles
- **v1.1** (Dec 2024): Added 8 more adapters (28 total)
- **v1.2** (Dec 2024): Expanded to ~90 tiles with marketing angles
- **v1.3** (Dec 2024): Enhanced filtering (difficulty, quick tags)
