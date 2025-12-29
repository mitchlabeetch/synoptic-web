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
  | 'table';

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
// ANNOTATION TYPES
// ============================================

export interface WordGroup {
  id: string;
  blockId: string;
  text: string;
  translation: string;
  color: string;
  startIndex: number;
  endIndex: number;
}

export interface ArrowConnector {
  id: string;
  sourceBlockId: string;
  sourceWordGroupId?: string;
  targetBlockId: string;
  targetWordGroupId?: string;
  color: string;
  curve: number;
  thickness: number;
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
  | TableBlock;

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

  // Chapter info
  chapterId?: string;
  chapterTitle?: string;
}

export interface ProjectContent {
  pages: PageData[];
  wordGroups: WordGroup[];
  arrows: ArrowConnector[];
  stamps: any[];
}
