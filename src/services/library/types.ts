// src/services/library/types.ts
// PURPOSE: Core type definitions for the Synoptic Library system
// ACTION: Defines interfaces for tiles, adapters, ingestion, and licensing
// MECHANISM: Used by all Library components and adapters

// ═══════════════════════════════════════════════════════════════════
// LAYOUT TYPES - How content is displayed in the editor
// ═══════════════════════════════════════════════════════════════════

export type TileLayout =
  | 'book'          // Full book project with chapters
  | 'workbook'      // Interactive exercises and quizzes
  | 'poster'        // Single-page visual design
  | 'social'        // Square Instagram/social format (1080x1080)
  | 'flashcard'     // Card-based vocabulary/learning
  | 'newspaper'     // Article with headlines layout
  | 'split-panel'   // Image left, text right (museum style)
  | 'picture-book'  // Illustrated children's format
  | 'spreadsheet'   // Data/corpus tabular view
  | 'article'       // Long-form single column
  | 'academic';     // Scholarly format with citations

// ═══════════════════════════════════════════════════════════════════
// CATEGORY TYPES - How tiles are grouped in the Library
// ═══════════════════════════════════════════════════════════════════

export type TileCategory =
  | 'sacred'        // Religious texts (Bible, Quran, Gita, Torah)
  | 'literature'    // Novels, poetry, short stories
  | 'visual'        // Art, museums, colors
  | 'news'          // Newspapers, current events
  | 'history'       // Historical documents, archives
  | 'language'      // Slang, dictionaries, etymology
  | 'knowledge'     // Facts, science, recipes, countries
  | 'academic'      // Corpora, NLP datasets, research
  | 'popculture';   // Anime, games, movies (often restricted)

// ═══════════════════════════════════════════════════════════════════
// LICENSE GUARD SYSTEM - Traffic Light Classification
// ═══════════════════════════════════════════════════════════════════

/**
 * 🟢 commercial-safe  - Users can publish and sell without restrictions
 * 🟡 attribution      - Commercial use allowed with required credit
 * 🔴 personal-only    - Study only, no commercial publishing allowed
 */
export type LicenseType = 
  | 'commercial-safe'   // 🟢 Public Domain, CC0, or explicit commercial
  | 'attribution'       // 🟡 CC-BY, ODbL - requires credit line
  | 'personal-only';    // 🔴 CC-BY-NC, Trademarked, or TOS restricted

export interface LicenseInfo {
  type: LicenseType;
  name: string;              // e.g., "CC0", "CC-BY 2.0", "Public Domain"
  url?: string;              // Link to full license text
  attributionText?: string;  // Required credit text for 🟡 sources
  warningText?: string;      // Warning for 🔴 sources
}

// ═══════════════════════════════════════════════════════════════════
// SOURCE CAPABILITIES - What each API can do
// ═══════════════════════════════════════════════════════════════════

export interface SourceCapabilities {
  supportsSearch: boolean;     // User can type a search query
  supportsReference: boolean;  // User can pick Book/Chapter/Verse
  supportsRandom: boolean;     // "Surprise Me" button works
  supportsDateRange: boolean;  // Historical date picker (newspapers)
  supportsPagination: boolean; // Can fetch more results
  hasVisuals: boolean;         // Returns images
  hasAudio: boolean;           // Returns audio URLs
  requiresAuth: boolean;       // Needs API key (marked for Pro tier)
}

// ═══════════════════════════════════════════════════════════════════
// LIBRARY TILE - Complete definition for a single template
// ═══════════════════════════════════════════════════════════════════

export interface LibraryTile {
  id: string;                  // Unique identifier (kebab-case)
  
  // ─────────────────────────────────────────────────────────────────
  // MARKETING (What user sees in the Bento Grid)
  // ─────────────────────────────────────────────────────────────────
  title: string;               // "Build a Bilingual Bible"
  subtitle: string;            // "Compare KJV/WEB side-by-side"
  description?: string;        // Longer explanation for modal
  coverImage?: string;         // URL for visual
  tileColor: string;           // Tailwind bg class: "bg-blue-100"
  size: 'sm' | 'md' | 'lg';    // Bento grid sizing
  icon: string;                // Lucide icon name
  
  // ─────────────────────────────────────────────────────────────────
  // TECHNICAL
  // ─────────────────────────────────────────────────────────────────
  sourceId: string;            // Adapter reference: "bible-api"
  category: TileCategory;
  layout: TileLayout;
  capabilities: SourceCapabilities;
  tags: string[];              // For search: ["christian", "kjv", "bible"]
  difficulty: 'beginner' | 'intermediate' | 'expert';
  
  // ─────────────────────────────────────────────────────────────────
  // UTILITIES (Auto-enabled when using this template)
  // ─────────────────────────────────────────────────────────────────
  enabledUtilities: ('translate' | 'grammar' | 'dictionary' | 'thesaurus')[];
  
  // ─────────────────────────────────────────────────────────────────
  // LICENSE GUARD 🚦
  // ─────────────────────────────────────────────────────────────────
  license: LicenseInfo;
  
  // ─────────────────────────────────────────────────────────────────
  // SOURCE METADATA
  // ─────────────────────────────────────────────────────────────────
  sourceUrl?: string;          // Link to original source
  sourceName: string;          // Display name: "Project Gutenberg"
  sourceApiUrl?: string;       // API endpoint base URL
}

// ═══════════════════════════════════════════════════════════════════
// WIZARD CONFIGURATION - User selections before import
// ═══════════════════════════════════════════════════════════════════

export interface WizardConfig {
  // Reference-based (Bible, Quran, Gita)
  book?: string;
  chapter?: string | number;
  verse?: string | number;
  
  // Search-based (Gutendex, Museum)
  searchQuery?: string;
  selectedId?: string | number;
  
  // Range selection (Novels)
  importRange?: 'full' | 'chapters' | 'custom';
  startChapter?: number;
  endChapter?: number;
  
  // Date-based (Newspapers)
  date?: Date | string;
  
  // Random mode (Facts, Quotes)
  randomCount?: number;
  
  // Layout override
  targetLayout?: TileLayout;
  
  // Utility toggles
  enableDictionary?: boolean;
  enableGrammarCheck?: boolean;
  enableAITranslate?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// INGESTED LINE - Single unit of normalized content
// ═══════════════════════════════════════════════════════════════════

export interface IngestedLine {
  id: string;
  type: 'text' | 'image' | 'heading' | 'separator' | 'quiz';
  
  // Language content
  L1: string;                  // Source language text
  L2: string;                  // Target language (usually empty initially)
  
  // Optional metadata
  meta?: {
    // Reference info
    verse?: number;
    chapter?: number;
    page?: number;
    reference?: string;        // "Genesis 1:1"
    
    // Media
    audioUrl?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    
    // Attribution
    artistName?: string;
    artistNationality?: string;
    objectDate?: string;
    medium?: string;
    author?: string;           // For Tatoeba sentences
    
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

// ═══════════════════════════════════════════════════════════════════
// INGESTED PAGE - Collection of lines
// ═══════════════════════════════════════════════════════════════════

export interface IngestedPage {
  id: string;
  number?: number;
  title?: string;
  lines: IngestedLine[];
}

// ═══════════════════════════════════════════════════════════════════
// INGESTED CONTENT - Full import result
// ═══════════════════════════════════════════════════════════════════

export interface IngestedContent {
  title: string;
  description?: string;
  sourceLang: string;
  targetLang?: string;
  layout: TileLayout;
  pages: IngestedPage[];
  
  // Import metadata
  meta?: {
    source: string;
    sourceUrl?: string;
    author?: string;
    coverImageUrl?: string;
    publicDomain: boolean;
    fetchedAt: string;
    license: LicenseInfo;
  };
  
  // Auto-generated credits for 🟡 sources
  credits?: ProjectCredits;
}

// ═══════════════════════════════════════════════════════════════════
// PROJECT CREDITS - For attribution-required sources
// ═══════════════════════════════════════════════════════════════════

export interface ProjectCredits {
  sources: {
    name: string;
    license: string;
    attributionText: string;
    url?: string;
  }[];
  generatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// ADAPTER INTERFACE - How sources are normalized
// ═══════════════════════════════════════════════════════════════════

export interface LibraryAdapter {
  sourceId: string;
  displayName: string;
  
  // Search capability (if supportsSearch = true)
  search?: (query: string, limit?: number) => Promise<SearchResult[]>;
  
  // Fetch full content
  fetch: (config: WizardConfig) => Promise<IngestedContent>;
  
  // Quick preview (optional, lighter fetch)
  preview?: (config: WizardConfig) => Promise<Partial<IngestedContent>>;
}

export interface SearchResult {
  id: string | number;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  meta?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════
// WIZARD STATE - UI state machine
// ═══════════════════════════════════════════════════════════════════

export type WizardStep = 
  | 'preview'       // Show tile details + CTA
  | 'configure'     // Source-specific configuration
  | 'loading'       // Fetching content
  | 'confirm'       // Preview ingested content
  | 'creating';     // Creating project

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export function isCommercialSafe(license: LicenseInfo): boolean {
  return license.type === 'commercial-safe';
}

export function requiresAttribution(license: LicenseInfo): boolean {
  return license.type === 'attribution';
}

export function isPersonalOnly(license: LicenseInfo): boolean {
  return license.type === 'personal-only';
}

export function getLicenseEmoji(license: LicenseInfo): string {
  switch (license.type) {
    case 'commercial-safe': return '🟢';
    case 'attribution': return '🟡';
    case 'personal-only': return '🔴';
  }
}

export function getLicenseColor(license: LicenseInfo): string {
  switch (license.type) {
    case 'commercial-safe': return 'text-green-600 bg-green-50';
    case 'attribution': return 'text-yellow-600 bg-yellow-50';
    case 'personal-only': return 'text-red-600 bg-red-50';
  }
}
