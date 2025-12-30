# SYNOPTIC LIBRARY - Complete Tile Registry

> **Philosophy**: ONE IDEA = ONE TILE
> Each tile is a concrete, inspiring project that a user can immediately visualize.
> We don't sell "databases" — we sell "Your bilingual Bible study workbook" or "Instagram-ready slang cards."

---

## SECTION A: SACRED & WISDOM TEXTS

These tiles target religious scholars, community translators, heritage preservation initiatives, and spiritual seekers. This is historically the LARGEST translation market.

---

### TILE A1: `bible-study-kdp`

**Marketing Title**: "Create Your Bible Study Workbook"
**Subtitle**: "Publish a professional KDP-ready bilingual Bible with annotations"

**Source**: `bible-api.com` (Free, No Auth, Public Domain)
**API Endpoint**: `https://bible-api.com/{book}+{chapter}`
**Available Versions**: WEB (World English Bible), KJV (King James Version)

**Wizard Flow**:

1. Step 1: Select Testament (Old/New)
2. Step 2: Select Book (Genesis, Exodus... / Matthew, Mark...)
3. Step 3: Select Chapter Range (e.g., "Chapters 1-5" or "Full Book")
4. Step 4: Select Version (WEB recommended for modern language)
5. Step 5: Choose Layout (side-by-side, interlinear, verse-by-verse)

**Layout**: `book` (Full KDP-ready format)
**Target Audience**: Bible study groups, Sunday school teachers, self-publishers
**Difficulty**: Intermediate (alignment requires care)

**API Response Example**:

```json
{
  "reference": "John 3:16",
  "verses": [{ "verse": 16, "text": "For God so loved the world..." }],
  "translation_name": "World English Bible"
}
```

**Normalized Output**:

```typescript
{
  type: 'text',
  L1: "For God so loved the world, that he gave his only begotten Son...",
  L2: "", // User translates
  meta: { verse: 16, reference: "John 3:16", book: "John", chapter: 3 }
}
```

**Cover Image Concept**: Open Bible with soft golden light, vintage paper texture
**Tile Color**: `bg-amber-50 text-amber-900` (warm, reverent)
**Size**: `lg` (hero tile, high conversion)
**Icon**: `Book` (Lucide)

**Auto-Enabled Utilities**: Dictionary, Thesaurus (theological vocabulary assistance)

---

### TILE A2: `bible-parallel`

**Marketing Title**: "Compare Bible Versions Side-by-Side"
**Subtitle**: "KJV vs WEB: See the language evolution"

**Source**: `bible-api.com` (dual fetch)
**Wizard Flow**:

1. Select passage
2. Choose 2 versions to compare
3. Layout automatically uses 3-column (KJV | WEB | Your Translation)

**Layout**: `book` with 3-column variant
**Unique Value**: Users can see how language evolved and create their own modern interpretation
**Difficulty**: Expert

**Tile Color**: `bg-amber-100 text-amber-800`
**Size**: `md`

---

### TILE A3: `quran-audio-surah`

**Marketing Title**: "Quran with Recitation Audio"
**Subtitle**: "Import Surahs with embedded audio for pronunciation practice"

**Source**: `alquran.cloud` (Free, No Auth)
**API Endpoint**: `http://api.alquran.cloud/v1/surah/{surahNumber}/ar.alafasy`
**Features**: Returns Arabic text + Recitation MP3 URL per ayah

**Wizard Flow**:

1. Step 1: Browse Surahs (114 total, grouped by Juz)
2. Step 2: Preview first few ayahs
3. Step 3: Select audio reciter (Al-Afasy default, others available)
4. Step 4: Choose learning mode (Arabic only, Arabic + Transliteration, Arabic + English)

**Layout**: `book` with Audio Player integration
**Technical Note**: Each line gets `meta.audioUrl` which triggers Audio Player in editor

**API Response Example**:

```json
{
  "data": {
    "name": "الفاتحة",
    "englishName": "Al-Fatiha",
    "ayahs": [
      {
        "number": 1,
        "text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        "audio": "https://cdn.alquran.cloud/media/audio/ayah/ar.alafasy/1"
      }
    ]
  }
}
```

**Normalized Output**:

```typescript
{
  type: 'text',
  L1: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  L2: "", // User adds translation
  meta: {
    ayah: 1,
    surah: "Al-Fatiha",
    audioUrl: "https://cdn.alquran.cloud/media/audio/ayah/ar.alafasy/1"
  }
}
```

**Cover Image Concept**: Elegant Arabic calligraphy on deep emerald background
**Tile Color**: `bg-emerald-50 text-emerald-900` (Islamic green)
**Size**: `lg` (major audience)
**Icon**: `Mic` (Lucide - indicates audio)

**Auto-Enabled Utilities**: Dictionary (Arabic roots), Transliteration helper

---

### TILE A4: `quran-simple-study`

**Marketing Title**: "Quran Study Cards"
**Subtitle**: "Learn one ayah per day with meaning and context"

**Source**: `fawazahmed0/quran-api` (GitHub, Free, No Auth)
**API Endpoint**: `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranindopak.json`
**Features**: Simpler JSON, multiple translations bundled

**Layout**: `flashcard` (daily practice format)
**Difficulty**: Beginner
**Size**: `sm`

---

### TILE A5: `gita-wisdom-posters`

**Marketing Title**: "Gita Wisdom Poster Collection"
**Subtitle**: "Beautiful Sanskrit slokas for wall art and meditation"

**Source**: `gita-api.vercel.app` (Free, No Auth)
**API Endpoint**: `https://gita-api.vercel.app/slok/{chapter}/{verse}`
**Features**: Returns Sanskrit text, transliteration, Hindi/English translations

**Wizard Flow**:

1. Step 1: Browse by Chapter (1-18) with chapter themes
2. Step 2: Select famous verses or browse sequentially
3. Step 3: Choose poster format (Square/Portrait/Landscape)
4. Step 4: Select typography style (Traditional Sanskrit, Modern Minimal)

**Layout**: `poster` (single-page visual export ready)

**API Response Example**:

```json
{
  "slok": "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः",
  "transliteration": "dharma-kṣetre kuru-kṣetre samavetā yuyutsavaḥ",
  "tej": { "ht": "Hindi translation...", "et": "English translation..." }
}
```

**Normalized Output**:

```typescript
{
  type: 'text',
  L1: "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः",
  L2: "", // User adds their interpretation
  meta: {
    transliteration: "dharma-kṣetre kuru-kṣetre...",
    chapter: 1, verse: 1,
    theme: "The Setting of the Battle"
  }
}
```

**Cover Image Concept**: Golden Sanskrit calligraphy on saffron/maroon gradient
**Tile Color**: `bg-orange-50 text-orange-900` (Hindu saffron)
**Size**: `md`
**Icon**: `Scroll` (Lucide)

**Auto-Enabled Utilities**: Sanskrit dictionary, Devanagari keyboard

---

### TILE A6: `gita-full-book`

**Marketing Title**: "The Complete Bhagavad Gita"
**Subtitle**: "All 700 verses with your personal translation"

**Source**: `bhagavadgita.com/api` (Free tier available)
**Layout**: `book` (full 18-chapter structure)
**Difficulty**: Expert
**Size**: `md`

**Special Feature**: Auto-generates Table of Contents with chapter themes

---

### TILE A7: `thirukkural-tamil-ethics`

**Marketing Title**: "Thirukkural: Tamil Wisdom"
**Subtitle**: "Translate the 1,330 couplets of ethical wisdom"

**Source**: `api-thirukkural.web.app` (Free, No Auth)
**API Endpoint**: `https://api-thirukkural.web.app/api/kural/{number}` or `/chapter/{chapterNumber}`
**Features**: Returns Tamil text, English translation, explanation

**Wizard Flow**:

1. Step 1: Browse by Section (Virtue/Wealth/Love)
2. Step 2: Select Chapter (133 chapters, 10 couplets each)
3. Step 3: Choose display format (Tamil only, Tamil + transliteration, Tamil + English)

**Layout**: `book` or `flashcard`
**Target Audience**: Tamil diaspora, Classical literature enthusiasts

**API Response Example**:

```json
{
  "number": 1,
  "sect": "அறத்துப்பால்",
  "chap": "கடவுள் வாழ்த்து",
  "kural": "அகர முதல எழுத்தெல்லாம் ஆதி பகவன் முதற்றே உலகு",
  "translation": "As the letter A is the first of all letters..."
}
```

**Cover Image Concept**: Ancient Tamil palm leaf manuscript aesthetic
**Tile Color**: `bg-red-50 text-red-900` (Tamil heritage red)
**Size**: `sm`
**Icon**: `Scroll`

---

### TILE A8: `indian-daily-wisdom`

**Marketing Title**: "Daily Wisdom from India"
**Subtitle**: "Inspiring quotes for your social media"

**Source**: `indian-quotes-api.vercel.app` (Free, No Auth)
**API Endpoint**: `https://indian-quotes-api.vercel.app/quotes/random`
**Features**: Random quotes from Indian philosophers, leaders, poets

**Wizard Flow**: "Surprise Me" button - one click to start

**Layout**: `social` (Instagram square format)
**Difficulty**: Beginner
**Size**: `sm`

**Cover Image Concept**: Minimalist Indian patterns with modern typography
**Tile Color**: `bg-yellow-50 text-yellow-900`

---

## SECTION A SUMMARY

| Tile ID             | Source            | Auth      | Layout    | Size |
| ------------------- | ----------------- | --------- | --------- | ---- |
| bible-study-kdp     | bible-api.com     | None      | book      | lg   |
| bible-parallel      | bible-api.com     | None      | book      | md   |
| quran-audio-surah   | alquran.cloud     | None      | book      | lg   |
| quran-simple-study  | fawazahmed0       | None      | flashcard | sm   |
| gita-wisdom-posters | gita-api.vercel   | None      | poster    | md   |
| gita-full-book      | bhagavadgita.com  | Free tier | book      | md   |
| thirukkural-tamil   | api-thirukkural   | None      | book      | sm   |
| indian-daily-wisdom | indian-quotes-api | None      | social    | sm   |

**Total Section A Tiles**: 8 tiles covering 5 major sacred text traditions

---

## SECTION B: CLASSIC LITERATURE

This is the **core engine** of the Library. Literature students, indie publishers, book clubs, and language learners all need access to public domain texts. Gutendex (Project Gutenberg's API) provides 70,000+ free books.

---

### TILE B1: `classic-novel-import`

**Marketing Title**: "Translate a Literary Masterpiece"
**Subtitle**: "Import Frankenstein, Pride & Prejudice, or The Little Prince instantly"

**Source**: `gutendex.com` (Free, No Auth, Public Domain)
**API Endpoints**:

- Search: `https://gutendex.com/books?search={query}&languages=en,fr,de,es`
- Details: `https://gutendex.com/books/{id}`
- Text: Fetch from `formats['text/plain; charset=utf-8']` URL

**Wizard Flow**:

1. Step 1: Search by title, author, or subject
2. Step 2: Browse results with cover thumbnails (from OpenLibrary)
3. Step 3: Preview first chapter
4. Step 4: Select import range (Full book / First 10 chapters / Custom range)
5. Step 5: Choose paragraph grouping (one paragraph = one block, or chapter = one page)

**Layout**: `book` (Full KDP-ready format)
**Target Audience**: Translation students, indie publishers, book clubs
**Difficulty**: Expert (novels are long!)

**API Response Example**:

```json
{
  "id": 84,
  "title": "Frankenstein; Or, The Modern Prometheus",
  "authors": [{ "name": "Shelley, Mary Wollstonecraft", "birth_year": 1797 }],
  "subjects": ["Gothic fiction", "Horror tales", "Monsters -- Fiction"],
  "bookshelves": ["Gothic Fiction", "Science Fiction"],
  "languages": ["en"],
  "copyright": false,
  "media_type": "Text",
  "formats": {
    "text/plain; charset=utf-8": "https://www.gutenberg.org/files/84/84-0.txt",
    "image/jpeg": "https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg"
  },
  "download_count": 78945
}
```

**Text Processing Logic**:

```typescript
// Fetch the raw text, then parse chapters
const rawText = await fetch(book.formats['text/plain; charset=utf-8']).text();
const chapters = rawText.split(/CHAPTER [IVXLC]+/i);
const lines = chapters.map((chapter, idx) => ({
  type: 'heading',
  L1: `Chapter ${idx + 1}`,
  L2: '',
  meta: { chapterIndex: idx },
}));
```

**Cover Image Concept**: Stack of vintage leather-bound books with warm lighting
**Tile Color**: `bg-slate-50 text-slate-900` (classic, sophisticated)
**Size**: `lg` (hero tile)
**Icon**: `BookOpen` (Lucide)

**Auto-Enabled Utilities**: Dictionary, Thesaurus, Grammar Check (for long-form work)

---

### TILE B2: `novel-by-author`

**Marketing Title**: "Complete Works of Shakespeare"
**Subtitle**: "Import all plays and sonnets from a single author"

**Source**: `gutendex.com`
**API Endpoint**: `https://gutendex.com/books?search=Shakespeare&author_year_start=1564&author_year_end=1616`

**Wizard Flow**:

1. Step 1: Select famous author from curated list (Shakespeare, Dickens, Austen, Tolstoy, Hugo...)
2. Step 2: Browse their complete works
3. Step 3: Select multiple titles or "Complete Works"

**Layout**: `book` (multi-volume project)
**Size**: `md`

**Special Feature**: Creates a "Collection" with multiple sub-projects linked together

---

### TILE B3: `daily-poem-challenge`

**Marketing Title**: "The Daily Sonnet"
**Subtitle**: "Short-form translation exercises from Shakespeare, Dickinson, and Poe"

**Source**: `poetrydb.org` (Free, No Auth)
**API Endpoints**:

- Random: `https://poetrydb.org/random`
- By Author: `https://poetrydb.org/author/{author}`
- By Title: `https://poetrydb.org/title/{title}`
- Search: `https://poetrydb.org/title,author/{title};{author}`

**Wizard Flow**:

1. Step 1: Choose mode: "Surprise Me" / "By Author" / "By Theme"
2. Step 2: If author: Select from list (Shakespeare, Emily Dickinson, Edgar Allan Poe, William Blake...)
3. Step 3: Preview poem (full text shown)
4. Step 4: Confirm and start translating

**Layout**: `workbook` (uses Quiz blocks for fill-in-the-blank exercises)
**Target Audience**: Poetry lovers, language learners seeking bite-sized practice
**Difficulty**: Beginner (poems are short!)

**API Response Example**:

```json
[
  {
    "title": "Sonnet 18: Shall I compare thee to a summer's day?",
    "author": "William Shakespeare",
    "lines": [
      "Shall I compare thee to a summer's day?",
      "Thou art more lovely and more temperate:",
      "Rough winds do shake the darling buds of May,"
    ],
    "linecount": "14"
  }
]
```

**Normalized Output**:

```typescript
// Each line becomes a separate text block for line-by-line translation
poem.lines.map((line, idx) => ({
  type: 'text',
  L1: line,
  L2: '', // User translates
  meta: { lineNumber: idx + 1, poem: poem.title, author: poem.author },
}));
```

**Cover Image Concept**: Feather quill on parchment with ink splatters
**Tile Color**: `bg-rose-50 text-rose-900` (romantic, poetic)
**Size**: `md`
**Icon**: `Feather` (Lucide)

**Gamification**: "Complete 7 poems this week to earn the Poet badge!"

---

### TILE B4: `poet-anthology`

**Marketing Title**: "Build Your Poetry Anthology"
**Subtitle**: "Curate poems from multiple authors into your bilingual collection"

**Source**: `poetrydb.org`
**Wizard Flow**:

1. Step 1: Multi-select poems from different authors
2. Step 2: Arrange order
3. Step 3: Add anthology title and introduction

**Layout**: `book` (anthology format with section dividers)
**Size**: `sm`

---

### TILE B5: `haiku-instagram`

**Marketing Title**: "Haiku for Instagram"
**Subtitle**: "Japanese wisdom in square format"

**Source**: `poetrydb.org` (search for haiku-style poems)
**API Endpoint**: `https://poetrydb.org/linecount/3` (3-line poems approximate haiku)

**Layout**: `social` (Instagram square, 1080x1080 export)
**Difficulty**: Beginner
**Size**: `sm`

**Export Feature**: One-click "Export as Instagram Story" with gradient background

---

### TILE B6: `openlibrary-covers`

**Marketing Title**: "Beautiful Book Cover Collection"
**Subtitle**: "Browse covers for inspiration before importing"

**Source**: `openlibrary.org` (Free, No Auth)
**API Endpoints**:

- Cover: `https://covers.openlibrary.org/b/id/{cover_id}-L.jpg`
- Search: `https://openlibrary.org/search.json?title={query}`
- Book: `https://openlibrary.org/works/{work_id}.json`

**Purpose**: This tile is a SUPPORT tile. When users import from Gutendex, we fetch covers from OpenLibrary to make the Library grid beautiful.

**API Response Example**:

```json
{
  "key": "/works/OL45804W",
  "title": "Frankenstein",
  "authors": [{ "key": "/authors/OL24529A" }],
  "cover_i": 8769202,
  "first_publish_year": 1818
}
```

**Cover URL Generation**:

```typescript
const coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
```

**Tile Color**: `bg-indigo-50 text-indigo-900`
**Size**: `sm`

---

### TILE B7: `childrens-classic`

**Marketing Title**: "Translate a Children's Classic"
**Subtitle**: "The Little Prince, Alice in Wonderland, Peter Pan..."

**Source**: `gutendex.com` (filtered by bookshelf: "Children's Literature")
**API Endpoint**: `https://gutendex.com/books?topic=children`

**Layout**: `picture-book` (larger text, illustration placeholders)
**Target Audience**: Parents, teachers, children's book publishers
**Difficulty**: Beginner (simpler language)

**Cover Image Concept**: Whimsical illustration style, pastel colors
**Tile Color**: `bg-sky-50 text-sky-900`
**Size**: `md`

**Special Feature**: Auto-generates "Illustration placeholder" blocks where images likely appear

---

### TILE B8: `philosophy-classics`

**Marketing Title**: "Great Philosophical Texts"
**Subtitle**: "Plato, Aristotle, Marcus Aurelius, Nietzsche..."

**Source**: `gutendex.com` (filtered by subject: "Philosophy")
**API Endpoint**: `https://gutendex.com/books?topic=philosophy`

**Layout**: `book` (academic formatting)
**Target Audience**: Philosophy students, academic translators
**Difficulty**: Expert

**Tile Color**: `bg-stone-50 text-stone-900`
**Size**: `sm`

---

## SECTION B SUMMARY

| Tile ID              | Source          | Auth | Layout       | Size |
| -------------------- | --------------- | ---- | ------------ | ---- |
| classic-novel-import | gutendex.com    | None | book         | lg   |
| novel-by-author      | gutendex.com    | None | book         | md   |
| daily-poem-challenge | poetrydb.org    | None | workbook     | md   |
| poet-anthology       | poetrydb.org    | None | book         | sm   |
| haiku-instagram      | poetrydb.org    | None | social       | sm   |
| openlibrary-covers   | openlibrary.org | None | support      | sm   |
| childrens-classic    | gutendex.com    | None | picture-book | md   |
| philosophy-classics  | gutendex.com    | None | book         | sm   |

**Total Section B Tiles**: 8 tiles covering novels, poetry, children's books, and philosophy

---

_Next Section: SECTION C - Visual & Art (Met Museum, Art Institute Chicago, Colors)_

---

## SECTION C: VISUAL & ART

These tiles target art historians, creative writers, museum enthusiasts, and anyone creating "coffee table books" or visual projects. The concept of **Ekphrasis** (writing about art) is central here.

---

### TILE C1: `met-museum-ekphrasis`

**Marketing Title**: "The Met Collection: Write About Art"
**Subtitle**: "Public domain masterpieces with space for your bilingual descriptions"

**Source**: `metmuseum.github.io` (Free, No Auth, 500k+ objects)
**API Endpoints**:

- Search: `https://collectionapi.metmuseum.org/public/collection/v1/search?q={query}&hasImages=true&isPublicDomain=true`
- Object: `https://collectionapi.metmuseum.org/public/collection/v1/objects/{objectID}`
- Departments: `https://collectionapi.metmuseum.org/public/collection/v1/departments`

**Wizard Flow**:

1. Step 1: Browse by Department (Paintings, Sculptures, Asian Art, Egyptian, Photographs...)
2. Step 2: Search within department or browse "Highlights"
3. Step 3: View artwork in detail modal (high-res image, artist, date, medium)
4. Step 4: Choose project format: "Single Artwork" / "Curated Collection (5-10 pieces)"
5. Step 5: Select layout: Split-Panel (image left, text right) / Catalog (image top, text below)

**Layout**: `split-panel` (Image takes 50%, text takes 50%)
**Target Audience**: Art history students, museum docents, creative writers, bilingual art book publishers
**Difficulty**: Intermediate (requires descriptive writing skills)

**API Response Example**:

```json
{
  "objectID": 436535,
  "title": "Wheat Field with Cypresses",
  "artistDisplayName": "Vincent van Gogh",
  "artistNationality": "Dutch",
  "objectDate": "1889",
  "medium": "Oil on canvas",
  "dimensions": "28 3/4 x 36 3/4 in. (73 x 93.4 cm)",
  "department": "European Paintings",
  "primaryImage": "https://images.metmuseum.org/CRDImages/ep/original/DT1567.jpg",
  "primaryImageSmall": "https://images.metmuseum.org/CRDImages/ep/web-large/DT1567.jpg",
  "isPublicDomain": true,
  "GalleryNumber": "825"
}
```

**Normalized Output**:

```typescript
[
  {
    type: 'image',
    L1: artwork.primaryImage, // Used as content
    L2: '',
    meta: {
      caption: artwork.title,
      artist: artwork.artistDisplayName,
      objectID: artwork.objectID,
    },
  },
  {
    type: 'heading',
    L1: artwork.title,
    L2: '', // User translates title
    meta: {},
  },
  {
    type: 'text',
    L1: `${artwork.artistDisplayName} (${artwork.artistNationality})\n${artwork.objectDate}\n${artwork.medium}`,
    L2: '', // User writes description
    meta: {},
  },
];
```

**Cover Image Concept**: Famous painting (Wheat Field with Cypresses or similar) with elegant frame overlay
**Tile Color**: `bg-purple-50 text-purple-900` (museum aesthetic)
**Size**: `lg` (hero tile for visual projects)
**Icon**: `Palette` (Lucide)

**Auto-Enabled Utilities**: Art vocabulary dictionary (Getty Vocab integration)

---

### TILE C2: `met-landscapes`

**Marketing Title**: "Landscape Masterpieces"
**Subtitle**: "Create wall-art posters with famous landscapes"

**Source**: `metmuseum.github.io`
**API Endpoint**: `https://collectionapi.metmuseum.org/public/collection/v1/search?q=landscape&hasImages=true&isPublicDomain=true`

**Layout**: `poster` (single large image with minimal text)
**Size**: `md`

**Special Feature**: Export at print-ready 300 DPI for wall art

---

### TILE C3: `met-portraits`

**Marketing Title**: "Portrait Gallery"
**Subtitle**: "Faces through history: Describe the subjects"

**Source**: `metmuseum.github.io`
**API Endpoint**: `https://collectionapi.metmuseum.org/public/collection/v1/search?q=portrait&hasImages=true&isPublicDomain=true`

**Layout**: `book` (portrait series with biographical descriptions)
**Target Audience**: History buffs, biography writers
**Size**: `sm`

---

### TILE C4: `artic-highlights`

**Marketing Title**: "Art Institute of Chicago: Modern Masters"
**Subtitle**: "Seurat, Hopper, O'Keeffe – American art for your bilingual catalog"

**Source**: `api.artic.edu` (Free, No Auth)
**API Endpoints**:

- Search: `https://api.artic.edu/api/v1/artworks/search?q={query}&fields=id,title,artist_title,date_display,thumbnail,image_id`
- Artwork: `https://api.artic.edu/api/v1/artworks/{id}`
- Image: `https://www.artic.edu/iiif/2/{image_id}/full/843,/0/default.jpg`

**Wizard Flow**:

1. Step 1: Search or browse by style (Impressionism, Modernism, Contemporary)
2. Step 2: Select artworks
3. Step 3: Choose project type: Exhibition Catalog / Study Notes / Poster Series

**Layout**: `book` (catalog format with full-bleed images)
**Target Audience**: Art students, gallery owners, designers
**Difficulty**: Intermediate

**API Response Example**:

```json
{
  "data": {
    "id": 27992,
    "title": "A Sunday on La Grande Jatte — 1884",
    "artist_title": "Georges Seurat",
    "date_display": "1884–86",
    "image_id": "2d484387-2509-5e8e-2c43-22f9981972eb",
    "thumbnail": {
      "alt_text": "Painting of people relaxing in a park..."
    }
  }
}
```

**Image URL Construction**:

```typescript
const imageUrl = `https://www.artic.edu/iiif/2/${artwork.image_id}/full/843,/0/default.jpg`;
```

**Tile Color**: `bg-zinc-50 text-zinc-900`
**Size**: `md`
**Icon**: `Frame` (Lucide)

---

### TILE C5: `color-thesaurus`

**Marketing Title**: "The Dictionary of Color"
**Subtitle**: "Translate abstract color names and their emotions"

**Source**: `colourlovers.com/api` + `thecolorapi.com` (Both Free, No Auth)
**API Endpoints**:

- ColourLovers Palettes: `http://www.colourlovers.com/api/palettes/top?format=json&numResults=5`
- ColourLovers Colors: `http://www.colourlovers.com/api/colors/top?format=json&numResults=10`
- TheColorAPI: `https://www.thecolorapi.com/id?hex={hex}`

**Wizard Flow**:

1. Step 1: Choose mode: "Random Palette" / "Search by Mood" / "Color Family"
2. Step 2: Preview colors with their names
3. Step 3: Select how many colors to include
4. Step 4: Choose format: Vocabulary Cards / Mood Board / Color Poem

**Layout**: `flashcard` (each color becomes a card with its name and description)
**Target Audience**: Designers learning color vocabulary, language learners, poets
**Difficulty**: Beginner

**API Response Example (ColourLovers)**:

```json
{
  "id": 113451,
  "title": "Giant Goldfish",
  "userName": "manekineko",
  "numViews": 154432,
  "numVotes": 1211,
  "colors": ["69D2E7", "A7DBD8", "E0E4CC", "F38630", "FA6900"],
  "description": "A palette inspired by the ocean..."
}
```

**API Response Example (TheColorAPI)**:

```json
{
  "hex": { "value": "#69D2E7" },
  "name": { "value": "Sky Blue", "closest_named_hex": "#87CEEB" },
  "hsl": { "h": 190, "s": 67, "l": 66 }
}
```

**Normalized Output**:

```typescript
palette.colors.map((hex) => ({
  type: 'callout',
  calloutType: 'custom',
  L1: `#${hex}\n${colorNames[hex] || 'Describe this color...'}`,
  L2: '', // User translates/describes
  meta: {
    hex: `#${hex}`,
    backgroundColor: `#${hex}`, // Used for callout styling
  },
}));
```

**Cover Image Concept**: Rainbow gradient with elegant typography
**Tile Color**: `bg-pink-50 text-pink-900`
**Size**: `md`
**Icon**: `Droplet` (Lucide)

**Creative Feature**: "Generate Color Poem" – AI suggests poetic descriptions for each color

---

### TILE C6: `getty-art-vocabulary`

**Marketing Title**: "Art Vocabulary Builder"
**Subtitle**: "Learn the language of art criticism"

**Source**: `vocab.getty.edu` (Getty Vocabulary Program, Free)
**API Endpoint**: `http://vocab.getty.edu/sparql` (SPARQL endpoint)
**Features**: Art & Architecture Thesaurus (AAT), Getty Thesaurus of Geographic Names (TGN)

**Wizard Flow**:

1. Step 1: Choose vocabulary domain (Materials, Styles, Periods, Techniques)
2. Step 2: Browse terms with definitions
3. Step 3: Create vocabulary study cards

**Layout**: `workbook` (vocabulary quiz format)
**Target Audience**: Art history students, museum professionals
**Difficulty**: Expert (specialized vocabulary)

**Tile Color**: `bg-amber-50 text-amber-900`
**Size**: `sm`

**Note**: This is a SPARQL API requiring specialized querying. Implementation priority is lower.

---

### TILE C7: `photo-descriptions`

**Marketing Title**: "Photography Caption Practice"
**Subtitle**: "Write bilingual descriptions for stunning photographs"

**Source**: `metmuseum.github.io` (Photography department) or integration with public domain photo sources
**API Endpoint**: `https://collectionapi.metmuseum.org/public/collection/v1/search?departmentId=19&hasImages=true&isPublicDomain=true`

**Layout**: `social` (Instagram-ready square captions)
**Size**: `sm`

---

### TILE C8: `museum-virtual-tour`

**Marketing Title**: "Virtual Museum Tour"
**Subtitle**: "Create a guided tour script in two languages"

**Source**: `metmuseum.github.io` or `api.artic.edu`
**Wizard Flow**:

1. Select 5-10 artworks
2. Arrange in "tour order"
3. Add transition text between artworks

**Layout**: `book` (tour guide format with navigation)
**Target Audience**: Museum docents, tour guides, educators
**Difficulty**: Intermediate
**Size**: `md`

---

## SECTION C SUMMARY

| Tile ID              | Source                     | Auth | Layout      | Size |
| -------------------- | -------------------------- | ---- | ----------- | ---- |
| met-museum-ekphrasis | metmuseum.github.io        | None | split-panel | lg   |
| met-landscapes       | metmuseum.github.io        | None | poster      | md   |
| met-portraits        | metmuseum.github.io        | None | book        | sm   |
| artic-highlights     | api.artic.edu              | None | book        | md   |
| color-thesaurus      | colourlovers + thecolorapi | None | flashcard   | md   |
| getty-art-vocabulary | vocab.getty.edu            | None | workbook    | sm   |
| photo-descriptions   | metmuseum.github.io        | None | social      | sm   |
| museum-virtual-tour  | metmuseum/artic            | None | book        | md   |

**Total Section C Tiles**: 8 tiles covering museum art, color vocabulary, and visual projects

---

_Next Section: SECTION D - News & History (Chronicling America, Political Speeches, Factbook)_

---

## SECTION D: NEWS & HISTORY

These tiles target history enthusiasts, political science students, journalists, and anyone interested in translating historical documents or current events.

---

### TILE D1: `history-headlines`

**Marketing Title**: "On This Day in History"
**Subtitle**: "Translate newspaper headlines from 100 years ago"

**Source**: `chroniclingamerica.loc.gov` (Library of Congress, Free, No Auth)
**API Endpoints**:

- Search: `https://chroniclingamerica.loc.gov/search/pages/results/?dateFilterType=yearRange&date1={year}&date2={year}&format=json`
- Page: `https://chroniclingamerica.loc.gov/lccn/{lccn}/{date}/ed-{edition}/seq-{sequence}.json`
- OCR Text: `https://chroniclingamerica.loc.gov/lccn/{lccn}/{date}/ed-{edition}/seq-{sequence}/ocr.txt`

**Wizard Flow**:

1. Step 1: Select date (defaults to "100 years ago today")
2. Step 2: Browse available newspapers from that date
3. Step 3: Preview front page image + OCR text
4. Step 4: Select headlines or full articles to import
5. Step 5: Choose format: Headline Collection / Full Front Page / Single Article

**Layout**: `newspaper` (multi-column layout mimicking print)
**Target Audience**: History teachers, journalism students, genealogy enthusiasts
**Difficulty**: Intermediate (OCR text may have errors)

**API Response Example**:

```json
{
  "items": [
    {
      "date": "19241230",
      "title": "The New York Times",
      "url": "https://chroniclingamerica.loc.gov/lccn/sn83030214/1924-12-30/ed-1/seq-1.json",
      "ocr_eng": "https://chroniclingamerica.loc.gov/lccn/sn83030214/1924-12-30/ed-1/seq-1/ocr.txt"
    }
  ]
}
```

**Technical Note**: OCR quality varies. Consider adding "Clean up OCR" AI utility.

**Cover Image Concept**: Vintage newspaper with sepia tones, typewriter font
**Tile Color**: `bg-stone-100 text-stone-900` (newsprint aesthetic)
**Size**: `lg` (unique, high-interest tile)
**Icon**: `Newspaper` (Lucide)

**Fun Feature**: "Birthday Edition" – Import the front page from the user's birth date

---

### TILE D2: `political-speeches-german`

**Marketing Title**: "Great Political Speeches"
**Subtitle**: "Analyze rhetoric from historic German orations"

**Source**: `politische-reden.eu` (Static dataset, Free)
**Data Type**: Static HTML/PDF collection – requires pre-processing into JSON seed file
**Available Content**: German political speeches from 19th-21st century

**Wizard Flow**:

1. Step 1: Browse by era (Weimar Republic, Post-WWII, Reunification, Modern)
2. Step 2: Select speaker (Bismarck, Adenauer, Brandt, Merkel...)
3. Step 3: Preview speech excerpt
4. Step 4: Import full speech or selected paragraphs

**Layout**: `book` (full speech with paragraph annotations)
**Target Audience**: Political science students, German language learners, rhetoric analysts
**Difficulty**: Expert (political/historical vocabulary)

**Implementation Note**: Pre-scrape 50-100 famous speeches into `src/data/seeds/political-speeches-de.json`

**Normalized Seed Format**:

```typescript
{
  id: 'brandt-1970-warsaw',
  speaker: 'Willy Brandt',
  title: 'Kniefall von Warschau',
  date: '1970-12-07',
  context: 'Visit to Warsaw Ghetto Memorial',
  paragraphs: [
    'Im Angesicht der Opfer des Warschauer Ghettos...',
    // ...
  ]
}
```

**Tile Color**: `bg-blue-50 text-blue-900` (governmental)
**Size**: `md`
**Icon**: `Mic2` (Lucide)

---

### TILE D3: `saudi-news-arabic`

**Marketing Title**: "Middle East News Practice"
**Subtitle**: "Authentic Arabic news articles for advanced learners"

**Source**: `SaudiNewsNet` (GitHub: inparallel/SaudiNewsNet, Static dataset)
**Data Type**: JSON dataset with 31,000+ Arabic news articles
**Categories**: Sports, Culture, Economics, Politics, Technology

**Wizard Flow**:

1. Step 1: Select category
2. Step 2: Browse headlines
3. Step 3: Preview article
4. Step 4: Import with vocabulary highlights

**Layout**: `newspaper` (RTL layout)
**Target Audience**: Arabic learners, journalism students, Middle East studies
**Difficulty**: Expert (news Arabic is formal)

**Implementation Note**: Download dataset, filter 200 "best" articles into seed file

**Tile Color**: `bg-green-50 text-green-900`
**Size**: `md`
**Icon**: `Globe` (Lucide)

---

### TILE D4: `wiki-article-translator`

**Marketing Title**: "Wikipedia Article Translator"
**Subtitle**: "Help translate Wikipedia articles to your language"

**Source**: `mediawiki.org` API (Free, No Auth)
**API Endpoints**:

- Search: `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}&format=json`
- Content: `https://en.wikipedia.org/w/api.php?action=query&titles={title}&prop=extracts&explaintext=true&format=json`
- Random: `https://en.wikipedia.org/w/api.php?action=query&list=random&rnlimit=1&rnnamespace=0&format=json`

**Wizard Flow**:

1. Step 1: Search for article topic
2. Step 2: Preview article summary
3. Step 3: Select sections to import (Intro only / Full article / Custom sections)
4. Step 4: Choose paragraph chunking

**Layout**: `article` (long-form single column with section headers)
**Target Audience**: Wikipedia editors, language learners, researchers
**Difficulty**: Varies by topic

**API Response Example**:

```json
{
  "query": {
    "pages": {
      "12345": {
        "title": "Artificial intelligence",
        "extract": "Artificial intelligence (AI) is intelligence demonstrated by machines..."
      }
    }
  }
}
```

**Normalized Output**:

```typescript
const sections = article.extract.split('\n\n').map((para, idx) => ({
  type: idx === 0 ? 'heading' : 'text',
  L1: para,
  L2: '',
  meta: { source: 'Wikipedia', title: article.title },
}));
```

**Tile Color**: `bg-gray-100 text-gray-900` (Wikipedia neutral)
**Size**: `md`
**Icon**: `FileText` (Lucide)

**Special Feature**: Link to actual Wikipedia page for context

---

### TILE D5: `factbook-country-profiles`

**Marketing Title**: "Country Profiles"
**Subtitle**: "CIA World Factbook data for educational posters"

**Source**: `factbook.json` (GitHub: factbook/factbook.json, Static dataset)
**Data Type**: JSON files with country data (geography, demographics, economy, government)
**Countries**: 250+ countries and territories

**Wizard Flow**:

1. Step 1: Select country from world map or list
2. Step 2: Choose data sections (Geography / People / Economy / Government)
3. Step 3: Select poster format (Infographic / Fact Sheet / Study Card)

**Layout**: `poster` (infographic style with data visualization)
**Target Audience**: Geography teachers, students, travel writers
**Difficulty**: Beginner (factual data)

**Sample Data Structure**:

```json
{
  "country": "France",
  "geography": {
    "location": "Western Europe",
    "area": { "total": 643801, "unit": "sq km" },
    "climate": "generally cool winters and mild summers"
  },
  "people": {
    "population": 67848156,
    "languages": ["French 100%"]
  }
}
```

**Tile Color**: `bg-amber-50 text-amber-900` (geographic)
**Size**: `md`
**Icon**: `Map` (Lucide)

---

### TILE D6: `fun-facts-daily`

**Marketing Title**: "Did You Know?"
**Subtitle**: "Bite-sized facts for quick translation practice"

**Source**: `uselessfacts.jsph.pl` (Free, No Auth)
**API Endpoints**:

- Random: `https://uselessfacts.jsph.pl/api/v2/facts/random`
- Today: `https://uselessfacts.jsph.pl/api/v2/facts/today`

**Wizard Flow**: One-click "Surprise Me" – no configuration needed

**Layout**: `social` (Instagram square format)
**Target Audience**: Casual learners, social media content creators
**Difficulty**: Beginner

**API Response Example**:

```json
{
  "id": "abc123",
  "text": "A group of flamingos is called a 'flamboyance'.",
  "source": "https://en.wikipedia.org/wiki/Flamingo",
  "source_url": "https://en.wikipedia.org/wiki/Flamingo",
  "language": "en"
}
```

**Cover Image Concept**: Lightbulb with colorful explosion of ideas
**Tile Color**: `bg-blue-50 text-blue-900`
**Size**: `sm`
**Icon**: `Lightbulb` (Lucide)

**Export Feature**: One-click "Export as Instagram Post" with branded template

---

### TILE D7: `historic-documents`

**Marketing Title**: "Historic Documents Collection"
**Subtitle**: "Declaration of Independence, Magna Carta, UN Charter..."

**Source**: Custom curated JSON (Public domain documents)
**Implementation**: Pre-seed `src/data/seeds/historic-documents.json` with 20-30 famous documents

**Wizard Flow**:

1. Browse by era or type
2. Select document
3. Choose excerpt or full text

**Layout**: `book` (formal document style)
**Size**: `sm`

---

### TILE D8: `quote-collection`

**Marketing Title**: "Famous Quotes Collection"
**Subtitle**: "Philosophy, leadership, literature – curated wisdom"

**Sources**: Combination of:

- `indian-quotes-api.vercel.app`
- Static curated quotes JSON

**Layout**: `flashcard` (quote cards)
**Size**: `sm`

---

## SECTION D SUMMARY

| Tile ID                   | Source                     | Auth          | Layout    | Size |
| ------------------------- | -------------------------- | ------------- | --------- | ---- |
| history-headlines         | chroniclingamerica.loc.gov | None          | newspaper | lg   |
| political-speeches-german | politische-reden.eu        | None (static) | book      | md   |
| saudi-news-arabic         | SaudiNewsNet               | None (static) | newspaper | md   |
| wiki-article-translator   | mediawiki.org              | None          | article   | md   |
| factbook-country-profiles | factbook.json              | None (static) | poster    | md   |
| fun-facts-daily           | uselessfacts.jsph.pl       | None          | social    | sm   |
| historic-documents        | curated seed               | None (static) | book      | sm   |
| quote-collection          | indian-quotes + static     | None          | flashcard | sm   |

**Total Section D Tiles**: 8 tiles covering news, speeches, Wikipedia, and facts

---

_Next Section: SECTION E - Language & Slang (Urban Dictionary, Wiktionary, WordBank)_

---

## SECTION E: LANGUAGE & SLANG

These tiles target language learners, social media content creators, vocabulary enthusiasts, and anyone interested in the fun side of language.

---

### TILE E1: `urban-slang-flashcards`

**Marketing Title**: "Slang Flashcards for Instagram"
**Subtitle**: "Modern internet slang translated into your language"

**Source**: Kaggle Urban Dictionary Dataset (Static, requires pre-processing)
**Dataset URL**: `https://www.kaggle.com/datasets/therohk/urban-dictionary-words-dataset`
**Data Type**: CSV with 2.8M+ definitions – filter to top 1000 by upvotes

**Wizard Flow**:

1. Step 1: Browse by popularity or alphabetically
2. Step 2: Select 10-20 slang terms
3. Step 3: Choose format: Flashcard Stack / Instagram Carousel / Quiz

**Layout**: `social` (Instagram square, 1080x1080)
**Target Audience**: Language influencers, ESL teachers, Gen-Z translators
**Difficulty**: Beginner (short content)

**Implementation Note**: Pre-process into `src/data/seeds/urban-dictionary-top-1000.json`

**Seed Format**:

```typescript
{
  id: 'slay',
  word: 'slay',
  definition: 'To do something exceptionally well; to kill it.',
  example: 'She absolutely slayed that presentation!',
  upvotes: 45230,
  category: 'positive-slang'
}
```

**Normalized Output**:

```typescript
{
  type: 'quiz', // Interactive flashcard
  L1: slang.word,
  L2: '', // User adds translation
  meta: {
    definition: slang.definition,
    example: slang.example,
    difficulty: 'beginner'
  }
}
```

**Cover Image Concept**: Graffiti wall with speech bubbles
**Tile Color**: `bg-yellow-100 text-yellow-900` (vibrant, youthful)
**Size**: `md`
**Icon**: `MessageCircle` (Lucide)

**Export Feature**: "Generate Instagram Carousel" with branded slides

---

### TILE E2: `wiktionary-deep-dive`

**Marketing Title**: "Word Deep Dive"
**Subtitle**: "Etymology, pronunciations, and usage across languages"

**Source**: `en.wiktionary.org` API (Free, No Auth)
**API Endpoint**: `https://en.wiktionary.org/w/api.php?action=parse&page={word}&prop=wikitext&format=json`
**Alternative**: `dictionaryapi.dev` for simpler responses

**Wizard Flow**:

1. Step 1: Enter a word
2. Step 2: View full etymology and definitions
3. Step 3: Select which sections to include
4. Step 4: Choose format: Study Card / Vocabulary Page / Etymology Poster

**Layout**: `workbook` (study format with vocabulary exercises)
**Target Audience**: Serious language learners, etymology enthusiasts
**Difficulty**: Intermediate

**API Response (dictionaryapi.dev)**:

```json
[
  {
    "word": "serendipity",
    "phonetic": "/ˌsɛɹ.ənˈdɪp.ɪ.ti/",
    "meanings": [
      {
        "partOfSpeech": "noun",
        "definitions": [
          {
            "definition": "The occurrence of events by chance in a happy way.",
            "example": "Finding that book was pure serendipity."
          }
        ]
      }
    ]
  }
]
```

**Tile Color**: `bg-indigo-50 text-indigo-900`
**Size**: `md`
**Icon**: `Search` (Lucide)

---

### TILE E3: `dictionary-word-of-day`

**Marketing Title**: "Word of the Day Challenge"
**Subtitle**: "Expand your vocabulary one word at a time"

**Source**: `dictionaryapi.dev` (Free, No Auth)
**API Endpoint**: `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`

**Wizard Flow**: One-click "Get Today's Word" or search custom word

**Layout**: `social` (shareable word card)
**Size**: `sm`

**Gamification**: "Complete 30 days to earn Vocabulary Master badge"

---

### TILE E4: `wordbank-children`

**Marketing Title**: "My First Words"
**Subtitle**: "Create a bilingual children's picture book"

**Source**: `wordbank.stanford.edu` (Free, research dataset)
**Data Type**: Child language acquisition data – words children learn first
**Categories**: Animals, Food, Actions, People, Body Parts...

**Wizard Flow**:

1. Step 1: Select category (Animals, Food, Colors, Numbers...)
2. Step 2: Choose 20-30 words
3. Step 3: Select illustration style (placeholder or generate with AI)

**Layout**: `picture-book` (large images, big text, simple layout)
**Target Audience**: Parents, early childhood educators, children's authors
**Difficulty**: Beginner

**Implementation Note**: Extract top 200 words from dataset into seed file

**Tile Color**: `bg-cyan-50 text-cyan-900`
**Size**: `md`
**Icon**: `Baby` (Lucide)

**Special Feature**: Auto-generate pronunciation audio for each word

---

### TILE E5: `collins-advanced-vocab`

**Marketing Title**: "Advanced Vocabulary Builder"
**Subtitle**: "Collins Dictionary definitions for serious learners"

**Source**: `api.collinsdictionary.com` (Requires API Key – Premium Tier)
**Status**: ⚠️ Requires Authentication – Available in Pro tier only

**Layout**: `workbook`
**Size**: `sm`

**Note**: Fallback to dictionaryapi.dev for free tier users

---

### TILE E6: `synonyms-thesaurus`

**Marketing Title**: "The Synonym Game"
**Subtitle**: "Find the perfect word for every situation"

**Source**: `synonyms.com` API (May require key) + `dictionaryapi.dev` (Free)
**Fallback Strategy**: Use dictionaryapi.dev synonyms field

**Wizard Flow**:

1. Enter a word
2. View synonym web/tree
3. Create vocabulary expansion exercises

**Layout**: `flashcard` (synonym pairs)
**Size**: `sm`

---

### TILE E7: `language-tool-practice`

**Marketing Title**: "Grammar Error Hunt"
**Subtitle**: "Find and fix common grammar mistakes"

**Source**: `languagetool.org` (Free tier, rate limited)
**API Endpoint**: `https://api.languagetool.org/v2/check`
**Features**: Grammar checking, style suggestions, punctuation

**Purpose**: This is a UTILITY tile that creates grammar exercises

**Wizard Flow**:

1. Step 1: Paste text with intentional errors
2. Step 2: LanguageTool identifies issues
3. Step 3: Create "spot the error" quiz

**Layout**: `workbook` (interactive quiz format)
**Size**: `sm`
**Icon**: `CheckCircle` (Lucide)

---

### TILE E8: `omw-multilingual-wordnet`

**Marketing Title**: "Multilingual Word Explorer"
**Subtitle**: "See how concepts translate across 30+ languages"

**Source**: `compling.hss.ntu.edu.sg/omw` (Open Multilingual WordNet)
**Data Type**: Static dataset of aligned word senses across languages

**Wizard Flow**:

1. Enter English word
2. View translations in 30+ languages
3. Create comparative vocabulary cards

**Layout**: `flashcard` (multi-language comparison)
**Size**: `sm`

**Implementation Note**: Requires pre-processing static data

---

## SECTION E SUMMARY

| Tile ID                  | Source                  | Auth           | Layout       | Size |
| ------------------------ | ----------------------- | -------------- | ------------ | ---- |
| urban-slang-flashcards   | Kaggle Urban Dict       | None (static)  | social       | md   |
| wiktionary-deep-dive     | wiktionary.org          | None           | workbook     | md   |
| dictionary-word-of-day   | dictionaryapi.dev       | None           | social       | sm   |
| wordbank-children        | wordbank.stanford.edu   | None (static)  | picture-book | md   |
| collins-advanced-vocab   | collinsdictionary.com   | API Key        | workbook     | sm   |
| synonyms-thesaurus       | synonyms.com + fallback | Varies         | flashcard    | sm   |
| language-tool-practice   | languagetool.org        | None (limited) | workbook     | sm   |
| omw-multilingual-wordnet | OMW                     | None (static)  | flashcard    | sm   |

**Total Section E Tiles**: 8 tiles covering slang, dictionaries, and vocabulary building

---

_Next Section: SECTION F - Academic & AI Data (Corpora, Syntax Trees, NLP Datasets)_

---

## SECTION F: ACADEMIC & AI DATA

These tiles target computational linguists, AI researchers, NLP students, and anyone building parallel corpora for machine translation training.

---

### TILE F1: `corpus-builder-wmt`

**Marketing Title**: "Build an AI Translation Dataset"
**Subtitle**: "Align parallel texts for LLM fine-tuning"

**Source**: `statmt.org/wmt11` (WMT Translation Task, Static dataset)
**Data Type**: Parallel corpora (English-French, English-German, etc.)
**Download**: ZIP files with aligned sentence pairs

**Wizard Flow**:

1. Step 1: Select language pair (EN-FR, EN-DE, EN-ES, EN-CS, EN-RU)
2. Step 2: Choose domain (News, Europarl, CommonCrawl)
3. Step 3: Select sample size (100 / 1000 / 5000 sentences)
4. Step 4: Import as spreadsheet or card format

**Layout**: `spreadsheet` (tabular view, CSV export)
**Target Audience**: AI researchers, NLP students, translation memory builders
**Difficulty**: Expert

**Implementation Note**: Pre-download and seed subset of commonly used pairs

**Seed Format**:

```typescript
{
  id: 'wmt11-en-fr-001',
  source: 'After a decade of conflict...',
  target: 'Après une décennie de conflit...',
  domain: 'news',
  languagePair: 'en-fr'
}
```

**Tile Color**: `bg-gray-900 text-gray-100` (dark mode, technical)
**Size**: `md`
**Icon**: `Database` (Lucide)

---

### TILE F2: `wikicorp-wikipedia-sample`

**Marketing Title**: "Wikipedia Corpus Sample"
**Subtitle**: "Academic-quality text for linguistic analysis"

**Source**: `westburylab.wikicorp` (University of Alberta, Static download)
**Data Type**: Cleaned Wikipedia dump in text format
**Size**: Full corpus is 1.9GB – filter to representative samples

**Wizard Flow**:

1. Select topic domain (Science, History, Arts, Technology)
2. Choose sample size
3. Import for analysis or translation

**Layout**: `book` (long-form text)
**Size**: `sm`

**Implementation Note**: Pre-process 50 high-quality articles into seed file

---

### TILE F3: `ud-syntax-trees`

**Marketing Title**: "Syntax Tree Explorer"
**Subtitle**: "Visualize grammatical structure across 100+ languages"

**Source**: `universaldependencies.org` (Free, Academic)
**Data Type**: CoNLL-U format with dependency annotations
**Languages**: 100+ languages with consistent annotation scheme

**Wizard Flow**:

1. Select language
2. Browse example sentences with tree visualizations
3. Import sentences with syntactic annotations
4. Create "syntax study" cards

**Layout**: `academic` (visualizations + text)
**Target Audience**: Linguistics students, NLP researchers
**Difficulty**: Expert

**Tile Color**: `bg-violet-50 text-violet-900`
**Size**: `md`
**Icon**: `GitBranch` (Lucide)

**Special Feature**: Render dependency tree SVG in editor

---

### TILE F4: `keyphrase-extraction`

**Marketing Title**: "Key Phrase Study"
**Subtitle**: "Analyze document structure and important concepts"

**Source**: `snkim/AutomaticKeyphraseExtraction` (GitHub, Static dataset)
**Data Type**: Scientific abstracts with annotated keyphrases

**Wizard Flow**:

1. Browse by domain (Computer Science, Medicine, Economics)
2. Select document
3. Import with highlighted keyphrases

**Layout**: `workbook` (annotation exercises)
**Size**: `sm`

---

### TILE F5: `personae-character-corpus`

**Marketing Title**: "Character Analysis Corpus"
**Subtitle**: "Narrative text with personality annotations"

**Source**: `CLIPS personae corpus` (University of Antwerp)
**Data Type**: Short stories with character personality markers

**Wizard Flow**:

1. Browse stories
2. Select character-focused excerpts
3. Import for translation + character study

**Layout**: `book` (narrative format)
**Target Audience**: Creative writing students, literature translators
**Size**: `sm`

---

### TILE F6: `explanation-bank-ai`

**Marketing Title**: "AI Explanation Cards"
**Subtitle**: "Learn to explain AI concepts in multiple languages"

**Source**: `cognitiveai.org/explanationbank` (Free, Academic)
**Data Type**: Science questions with structured explanations

**Wizard Flow**:

1. Browse by topic
2. Select Q&A pairs
3. Create explanation flashcards

**Layout**: `flashcard`
**Size**: `sm`

---

### TILE F7: `libretranslate-practice`

**Marketing Title**: "AI Translation Practice"
**Subtitle**: "Compare your translation with AI suggestions"

**Source**: `libretranslate.com` (Free, Self-hostable)
**API Endpoint**: `https://libretranslate.com/translate`
**Features**: Machine translation for 30+ languages

**Purpose**: UTILITY tile – not content import, but AI assistance

**Wizard Flow**:

1. Import any text
2. Get AI translation suggestion
3. Compare and learn

**Layout**: Integrated into editor toolbar
**Size**: `sm`

**Note**: Consider self-hosting for unlimited usage

---

### TILE F8: `kdnuggets-data-catalog`

**Marketing Title**: "Data Science Vocabulary"
**Subtitle**: "Technical terms for ML/AI translation"

**Source**: `kdnuggets.com/datasets` (Curated links, not API)
**Implementation**: Create manual vocabulary list from common DS terms

**Layout**: `workbook` (technical vocabulary)
**Size**: `sm`

---

## SECTION F SUMMARY

| Tile ID                   | Source                    | Auth          | Layout      | Size |
| ------------------------- | ------------------------- | ------------- | ----------- | ---- |
| corpus-builder-wmt        | statmt.org                | None (static) | spreadsheet | md   |
| wikicorp-wikipedia-sample | westburylab               | None (static) | book        | sm   |
| ud-syntax-trees           | universaldependencies.org | None (static) | academic    | md   |
| keyphrase-extraction      | GitHub                    | None (static) | workbook    | sm   |
| personae-character-corpus | CLIPS                     | None (static) | book        | sm   |
| explanation-bank-ai       | cognitiveai.org           | None (static) | flashcard   | sm   |
| libretranslate-practice   | libretranslate.com        | None          | utility     | sm   |
| kdnuggets-data-catalog    | manual curation           | None (static) | workbook    | sm   |

**Total Section F Tiles**: 8 tiles covering NLP datasets and AI-related content

---

## COMPLETE REGISTRY SUMMARY

| Section | Theme              | Tile Count | Hero Tiles (lg)                    |
| ------- | ------------------ | ---------- | ---------------------------------- |
| A       | Sacred & Wisdom    | 8          | bible-study-kdp, quran-audio-surah |
| B       | Classic Literature | 8          | classic-novel-import               |
| C       | Visual & Art       | 8          | met-museum-ekphrasis               |
| D       | News & History     | 8          | history-headlines                  |
| E       | Language & Slang   | 8          | urban-slang-flashcards             |
| F       | Academic & AI      | 8          | —                                  |

**GRAND TOTAL: 48 TILES**

---

## Implementation Priority

### Phase 1 (MVP - 10 tiles)

1. `bible-study-kdp` (religious market)
2. `classic-novel-import` (literature market)
3. `daily-poem-challenge` (engagement hook)
4. `met-museum-ekphrasis` (visual differentiation)
5. `fun-facts-daily` (casual users)
6. `urban-slang-flashcards` (social media appeal)
7. `quran-audio-surah` (religious market)
8. `gita-wisdom-posters` (religious market)
9. `wiki-article-translator` (broad appeal)
10. `factbook-country-profiles` (educational)

### Phase 2 (Expansion - 20 tiles)

- Complete all sacred texts (Thirukkural, etc.)
- Add all museum tiles
- Add poetry variations

### Phase 3 (Full Coverage - 48 tiles)

- Academic/NLP tiles
- Static datasets integration
- Pro-tier features (Collins, etc.)

---

## Data Sources Checklist

### ✅ READY TO IMPLEMENT (Free, No Auth, Live API)

- [x] bible-api.com
- [x] alquran.cloud
- [x] gita-api.vercel.app
- [x] api-thirukkural.web.app
- [x] gutendex.com
- [x] poetrydb.org
- [x] openlibrary.org
- [x] metmuseum.github.io
- [x] api.artic.edu
- [x] thecolorapi.com
- [x] uselessfacts.jsph.pl
- [x] indian-quotes-api.vercel.app
- [x] dictionaryapi.dev
- [x] mediawiki API
- [x] bhagavadgita.com/api
- [x] fawazahmed0/quran-api

### 📦 REQUIRES STATIC SEED (Download & Pre-process)

- [ ] factbook.json (GitHub)
- [ ] Kaggle Urban Dictionary
- [ ] politische-reden.eu
- [ ] SaudiNewsNet
- [ ] statmt.org WMT
- [ ] westburylab wikicorp
- [ ] wordbank.stanford.edu
- [ ] universaldependencies.org
- [ ] CLIPS personae corpus
- [ ] cognitiveai.org explanationbank
- [ ] compling.hss OMW

### ⚠️ OPTIONAL/PRO TIER (Requires Auth)

- [ ] docs.api.bible (API key)
- [ ] api.collinsdictionary.com (API key)
- [ ] synonyms.com (may need key)
- [ ] languagetool.org (rate limited)
- [ ] libretranslate.com (self-host recommended)

### ❌ DEPRIORITIZED

- colourlovers.com (API deprecated/unstable)
- chroniclingamerica.loc.gov (complex OCR)
- Harvard Library APIs (too academic)
- vocab.getty.edu (SPARQL complexity)
- lordicon.com (UI icons, not content)
- opencollective.com (unrelated)
- kdnuggets.com (links only, not API)

---

_END OF TILE REGISTRY_

_Proceed to: LIBRARY_WIZARD_SYSTEM.md for wizard implementation details_
