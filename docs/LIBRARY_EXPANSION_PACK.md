# SYNOPTIC LIBRARY - Expansion Pack & License Guard

> **This document consolidates 60+ data sources with legal safety classifications**
> Every source marked with Traffic Light system: 🟢 Commercial Safe, 🟡 Attribution Required, 🔴 Personal Only

---

## Table of Contents

1. [License Guard System](#license-guard-system)
2. [Extended Type Definitions](#extended-types)
3. [Category A: Living Literature](#category-a)
4. [Category B: Pop Culture & Media](#category-b)
5. [Category C: Knowledge & Facts](#category-c)
6. [Category D: Linguistic & Corpus](#category-d)
7. [Category E: Visual & Creative](#category-e)
8. [Category F: Sacred & Historical](#category-f)
9. [Category G: Utility Tools](#category-g)
10. [Complete Registry](#complete-registry)
11. [Seeded Data Strategy](#seeded-strategy)

---

## License Guard System

### Traffic Light Classification

| Light         | License Type      | User Rights            | Action Required             |
| ------------- | ----------------- | ---------------------- | --------------------------- |
| 🟢 **GREEN**  | `commercial-safe` | Can publish & sell     | No restrictions             |
| 🟡 **YELLOW** | `attribution`     | Commercial with credit | Auto-generate Credits page  |
| 🔴 **RED**    | `personal-only`   | Study only, no selling | Warning modal before import |

### Dangerous Sources (REMOVED from Registry)

| Source                  | Risk                               | Decision         |
| ----------------------- | ---------------------------------- | ---------------- |
| **Jikan (MyAnimeList)** | TOS Violation - explicitly illegal | ❌ REMOVED       |
| **Lyrics.ovh**          | Song lyrics are copyrighted        | ❌ REMOVED       |
| **TMDB**                | Non-commercial license             | ❌ REMOVED       |
| **xkcd**                | CC-BY-NC - no commercial           | 🔴 PERSONAL ONLY |
| **PokeAPI**             | Trademark risk                     | 🔴 PERSONAL ONLY |
| **Urban Dictionary**    | Gray area - user content           | 🟡 ATTRIBUTION   |

---

## Extended Type Definitions

```typescript
// src/services/library/types.ts - EXTENDED

export type LicenseType =
  | 'commercial-safe' // 🟢 GREEN - Full commercial rights
  | 'attribution' // 🟡 YELLOW - Commercial with credit required
  | 'personal-only'; // 🔴 RED - Study only, no publishing

export interface LibraryTile {
  id: string;

  // Marketing
  title: string;
  subtitle: string;
  description: string;
  coverImage: string;
  tileColor: string;
  size: 'sm' | 'md' | 'lg';
  icon: string;

  // Technical
  sourceId: string;
  category: TileCategory;
  layout: TileLayout;
  capabilities: SourceCapabilities;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'expert';
  enabledUtilities: ('translate' | 'grammar' | 'dictionary' | 'thesaurus')[];

  // 🆕 LICENSE GUARD
  licenseType: LicenseType;
  attributionTemplate?: string; // Credit text to auto-insert
  licenseNotes?: string; // Additional legal info
  publicDomain: boolean; // True if unambiguously PD

  // Source URLs for attribution
  sourceUrl?: string;
  sourceName?: string;
}

// Auto-generated credits for Yellow Light sources
export interface ProjectCredits {
  sources: {
    name: string;
    license: string;
    attributionText: string;
    url?: string;
  }[];
  generatedAt: string;
}
```

---

## Category A: Living Literature Engine 🟢

_Target: Fiction translators, narrative enthusiasts_

### TILE: `short-story-5min`

**Marketing Title**: "The 5-Minute Read"
**Subtitle**: "Translate a complete short story in one sitting"
**Source**: Standard Ebooks OPDS + Gutendex (short story collections)
**License**: 🟢 Commercial Safe (CC0 / Public Domain)

**Wizard Flow**:

1. Browse by mood (Horror, Romance, Adventure)
2. Select story length (Flash fiction / Short story)
3. Import

**Layout**: `book`
**Tags**: `fiction`, `short`, `quick-wins`

---

### TILE: `myths-legends`

**Marketing Title**: "Myths & Legends"
**Subtitle**: "Grimm's Fairy Tales, Aesop's Fables, Norse Mythology"
**Source**: Project Gutenberg via Gutendex (folklore subset)
**License**: 🟢 Commercial Safe

**Wizard Flow**:

1. Select mythology (Greek / Norse / Celtic / African)
2. Browse stories
3. Import with illustrations

**Implementation**: Pre-compile into `src/data/seeds/folklore-anthology.json`

---

### TILE: `latin-classics`

**Marketing Title**: "Classics Lab: Latin"
**Subtitle**: "Caesar, Cicero, and Vergil from the source"
**Source**: The Latin Library (HTML scraping) + Perseus Digital Library
**License**: 🟢 Commercial Safe (Ancient texts are Public Domain)

**Wizard Flow**:

1. Select author (Caesar / Cicero / Vergil / Ovid)
2. Select work
3. Import with parsing options

**Layout**: `book`
**Notes**: Perfect for Latin→English or Latin→[Modern Language] projects

---

### TILE: `shakespeare-studio`

**Marketing Title**: "The Bard's Studio"
**Subtitle**: "Parallel text editing for Shakespeare"
**Source**: Folger Shakespeare Library (openly licensed) + Gutenberg
**License**: 🟢 Commercial Safe

**Wizard Flow**:

1. Select Play or Sonnets
2. Choose Act/Scene or Sonnet number
3. Import with speaker annotations

**Special Feature**: Auto-highlight character names for drama translation

---

### TILE: `standard-ebooks`

**Marketing Title**: "Modern Typographic Classics"
**Subtitle**: "Beautifully formatted Austen, Melville, Dickens"
**Source**: Standard Ebooks OPDS Feed
**API**: `https://standardebooks.org/opds`
**License**: 🟢 Commercial Safe (CC0)

**Wizard Flow**:

1. Browse by author or genre
2. Preview table of contents
3. Import full or selected chapters

**Why**: Cleaner text than raw Gutenberg (typo-corrected, proper typography)

---

## Category B: Pop Culture Engine (Restricted) 🔴🟡

_Target: Younger audiences, casual learners_
_⚠️ MOST POP CULTURE SOURCES HAVE RESTRICTIONS_

### TILE: `pokemon-study` 🔴

**Marketing Title**: "Pokédex Language Study"
**Subtitle**: "Compare Pokémon descriptions across languages (Personal Use)"
**Source**: PokeAPI
**API**: `https://pokeapi.co/api/v2/`
**License**: 🔴 PERSONAL ONLY (Trademark risk)

**Warning Modal**:

> "This content is for personal language study only. You cannot sell or publish books containing Pokémon content without Nintendo's permission."

**Wizard Flow**:

1. Search Pokémon by name
2. View flavor text in multiple languages
3. Create comparison flashcards

**Layout**: `flashcard`
**Educational Use**: Excellent for comparing localization strategies

---

### TILE: `movie-synopses` 🟡

**Marketing Title**: "Cinema Studies"
**Subtitle**: "Practice with movie plot summaries"
**Source**: Wikipedia (movie pages) via WikiMedia API
**License**: 🟡 ATTRIBUTION (CC-BY-SA via Wikipedia)

**Attribution**: "Plot summary adapted from Wikipedia"

---

### TILE: `gaming-lore` 🟡

**Marketing Title**: "Video Game Histories"
**Subtitle**: "Translate gaming documentation and histories"
**Source**: IGDB (via Twitch API, needs key) OR Wikipedia
**License**: 🟡 ATTRIBUTION

**Fallback**: Use Wikipedia game articles for no-auth version

---

## Category C: Knowledge & Facts Engine 🟢

_Target: Non-fiction translators, educators_

### TILE: `country-atlas`

**Marketing Title**: "Atlas of the World"
**Subtitle**: "Bilingual profile for every country on Earth"
**Source**: REST Countries API
**API**: `https://restcountries.com/v3.1/all`
**License**: 🟢 Commercial Safe (Factual data cannot be copyrighted)

**Wizard Flow**:

1. Select region (Europe / Asia / Africa...)
2. Choose country
3. Generate country profile card

**Output**: Capital, population, demonyms, translations of country name

---

### TILE: `nasa-cosmos`

**Marketing Title**: "Cosmic Captions"
**Subtitle**: "Daily astronomy with scientific explanations"
**Source**: NASA APOD API
**API**: `https://api.nasa.gov/planetary/apod`
**License**: 🟢 Commercial Safe (Most NASA images PD)
**Note**: Check individual image credits - photographer images may be ©

**Wizard Flow**:

1. Browse by date or random
2. View high-res image + explanation
3. Import for translation

**Layout**: `split-panel`

---

### TILE: `recipe-translator`

**Marketing Title**: "Culinary Arts"
**Subtitle**: "Translate recipes: ingredients, instructions, measurements"
**Source**: TheMealDB
**API**: `https://www.themealdb.com/api/json/v1/1/random.php`
**License**: 🟢 Commercial Safe (Recipes cannot be copyrighted, only specific wording)

**Wizard Flow**:

1. Browse by cuisine (French / Italian / Mexican...)
2. Select recipe
3. Import with structured ingredient list

---

### TILE: `science-frontier`

**Marketing Title**: "Science Frontier"
**Subtitle**: "Translate abstracts of cutting-edge research"
**Source**: arXiv API
**API**: `https://export.arxiv.org/api/query`
**License**: 🟢 Commercial Safe (Authors retain copyright but abstracts are factual)

**Wizard Flow**:

1. Select field (Physics / AI / Biology / Math)
2. Browse recent papers
3. Import abstract + title

**Target**: Technical translation practice

---

### TILE: `food-facts`

**Marketing Title**: "Global Grocery Guide"
**Subtitle**: "Translate ingredients and nutrition labels"
**Source**: Open Food Facts
**API**: `https://world.openfoodfacts.org/api/v0/product/`
**License**: 🟡 ATTRIBUTION (ODbL - requires attribution for databases)

**Attribution**: "Data from Open Food Facts (openfoodfacts.org)"

---

## Category D: Linguistic & Corpus Engine 🟢🟡

_Target: Polyglots, NLP researchers_

### TILE: `sentence-miner`

**Marketing Title**: "Sentence Miner"
**Subtitle**: "Thousands of example sentences in context"
**Source**: Tatoeba
**API**: `https://tatoeba.org/eng/api_v0/`
**License**: 🟡 ATTRIBUTION (CC-BY 2.0 FR)

**Attribution Template**: "Sentence by [username], via Tatoeba.org (CC-BY 2.0)"
**Implementation**: Must fetch and store sentence author for attribution

**Wizard Flow**:

1. Enter word or phrase
2. View bilingual sentence pairs
3. Import with proper attribution

---

### TILE: `rosetta-parallel`

**Marketing Title**: "The Rosetta Stone"
**Subtitle**: "Massive parallel texts from EU, UN, and OpenSubtitles"
**Source**: OPUS (Open Parallel Corpus)
**API**: `https://opus.nlpl.eu/`
**License**: 🟢/🟡 Mixed (varies by sub-corpus)

**Safe Subcorpora**: EuroParl (🟢), UN (🟢)
**Restricted**: OpenSubtitles (🟡 - attribution)

---

### TILE: `word-origins`

**Marketing Title**: "Word Origins"
**Subtitle**: "Trace the history of words"
**Source**: Etymonline (scraper) OR Wiktionary etymology section
**License**: 🟢 Commercial Safe (via Wiktionary as fallback)

---

## Category E: Visual & Creative Engine 🟢

_Target: Artists, poets, designers_

### TILE: `chicago-gallery`

**Marketing Title**: "Gallery Labels"
**Subtitle**: "Write bilingual museum placards for masterworks"
**Source**: Art Institute of Chicago API
**API**: `https://api.artic.edu/api/v1/artworks`
**License**: 🟢 Commercial Safe (CC0 for public domain artworks)

**Filter**: `is_public_domain=true`

---

### TILE: `comic-xkcd` 🔴

**Marketing Title**: "Comic Strip Localization"
**Subtitle**: "Translate webcomic humor (Personal Study Only)"
**Source**: xkcd API
**API**: `https://xkcd.com/info.0.json`
**License**: 🔴 PERSONAL ONLY (CC-BY-NC)

**Warning**: "xkcd is licensed CC-BY-NC. You cannot sell translations."

---

### TILE: `fortune-cookies`

**Marketing Title**: "Cookie Fortunes"
**Subtitle**: "Short advice perfect for calligraphy"
**Source**: Advice Slip API
**API**: `https://api.adviceslip.com/advice`
**License**: 🟢 Commercial Safe

---

### TILE: `quote-posters`

**Marketing Title**: "Typography Posters"
**Subtitle**: "Famous quotes formatted for print"
**Source**: Quotable.io
**API**: `https://api.quotable.io/random`
**License**: 🟢 Commercial Safe (Quotes from PD figures)

---

## Category F: Sacred & Historical Engine 🟢

_Target: Religious communities, historians_

### TILE: `torah-sefaria`

**Marketing Title**: "The Living Torah"
**Subtitle**: "Jewish texts with interlinked commentaries"
**Source**: Sefaria API
**API**: `https://www.sefaria.org/api/`
**License**: 🟢/🟡 Mixed (check `license` field per text)

**Safe Books**: Tanakh, Mishnah (CC0)
**Restricted**: Some modern commentaries (CC-BY / CC-BY-NC)

**Implementation**: Filter for `license !== 'CC-BY-NC'`

---

### TILE: `buddhist-suttas`

**Marketing Title**: "Buddhist Suttas"
**Subtitle**: "Early Buddhist texts in Pali and English"
**Source**: SuttaCentral API
**API**: `https://suttacentral.net/api/`
**License**: 🟢/🟡 Mixed

**Safe**: Bhikkhu Sujato translations (CC0)
**Note**: Check license per translation

---

### TILE: `time-traveler`

**Marketing Title**: "Time Traveler"
**Subtitle**: "Newspaper front pages from 100 years ago"
**Source**: Chronicling America (Library of Congress)
**API**: `https://chroniclingamerica.loc.gov/search/pages/results/`
**License**: 🟢 Commercial Safe (Public Domain)

**Wizard Flow**:

1. Select date (100 years ago today as default)
2. Browse newspaper headlines
3. Import OCR text

---

### TILE: `eu-law`

**Marketing Title**: "The Law"
**Subtitle**: "EU Legal texts in 24 languages"
**Source**: EUR-Lex API
**API**: `https://eur-lex.europa.eu/`
**License**: 🟢 Commercial Safe (EU reuse allowed with attribution)

**Target**: Formal/legal translation practice

---

## Category G: Utility Tools 🟢

_Already implemented in Editor Utility Layer_

| Tool                       | Source               | Status         |
| -------------------------- | -------------------- | -------------- |
| Datamuse (Synonyms/Rhymes) | `api.datamuse.com`   | ✅ Implemented |
| LibreTranslate             | `libretranslate.com` | ✅ Implemented |
| LanguageTool               | `languagetool.org`   | ✅ Implemented |
| Dictionary API             | `dictionaryapi.dev`  | ✅ Implemented |
| Wiktionary                 | `en.wiktionary.org`  | ✅ Implemented |

---

## Complete Tile Registry Summary

### 🟢 GREEN LIGHT - Commercial Safe (42 tiles)

| ID                                      | Title                   | Source               | Category   |
| --------------------------------------- | ----------------------- | -------------------- | ---------- |
| bible-study                             | Bilingual Bible         | bible-api.com        | sacred     |
| quran-audio                             | Quran with Recitation   | alquran.cloud        | sacred     |
| gita-wisdom                             | Gita Wisdom Cards       | gita-api.vercel.app  | sacred     |
| thirukkural                             | Tamil Ethics            | api-thirukkural      | sacred     |
| classic-novel                           | Translate a Masterpiece | gutendex.com         | literature |
| poetry-daily                            | The Daily Sonnet        | poetrydb.org         | literature |
| short-story-5min                        | The 5-Minute Read       | standard-ebooks      | literature |
| myths-legends                           | Myths & Legends         | gutenberg folklore   | literature |
| latin-classics                          | Classics Lab: Latin     | latin-library        | literature |
| shakespeare-studio                      | The Bard's Studio       | folger/gutenberg     | literature |
| standard-ebooks                         | Modern Typographic      | standardebooks.org   | literature |
| met-ekphrasis                           | The Met Collection      | metmuseum.github.io  | visual     |
| chicago-gallery                         | Gallery Labels          | api.artic.edu        | visual     |
| fortune-cookies                         | Cookie Fortunes         | adviceslip.com       | visual     |
| quote-posters                           | Typography Posters      | quotable.io          | visual     |
| country-atlas                           | Atlas of the World      | restcountries.com    | knowledge  |
| nasa-cosmos                             | Cosmic Captions         | nasa.gov/apod        | knowledge  |
| recipe-translator                       | Culinary Arts           | themealdb.com        | knowledge  |
| science-frontier                        | Science Frontier        | arxiv.org            | knowledge  |
| time-traveler                           | Newspaper Archives      | chroniclingamerica   | history    |
| torah-sefaria                           | The Living Torah        | sefaria.org          | sacred     |
| buddhist-suttas                         | Buddhist Suttas         | suttacentral.net     | sacred     |
| eu-law                                  | The Law                 | eur-lex.europa.eu    | history    |
| fun-facts                               | Did You Know?           | uselessfacts.jsph.pl | language   |
| rosetta-parallel                        | Rosetta Stone (EU/UN)   | opus.nlpl.eu         | academic   |
| word-origins                            | Word Origins            | wiktionary           | language   |
| _...and 16 more from original registry_ |                         |                      |            |

### 🟡 YELLOW LIGHT - Attribution Required (12 tiles)

| ID              | Title            | Source            | Attribution                           |
| --------------- | ---------------- | ----------------- | ------------------------------------- |
| sentence-miner  | Sentence Miner   | tatoeba.org       | "Sentence by [user], via Tatoeba.org" |
| food-facts      | Global Grocery   | openfoodfacts.org | "Data from Open Food Facts"           |
| movie-synopses  | Cinema Studies   | wikipedia         | "Adapted from Wikipedia"              |
| urban-slang     | Slang Flashcards | urban-dictionary  | "Via Urban Dictionary"                |
| wiktionary-word | Word Deep Dive   | wiktionary        | CC-BY-SA                              |
| _...and 7 more_ |                  |                   |                                       |

### 🔴 RED LIGHT - Personal Only (3 tiles)

| ID              | Title              | Source     | Warning                      |
| --------------- | ------------------ | ---------- | ---------------------------- |
| pokemon-study   | Pokédex Study      | pokeapi.co | Trademark restriction        |
| comic-xkcd      | Comic Localization | xkcd.com   | CC-BY-NC                     |
| _anime removed_ | —                  | —          | TOS violation - not included |

---

## Seeded Data Strategy

### Directory Structure

```
src/data/seeds/
├── literature/
│   ├── folklore-anthology.json       # 100 fairy tales/fables
│   ├── short-stories-collection.json # 50 complete short stories
│   └── shakespeare-sonnets.json      # All 154 sonnets
├── reference/
│   ├── countries-profiles.json       # All 195 countries
│   ├── world-factbook-2024.json      # CIA Factbook snapshot
│   └── eu-treaties-excerpts.json     # Key EU legal texts
├── language/
│   ├── urban-dictionary-top-1000.json
│   ├── tatoeba-common-phrases.json   # 5000 sentence pairs
│   └── etymology-common-words.json   # 500 word origins
├── sacred/
│   ├── bible-kjv-chapters.json       # Pre-parsed KJV
│   ├── quran-english-audio.json      # Surah metadata + audio URLs
│   └── gita-chapters.json            # All 18 chapters
└── visual/
    ├── met-museum-highlights.json    # Top 100 public domain artworks
    └── chicago-art-highlights.json   # Top 50 works
```

### Pre-Seeding Script

```typescript
// scripts/seed-library-data.ts

import { writeFileSync } from 'fs';

async function seedFolklore() {
  // Fetch Grimm's Fairy Tales, Aesop, etc. from Gutenberg
  const grimm = await fetch('https://gutendex.com/books?topic=fairy%20tales');
  // Process and save...
}

async function seedCountries() {
  const countries = await fetch('https://restcountries.com/v3.1/all');
  const data = await countries.json();
  writeFileSync(
    'src/data/seeds/reference/countries-profiles.json',
    JSON.stringify(data, null, 2)
  );
}

// Run all seeders
async function main() {
  await seedFolklore();
  await seedCountries();
  // ... etc
}
```

### Benefits of Seeding

1. **Zero API latency** for browsing
2. **No rate limit issues** for popular content
3. **Offline-ready** for demos
4. **Controlled quality** - curated content only
5. **Legal clarity** - pre-audited for license

---

## Implementation Checklist

### Phase 1: License Guard (Priority)

- [ ] Add `licenseType` to `LibraryTile` interface
- [ ] Add `attributionTemplate` field
- [ ] Create `LicenseBadge` component for tiles
- [ ] Create `AttributionWarningModal` for 🔴 tiles
- [ ] Create `CreditsPageGenerator` for 🟡 tiles

### Phase 2: New Adapters

- [ ] Implement `standardebooks.ts` adapter (OPDS)
- [ ] Implement `restcountries.ts` adapter
- [ ] Implement `tatoeba.ts` adapter (with author tracking)
- [ ] Implement `sefaria.ts` adapter (with license filtering)
- [ ] Implement `arxiv.ts` adapter

### Phase 3: Seeded Data

- [ ] Create seed scripts
- [ ] Pre-fetch folklore anthology
- [ ] Pre-fetch country profiles
- [ ] Pre-fetch common sentence pairs
- [ ] Pre-fetch museum highlights

### Phase 4: Registry Expansion

- [ ] Add all 57 tiles to registry
- [ ] Assign license types to each
- [ ] Create cover images for tiles
- [ ] Add i18n keys

---

_END OF EXPANSION PACK DOCUMENTATION_
