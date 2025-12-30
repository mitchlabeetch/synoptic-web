// src/types/coverArchitect.ts
// PURPOSE: Type definitions for the Cover Architect (Spine Calculation) system
// ACTION: Defines cover layout, spine calculation, and KDP-compliant export structures
// MECHANISM: Calculates exact spine width based on page count and paper stock

/**
 * Paper stock options available for print-on-demand.
 * Different paper weights affect spine width calculation.
 */
export type PaperStock = 
  | 'cream'      // Amazon KDP cream/off-white paper
  | 'white';     // Amazon KDP white paper

/**
 * Spine width multipliers per page (in inches).
 * These are based on Amazon KDP's official specifications.
 * Source: https://kdp.amazon.com/en_US/help/topic/G201834180
 */
export const SPINE_MULTIPLIERS: Record<PaperStock, number> = {
  cream: 0.002252,  // inches per page for cream paper
  white: 0.002016,  // inches per page for white paper
};

/**
 * Minimum pages required to have a visible spine.
 */
export const MINIMUM_SPINE_PAGES = 79; // Below this, KDP hides the spine

/**
 * Bleed requirements for KDP covers (in inches).
 */
export const KDP_BLEED = {
  top: 0.125,
  bottom: 0.125,
  outer: 0.125,
  spine: 0.0625, // Spine bleed is tighter
};

/**
 * Safe zone margins (in inches) - content should stay within these bounds.
 */
export const KDP_SAFE_ZONE = {
  top: 0.25,
  bottom: 0.25,
  outer: 0.25,
  spine: 0.0625,
};

/**
 * Standard trim sizes supported by KDP (in inches).
 */
export const KDP_TRIM_SIZES: Record<string, { width: number; height: number; label: string }> = {
  '5x8': { width: 5, height: 8, label: '5" × 8"' },
  '5.06x7.81': { width: 5.06, height: 7.81, label: '5.06" × 7.81" (Digest)' },
  '5.25x8': { width: 5.25, height: 8, label: '5.25" × 8"' },
  '5.5x8.5': { width: 5.5, height: 8.5, label: '5.5" × 8.5"' },
  '6x9': { width: 6, height: 9, label: '6" × 9" (Most Popular)' },
  '6.14x9.21': { width: 6.14, height: 9.21, label: '6.14" × 9.21" (US Trade)' },
  '6.69x9.61': { width: 6.69, height: 9.61, label: '6.69" × 9.61" (Royal)' },
  '7x10': { width: 7, height: 10, label: '7" × 10"' },
  '7.44x9.69': { width: 7.44, height: 9.69, label: '7.44" × 9.69" (Crown Quarto)' },
  '7.5x9.25': { width: 7.5, height: 9.25, label: '7.5" × 9.25"' },
  '8x10': { width: 8, height: 10, label: '8" × 10"' },
  '8.25x6': { width: 8.25, height: 6, label: '8.25" × 6" (Landscape)' },
  '8.25x8.25': { width: 8.25, height: 8.25, label: '8.25" × 8.25" (Square)' },
  '8.5x8.5': { width: 8.5, height: 8.5, label: '8.5" × 8.5" (Large Square)' },
  '8.5x11': { width: 8.5, height: 11, label: '8.5" × 11" (Letter)' },
};

/**
 * Barcode area specifications.
 * The barcode must be placed on the back cover.
 */
export const BARCODE_AREA = {
  width: 2,        // inches
  height: 1.2,     // inches
  minTop: 0.25,    // minimum distance from top safe edge
  minBottom: 0.25, // minimum distance from bottom safe edge
  minOuter: 0.25,  // minimum distance from outer safe edge
};

/**
 * Cover project configuration.
 */
export interface CoverConfig {
  /** Selected trim size key */
  trimSize: string;
  
  /** Paper stock type */
  paperStock: PaperStock;
  
  /** Total page count (used for spine calculation) */
  pageCount: number;
  
  /** Whether to include KDP barcode area */
  includeBarcode: boolean;
  
  /** Custom ISBN (if not using KDP's free ISBN) */
  customIsbn?: string;
}

/**
 * Calculated cover dimensions (in inches).
 */
export interface CoverDimensions {
  /** Width of the front cover panel */
  frontCoverWidth: number;
  
  /** Width of the spine */
  spineWidth: number;
  
  /** Width of the back cover panel */
  backCoverWidth: number;
  
  /** Height of the entire cover */
  height: number;
  
  /** Total width including bleeds */
  totalWidth: number;
  
  /** Total height including bleeds */
  totalHeight: number;
  
  /** Width without bleeds (wrap edge) */
  wrapWidth: number;
  
  /** Height without bleeds (wrap edge) */
  wrapHeight: number;
  
  /** Whether spine is wide enough for text */
  spineAllowsText: boolean;
  
  /** DPI for the final export */
  dpi: number;
  
  /** Pixel dimensions */
  pixelWidth: number;
  pixelHeight: number;
}

/**
 * Cover element for the visual editor.
 */
export interface CoverElement {
  id: string;
  type: 'image' | 'text' | 'shape';
  
  // Position (relative to the cover, 0-1)
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  
  // Panel placement
  panel: 'front' | 'spine' | 'back' | 'full';
  
  // Layer order
  zIndex: number;
  
  // Type-specific properties
  properties: {
    // For image
    src?: string;
    objectFit?: 'cover' | 'contain' | 'fill';
    
    // For text
    text?: string;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    
    // For shape
    shapeType?: 'rectangle' | 'ellipse';
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  };
}

/**
 * Complete cover project state.
 */
export interface CoverProject {
  id: string;
  projectId: string; // Link to the main book project
  config: CoverConfig;
  dimensions: CoverDimensions;
  elements: CoverElement[];
  
  // Preview images (base64)
  frontPreview?: string;
  backPreview?: string;
  fullPreview?: string;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Calculates the spine width based on page count and paper stock.
 * 
 * @param pageCount - Total number of pages in the book
 * @param paperStock - Type of paper stock
 * @returns Spine width in inches
 */
export function calculateSpineWidth(pageCount: number, paperStock: PaperStock): number {
  const multiplier = SPINE_MULTIPLIERS[paperStock];
  return pageCount * multiplier;
}

/**
 * Calculates complete cover dimensions for a given configuration.
 * 
 * @param config - Cover configuration
 * @returns Complete cover dimensions including bleeds and pixel sizes
 */
export function calculateCoverDimensions(config: CoverConfig): CoverDimensions {
  const trimSize = KDP_TRIM_SIZES[config.trimSize] || KDP_TRIM_SIZES['6x9'];
  const spineWidth = calculateSpineWidth(config.pageCount, config.paperStock);
  
  const frontCoverWidth = trimSize.width;
  const backCoverWidth = trimSize.width;
  const height = trimSize.height;
  
  // Calculate total dimensions with bleeds
  const totalWidth = frontCoverWidth + spineWidth + backCoverWidth + (KDP_BLEED.outer * 2);
  const totalHeight = height + (KDP_BLEED.top + KDP_BLEED.bottom);
  
  // Wrap dimensions (without bleeds)
  const wrapWidth = frontCoverWidth + spineWidth + backCoverWidth;
  const wrapHeight = height;
  
  // DPI and pixel calculations
  const dpi = 300;
  const pixelWidth = Math.ceil(totalWidth * dpi);
  const pixelHeight = Math.ceil(totalHeight * dpi);
  
  // Spine allows text if it's at least 0.0625" (1/16 inch)
  const spineAllowsText = spineWidth >= 0.0625;
  
  return {
    frontCoverWidth,
    spineWidth,
    backCoverWidth,
    height,
    totalWidth,
    totalHeight,
    wrapWidth,
    wrapHeight,
    spineAllowsText,
    dpi,
    pixelWidth,
    pixelHeight,
  };
}

/**
 * Generates a text summary of the cover specifications.
 */
export function generateCoverSpecs(config: CoverConfig): string {
  const dims = calculateCoverDimensions(config);
  const trimSize = KDP_TRIM_SIZES[config.trimSize];
  
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   COVER SPECIFICATIONS (KDP-Compliant)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📐 TRIM SIZE: ${trimSize?.label || config.trimSize}
📄 PAPER: ${config.paperStock === 'cream' ? 'Cream' : 'White'} Stock
📚 PAGE COUNT: ${config.pageCount} pages

📏 SPINE WIDTH: ${dims.spineWidth.toFixed(4)}" (${(dims.spineWidth * 25.4).toFixed(2)} mm)
${dims.spineAllowsText ? '✅ Spine allows text' : '⚠️ Spine too thin for text'}

🖼️ FINAL DIMENSIONS:
   Total Size: ${dims.totalWidth.toFixed(3)}" × ${dims.totalHeight.toFixed(3)}"
   Pixels (300 DPI): ${dims.pixelWidth} × ${dims.pixelHeight} px

📐 PANEL BREAKDOWN:
   Back Cover: ${dims.backCoverWidth}"
   Spine: ${dims.spineWidth.toFixed(4)}"
   Front Cover: ${dims.frontCoverWidth}"
   + Bleeds: ${KDP_BLEED.outer}" per side

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}
