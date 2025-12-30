// src/types/blocks.ts

// ============================================
// BLOCK TYPES (Polymorphic Content System)
// ============================================

export type BlockType =
  | 'text'
  | 'image'
  | 'separator'
  | 'callout'
  | 'stamp'
  | 'table'
  | 'quiz';

export type LayoutMode =
  | 'side-by-side'
  | 'interlinear'
  | 'stacked'
  | 'floating';

// Base interface all blocks share
export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number; // For reordering
  layout: LayoutMode;

  // Visibility & Print
  visible: boolean;
  printable: boolean;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================
// TEXT BLOCK (Primary content type)
// ============================================

export interface LanguageContent {
  lang: string; // ISO 639-1 code: 'fr', 'en', 'es', etc.
  content: string; // The actual text

  // Rich text formatting
  formatting?: {
    bold?: [number, number][]; // Start/end index pairs
    italic?: [number, number][];
    underline?: [number, number][];
    fontSize?: number; // Override default
    fontFamily?: string; // Override default
    color?: string; // Override default
    alignment?: 'left' | 'center' | 'right' | 'justify';
  };

  // Pronunciation / Romanization (for CJK, Arabic, etc.)
  romanization?: string;
  audioUrl?: string;
}

export interface TextBlock extends BaseBlock {
  type: 'text';

  // Language-agnostic content
  L1: LanguageContent; // Primary language (e.g., source/original)
  L2: LanguageContent; // Secondary language (e.g., translation)

  // Text-specific settings
  lineSpacing: number; // 1.0 - 3.0
  paragraphSpacing: number;
  indent: number;

  // Semantic markers
  isTitle: boolean;
  isChapterHeading: boolean;
  isVerse: boolean;
  verseNumber?: number;

  // Annotations linked to this block
  wordGroupIds: string[];
  arrowIds: string[];
  noteIds: string[];
}

// ============================================
// IMAGE BLOCK
// ============================================

export interface ImageBlock extends BaseBlock {
  type: 'image';

  // Image data
  url: string;
  altText: string;
  caption?: {
    L1: string;
    L2: string;
  };

  // Dimensions
  width: number; // percentage or pixels
  height: number;
  aspectRatio: number;

  // Positioning
  alignment: 'left' | 'center' | 'right';
  wrap: 'none' | 'left' | 'right' | 'both';
  offsetX: number;
  offsetY: number;

  // Effects
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  shadow: boolean;
  opacity: number;
}

// ============================================
// SEPARATOR BLOCK (Dividers, Ornaments)
// ============================================

export type SeparatorStyle =
  | 'line'
  | 'double-line'
  | 'dashed'
  | 'dotted'
  | 'gradient'
  | 'ornament-fleuron'
  | 'ornament-stars'
  | 'ornament-diamond'
  | 'ornament-vine'
  | 'custom';

export interface SeparatorBlock extends BaseBlock {
  type: 'separator';

  style: SeparatorStyle;
  thickness: number;
  color: string;
  width: number; // percentage
  marginTop: number;
  marginBottom: number;

  // For custom ornaments
  customSvg?: string;
  customEmoji?: string;
}

// ============================================
// CALLOUT BLOCK (Notes, Tips, Warnings)
// ============================================

export type CalloutType =
  | 'note'
  | 'tip'
  | 'warning'
  | 'grammar'
  | 'vocabulary'
  | 'culture'
  | 'pronunciation'
  | 'false-friend'
  | 'custom';

export interface CalloutBlock extends BaseBlock {
  type: 'callout';

  calloutType: CalloutType;
  icon: string; // Emoji or Lucide icon name
  title: string;
  content: string; // Markdown supported

  // Styling
  headerColor: string;
  backgroundColor: string;
  textColor: string;
  borderStyle: 'solid' | 'dashed' | 'double' | 'none';
  borderRadius: number;

  // Collapsible
  collapsible: boolean;
  defaultExpanded: boolean;
}

// ============================================
// STAMP BLOCK (Quick semantic markers)
// ============================================

export interface StampBlock extends BaseBlock {
  type: 'stamp';

  templateId: string; // Reference to stamp template
  label: string;
  icon: string;

  // Positioning (absolute within page)
  positionX: number;
  positionY: number;

  // Styling
  color: string;
  backgroundColor: string;
  size: 'small' | 'medium' | 'large';
}

// ============================================
// TABLE BLOCK (Conjugation tables, vocabulary lists)
// ============================================

export interface TableCell {
  content: string;
  colspan?: number;
  rowspan?: number;
  alignment?: 'left' | 'center' | 'right';
  isHeader?: boolean;
}

export interface TableBlock extends BaseBlock {
  type: 'table';

  rows: TableCell[][];

  // Styling
  headerStyle: {
    backgroundColor: string;
    color: string;
    fontWeight: string;
  };
  cellPadding: number;
  borderColor: string;
  borderWidth: number;
  alternateRowColor?: string;
}

// ============================================
// QUIZ BLOCK (Workbook Cloze Deletion)
// ============================================

export interface QuizBlock extends BaseBlock {
  type: 'quiz';
  
  // Sentence structure
  preText: string;     // Text before the blank (e.g. "The cat sat on the")
  answer: string;      // The hidden word (e.g. "mat")
  postText: string;    // Text after the blank (e.g. ".")
  
  // Optional hint (auto-generated via Datamuse or manual)
  hint?: string;       // e.g. "floor covering"
  
  // Difficulty level for workbook exercises
  difficulty?: 'easy' | 'medium' | 'hard';
  
  // Source language context
  languageContext?: 'L1' | 'L2';
}

// ============================================
// ANNOTATION TYPES
// ============================================

export interface WordGroup {
  id: string;
  blockId: string;
  language: 'L1' | 'L2';
  wordIndices: number[]; // Index of words in the text
  role: string; // 'subject', 'verb', etc.
  color: string;
}

export interface ArrowConnector {
  id: string;
  blockId: string; // The text block this arrow belongs to
  source: { language: 'L1' | 'L2'; wordIndices: number[] };
  target: { language: 'L1' | 'L2'; wordIndices: number[] };
  label?: string;
  color?: string;
}

export interface AINote {
  id: string;
  blockId: string;
  type: 'grammar' | 'vocabulary' | 'culture';
  language: 'L1' | 'L2';
  wordIndex: number;
  title: string;
  content: string;
}

// ============================================
// STYLE PRESETS
// ============================================

export interface StylePreset {
  id: string;
  name: string;
  type: BlockType;
  settings: any; // Snapshot of styling fields
}

// ============================================
// UNION TYPE
// ============================================

export type ContentBlock =
  | TextBlock
  | ImageBlock
  | SeparatorBlock
  | CalloutBlock
  | StampBlock
  | TableBlock
  | QuizBlock;

// ============================================
// PAGE STRUCTURE
// ============================================

export interface PageData {
  id: string;
  number: number;

  // Content
  blocks: ContentBlock[];

  // Page-level overrides
  backgroundColor?: string;
  backgroundImage?: string;
  marginOverrides?: {
    top?: number;
    bottom?: number;
    inner?: number;
    outer?: number;
  };

  // Print settings
  isBlankPage: boolean;
  avoidPageBreak: boolean;

  // Header & Footer visibility overrides
  showPageNumber?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  headerText?: string;
  footerText?: string;

  // Chapter info
  chapterId?: string;
  chapterTitle?: string;
  isChapterStart?: boolean;
}

// ============================================
// FRONT/BACK MATTER (KDP Compliance)
// ============================================

export type FrontMatterType = 'title' | 'copyright' | 'dedication' | 'toc';
export type BackMatterType = 'glossary' | 'about' | 'notes';

export interface FrontMatterPage {
  id: string;
  type: FrontMatterType;
  blocks: ContentBlock[];
  // For title page
  title?: string;
  subtitle?: string;
  author?: string;
  // For copyright
  year?: number;
  isbn?: string;
  publisher?: string;
  // For dedication
  dedicationText?: string;
}

export interface BackMatterPage {
  id: string;
  type: BackMatterType;
  blocks: ContentBlock[];
  // For about page
  authorBio?: string;
}

// Glossary entry for auto-compiled glossary
export interface GlossaryEntry {
  id: string;
  term: string;       // L2 word/phrase
  definition: string; // L1 translation/explanation
  sourceBlockId: string;
  sourcePageId: string;
  category?: string;  // 'vocabulary', 'grammar', 'culture'
}

export interface ProjectContent {
  pages: PageData[];
  frontMatter: FrontMatterPage[];
  backMatter: BackMatterPage[];
  glossary: GlossaryEntry[];
  wordGroups: WordGroup[];
  arrows: ArrowConnector[];
  notes: AINote[];
  stamps: any[];
  presets?: StylePreset[];
}
