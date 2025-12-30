# SYNOPTIC LIBRARY - Master Implementation Plan

> **Philosophy**: ONE IDEA = ONE TILE
> Users don't see "APIs" — they see **Products** and **Inspiration**.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [The 50+ Tile Registry](#tile-registry)
3. [Data Source Adapters](#adapters)
4. [Wizard System](#wizard-system)
5. [Implementation Phases](#phases)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYNOPTIC LIBRARY                              │
├─────────────────────────────────────────────────────────────────┤
│  FRONTEND                                                        │
│  ├── LibraryPage (Bento Grid)                                   │
│  ├── TileCard (Visual marketing unit)                           │
│  ├── SearchToolbar (Category filters + search)                  │
│  └── PreviewModal (Details + CTA)                               │
├─────────────────────────────────────────────────────────────────┤
│  WIZARD LAYER                                                    │
│  ├── SourceWizard (Dynamic form based on source capabilities)   │
│  ├── DataSelector (Book/Chapter/Verse pickers)                  │
│  └── LayoutConfigurator (book/poster/social/workbook)           │
├─────────────────────────────────────────────────────────────────┤
│  ADAPTER HUB (Backend)                                          │
│  ├── BibleAdapter, QuranAdapter, GitaAdapter...                 │
│  ├── GutendexAdapter, PoetryAdapter...                          │
│  ├── MetMuseumAdapter, ArticAdapter...                          │
│  └── StaticDataAdapter (Urban Dictionary, WikiCorp...)          │
├─────────────────────────────────────────────────────────────────┤
│  INGESTION ENGINE                                                │
│  ├── /api/library/ingest (POST)                                 │
│  ├── Normalizer → ProjectContent                                │
│  └── Project Creator → Editor Redirect                          │
├─────────────────────────────────────────────────────────────────┤
│  UTILITY INJECTORS (Auto-enabled per template)                  │
│  ├── LibreTranslate (AI Draft)                                  │
│  ├── LanguageTool (Grammar Check)                               │
│  ├── DictionaryAPI / Wiktionary (Definitions)                   │
│  └── Synonyms.com (Thesaurus)                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Files Structure

```
src/
├── app/
│   └── (marketing)/
│       └── library/
│           └── page.tsx          # Main Bento Grid page
├── components/
│   └── library/
│       ├── LibraryGrid.tsx       # Asymmetric tile layout
│       ├── TileCard.tsx          # Individual tile component
│       ├── PreviewModal.tsx      # Detail modal with CTA
│       ├── SearchToolbar.tsx     # Filter bar
│       └── SourceWizard.tsx      # Dynamic configuration wizard
├── services/
│   └── library/
│       ├── types.ts              # Core interfaces
│       ├── registry.ts           # 50+ tile definitions
│       ├── adapters/
│       │   ├── bible.ts
│       │   ├── quran.ts
│       │   ├── gita.ts
│       │   ├── thirukkural.ts
│       │   ├── gutendex.ts
│       │   ├── poetrydb.ts
│       │   ├── openlibrary.ts
│       │   ├── met-museum.ts
│       │   ├── artic.ts
│       │   ├── colourlovers.ts
│       │   ├── chronicling-america.ts
│       │   ├── mediawiki.ts
│       │   ├── useless-facts.ts
│       │   ├── indian-quotes.ts
│       │   └── static-data.ts    # Urban Dict, WikiCorp, etc.
│       └── utilities/
│           ├── libretranslate.ts
│           ├── languagetool.ts
│           ├── dictionary.ts
│           └── synonyms.ts
├── data/
│   └── seeds/
│       ├── urban-dictionary-top-1000.json
│       ├── political-speeches-excerpts.json
│       └── wordbank-children.json
└── app/
    └── api/
        └── library/
            ├── search/route.ts   # Search across sources
            └── ingest/route.ts   # Fetch & normalize content
```

---

## Tile Registry Categories

### CATEGORY A: SACRED & WISDOM TEXTS

| Tile ID         | Marketing Title            | Source                | Layout   |
| --------------- | -------------------------- | --------------------- | -------- |
| `bible-study`   | Build a Bilingual Bible    | bible-api.com         | book     |
| `bible-premium` | Professional Bible Edition | docs.api.bible        | book     |
| `quran-audio`   | Quran with Recitation      | alquran.cloud         | book     |
| `quran-simple`  | Quran Study Guide          | fawazahmed0/quran-api | workbook |
| `gita-wisdom`   | Gita Wisdom Cards          | gita-api.vercel.app   | poster   |
| `gita-full`     | Bhagavad Gita Complete     | bhagavadgita.com      | book     |
| `thirukkural`   | Tamil Ethics Collection    | api-thirukkural       | book     |
| `indian-quotes` | Daily Wisdom from India    | indian-quotes-api     | social   |

### CATEGORY B: CLASSIC LITERATURE

| Tile ID              | Marketing Title         | Source          | Layout   |
| -------------------- | ----------------------- | --------------- | -------- |
| `classic-novel`      | Translate a Masterpiece | gutendex.com    | book     |
| `novel-search`       | Find Your Next Classic  | gutendex.com    | book     |
| `poetry-daily`       | The Daily Sonnet        | poetrydb.org    | workbook |
| `poetry-author`      | Poet's Collection       | poetrydb.org    | book     |
| `openlibrary-covers` | Beautiful Book Covers   | openlibrary.org | book     |

### CATEGORY C: VISUAL & ART

| Tile ID            | Marketing Title        | Source                     | Layout      |
| ------------------ | ---------------------- | -------------------------- | ----------- |
| `met-ekphrasis`    | The Met Collection     | metmuseum.github.io        | split-panel |
| `met-landscapes`   | Landscape Masterpieces | metmuseum.github.io        | poster      |
| `artic-highlights` | Art Institute Picks    | api.artic.edu              | book        |
| `color-dictionary` | The Color Thesaurus    | colourlovers + thecolorapi | flashcard   |
| `getty-vocab`      | Art Vocabulary Builder | vocab.getty.edu            | workbook    |

### CATEGORY D: NEWS & HISTORY

| Tile ID              | Marketing Title        | Source              | Layout    |
| -------------------- | ---------------------- | ------------------- | --------- |
| `history-headlines`  | On This Day in History | chroniclingamerica  | newspaper |
| `political-speeches` | Great Speeches         | politische-reden.eu | book      |
| `saudi-news`         | Arabic News Practice   | SaudiNewsNet        | newspaper |
| `wiki-article`       | Wikipedia Translator   | mediawiki API       | article   |
| `factbook-country`   | Country Profiles       | factbook.json       | poster    |

### CATEGORY E: LANGUAGE & SLANG

| Tile ID           | Marketing Title     | Source                | Layout       |
| ----------------- | ------------------- | --------------------- | ------------ |
| `urban-slang`     | Slang Flashcards    | Kaggle Urban Dict     | social       |
| `fun-facts`       | Did You Know?       | uselessfacts.jsph.pl  | social       |
| `wordbank-kids`   | My First Words      | wordbank.stanford.edu | picture-book |
| `wiktionary-word` | Word Deep Dive      | wiktionary API        | workbook     |
| `collins-define`  | Collins Definitions | collinsdictionary API | flashcard    |

### CATEGORY F: ACADEMIC & AI

| Tile ID             | Marketing Title           | Source                       | Layout      |
| ------------------- | ------------------------- | ---------------------------- | ----------- |
| `corpus-builder`    | Build AI Dataset          | statmt.org WMT               | spreadsheet |
| `wikicorp-sample`   | Wikipedia Corpus          | westburylab wikicorp         | book        |
| `omw-wordnet`       | Open Multilingual WordNet | compling.hss OMW             | workbook    |
| `ud-treebank`       | Syntax Trees              | universaldependencies        | academic    |
| `keyphrase-extract` | Key Phrase Study          | AutomaticKeyphraseExtraction | workbook    |
| `personae-corpus`   | Character Analysis        | CLIPS personae               | book        |
| `explanation-bank`  | AI Explanations           | cognitiveai.org              | workbook    |

---

## Type Definitions

```typescript
// src/services/library/types.ts

export type TileLayout =
  | 'book' // Full book project
  | 'workbook' // Interactive exercises
  | 'poster' // Single-page visual
  | 'social' // Square Instagram format
  | 'flashcard' // Card-based learning
  | 'newspaper' // Article layout
  | 'split-panel' // Image left, text right
  | 'picture-book' // Illustrated children's format
  | 'spreadsheet' // Data/corpus view
  | 'article' // Long-form single column
  | 'academic'; // Scholarly format

export type TileCategory =
  | 'sacred'
  | 'literature'
  | 'visual'
  | 'news'
  | 'language'
  | 'academic';

export interface SourceCapabilities {
  supportsSearch: boolean; // User can type a query
  supportsReference: boolean; // Book/Chapter/Verse picker
  supportsRandom: boolean; // "Surprise Me" button
  supportsDateRange: boolean; // Historical date picker
  hasVisuals: boolean; // Returns images
  hasAudio: boolean; // Returns MP3/audio URLs
  requiresAuth: boolean; // Needs API key (AVOID)
}

export interface LibraryTile {
  id: string;

  // Marketing (What user sees)
  title: string; // "Build a Bilingual Bible"
  subtitle: string; // "Compare KJV/WEB side-by-side"
  description: string; // Longer explanation
  coverImage: string; // Visual for grid
  tileColor: string; // Tailwind class
  size: 'sm' | 'md' | 'lg'; // Bento grid sizing
  icon: string; // Lucide icon name

  // Technical
  sourceId: string; // Adapter reference
  category: TileCategory;
  layout: TileLayout;
  capabilities: SourceCapabilities;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'expert';

  // Utilities to auto-enable
  enabledUtilities: ('translate' | 'grammar' | 'dictionary' | 'thesaurus')[];
}

export interface IngestedLine {
  type: 'text' | 'image' | 'heading' | 'quiz' | 'separator';
  L1: string; // Source text or image URL
  L2: string; // Translation (often empty)
  meta?: {
    verse?: number;
    audioUrl?: string;
    imageUrl?: string;
    reference?: string;
    artistName?: string;
    hex?: string; // For color tiles
  };
}

export interface IngestedContent {
  title: string;
  sourceLang: string;
  targetLang: string;
  layout: TileLayout;
  pages: {
    id: string;
    lines: IngestedLine[];
  }[];
}
```

---

## Implementation Phases

### PHASE 1: Foundation (Week 1)

- [ ] Create `/library` route with placeholder
- [ ] Build `types.ts` with all interfaces
- [ ] Create `registry.ts` with first 10 tiles
- [ ] Build basic `LibraryGrid.tsx` component
- [ ] Style Bento grid with CSS Grid

### PHASE 2: Core Adapters (Week 2)

- [ ] Implement `bible.ts` adapter (bible-api.com)
- [ ] Implement `gutendex.ts` adapter
- [ ] Implement `poetrydb.ts` adapter
- [ ] Implement `useless-facts.ts` adapter
- [ ] Build `/api/library/ingest` route

### PHASE 3: Wizard System (Week 3)

- [ ] Build `SourceWizard.tsx` component
- [ ] Implement search-based wizard UI
- [ ] Implement reference-based wizard UI (Book/Chapter)
- [ ] Implement random/surprise wizard UI
- [ ] Connect wizard to ProjectWizard flow

### PHASE 4: Visual Sources (Week 4)

- [ ] Implement `met-museum.ts` adapter
- [ ] Implement `artic.ts` adapter
- [ ] Implement `colourlovers.ts` adapter
- [ ] Build split-panel layout for visuals
- [ ] Create poster export format

### PHASE 5: Expand Registry (Week 5-6)

- [ ] Add all 50+ tiles to registry
- [ ] Implement remaining adapters
- [ ] Seed static data (Urban Dictionary, etc.)
- [ ] Add i18n keys for all tile content
- [ ] Comprehensive testing

### PHASE 6: Polish (Week 7)

- [ ] Animations and micro-interactions
- [ ] Performance optimization
- [ ] Mobile responsive refinements
- [ ] Analytics integration
- [ ] SEO optimization for library pages

---

## API Endpoints Summary

| Endpoint                  | Method | Purpose                          |
| ------------------------- | ------ | -------------------------------- |
| `/api/library/search`     | GET    | Search across tile registry      |
| `/api/library/tiles`      | GET    | Get all tiles (with pagination)  |
| `/api/library/tiles/[id]` | GET    | Get single tile details          |
| `/api/library/ingest`     | POST   | Fetch content & create project   |
| `/api/library/preview`    | POST   | Preview content without creating |

---

## Data Sources Master List (All Provided)

### FREE, NO AUTH (Priority)

1. ✅ bible-api.com - Public Domain Bible
2. ✅ alquran.cloud - Quran + Audio
3. ✅ gita-api.vercel.app - Bhagavad Gita
4. ✅ api-thirukkural.web.app - Tamil Thirukkural
5. ✅ gutendex.com - Project Gutenberg API
6. ✅ poetrydb.org - Poetry Database
7. ✅ openlibrary.org - Book Covers/Metadata
8. ✅ metmuseum.github.io - Met Museum Art
9. ✅ api.artic.edu - Art Institute Chicago
10. ✅ uselessfacts.jsph.pl - Random Facts
11. ✅ indian-quotes-api.vercel.app - Indian Quotes
12. ✅ dictionaryapi.dev - Free Dictionary
13. ✅ en.wiktionary.org API - Wiktionary
14. ✅ thecolorapi.com - Color Information
15. ✅ colourlovers.com/api - Color Palettes
16. ✅ fawazahmed0/quran-api - Simple Quran
17. ✅ bhagavadgita.com/api - Gita Alternative

### REQUIRE AUTH/SPECIAL HANDLING

18. ⚠️ docs.api.bible - Needs API Key (Premium tier)
19. ⚠️ api.collinsdictionary.com - Needs API Key
20. ⚠️ languagetool.org - Rate limited
21. ⚠️ libretranslate.com - Self-host possible
22. ⚠️ synonyms.com - May need key

### STATIC DATASETS (Seed into DB)

23. 📦 factbook.json - CIA World Factbook
24. 📦 Kaggle Urban Dictionary - Slang words
25. 📦 politische-reden.eu - German speeches
26. 📦 statmt.org WMT - Translation corpora
27. 📦 westburylab wikicorp - Wikipedia corpus
28. 📦 wordbank.stanford.edu - Child language
29. 📦 universaldependencies.org - Syntax trees
30. 📦 SaudiNewsNet - Arabic news
31. 📦 cognitiveai.org explanationbank - AI explanations
32. 📦 CLIPS personae corpus - Character data
33. 📦 vocab.getty.edu - Art vocabulary
34. 📦 compling.hss OMW - Open Multilingual WordNet
35. 📦 AutomaticKeyphraseExtraction - NLP data

### COMPLEX/LOW PRIORITY

36. ⏸️ chroniclingamerica.loc.gov - Complex OCR
37. ⏸️ mediawiki API - Complex parsing
38. ⏸️ Harvard Library APIs - Academic
39. ⏸️ opencollective.com - Unrelated
40. ⏸️ lordicon.com - UI icons (not content)
41. ⏸️ kdnuggets datasets - Too broad

---

## Next Steps

1. **Approve this plan** ✓
2. **Create types.ts** with interfaces
3. **Create registry.ts** with first 10 tiles
4. **Build LibraryPage** with Bento grid
5. **Implement first 3 adapters** (Bible, Gutendex, Poetry)

Ready to proceed with implementation!
