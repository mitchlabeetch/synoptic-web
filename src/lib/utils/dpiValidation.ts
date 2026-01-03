// src/lib/utils/dpiValidation.ts
// PURPOSE: Image resolution validation for print-ready output
// ACTION: Validates images meet minimum DPI requirements for physical printing
// MECHANISM: Calculates printable size at target DPI from pixel dimensions

/**
 * Standard DPI targets for different use cases
 */
export const DPI_TARGETS = {
  PRINT_PROFESSIONAL: 300,  // KDP, Ingram, professional print
  PRINT_STANDARD: 150,      // Standard quality print
  WEB_RETINA: 144,          // 2x web displays
  WEB_STANDARD: 72,         // Standard web
  THUMBNAIL: 48,            // Previews only
} as const;

export type DpiTarget = keyof typeof DPI_TARGETS;

/**
 * Validation result with clear messaging for users
 */
export interface DpiValidationResult {
  isValid: boolean;
  pixelWidth: number;
  pixelHeight: number;
  targetDpi: number;
  
  // Calculated printable dimensions at target DPI
  printableWidthInches: number;
  printableHeightInches: number;
  printableWidthMm: number;
  printableHeightMm: number;
  
  // User-friendly messages
  message: string;
  suggestion?: string;
  
  // For specific use cases
  kdpCompatible: boolean;
  minimumRequiredPixels?: { width: number; height: number };
}

/**
 * Validates if an image has sufficient resolution for print at target DPI.
 * 
 * IMPORTANT: Browsers cannot natively check DPI metadata from image files.
 * This function calculates the effective print size based on pixel dimensions.
 * 
 * @example
 * // A 1800x2700 image at 300 DPI would print at 6x9 inches
 * validateImageDpi(1800, 2700, 300, 6, 9) // Returns valid
 */
export function validateImageDpi(
  pixelWidth: number,
  pixelHeight: number,
  targetDpi: number = DPI_TARGETS.PRINT_PROFESSIONAL,
  requiredWidthInches?: number,
  requiredHeightInches?: number
): DpiValidationResult {
  // Calculate printable dimensions at target DPI
  const printableWidthInches = pixelWidth / targetDpi;
  const printableHeightInches = pixelHeight / targetDpi;
  const printableWidthMm = printableWidthInches * 25.4;
  const printableHeightMm = printableHeightInches * 25.4;
  
  // Check if dimensions meet requirements (if specified)
  let isValid = true;
  let message = '';
  let suggestion: string | undefined;
  
  if (requiredWidthInches && requiredHeightInches) {
    const meetsWidth = printableWidthInches >= requiredWidthInches;
    const meetsHeight = printableHeightInches >= requiredHeightInches;
    isValid = meetsWidth && meetsHeight;
    
    if (isValid) {
      message = `Image is ${pixelWidth}×${pixelHeight}px — suitable for ${printableWidthInches.toFixed(2)}×${printableHeightInches.toFixed(2)}" print at ${targetDpi} DPI.`;
    } else {
      const minWidth = Math.ceil(requiredWidthInches * targetDpi);
      const minHeight = Math.ceil(requiredHeightInches * targetDpi);
      message = `Image is ${pixelWidth}×${pixelHeight}px — only prints at ${printableWidthInches.toFixed(2)}×${printableHeightInches.toFixed(2)}" at ${targetDpi} DPI.`;
      suggestion = `For a ${requiredWidthInches}×${requiredHeightInches}" print, you need at least ${minWidth}×${minHeight}px.`;
    }
  } else {
    // Generic message when no specific size required
    message = `Image is ${pixelWidth}×${pixelHeight}px — printable at ${printableWidthInches.toFixed(2)}×${printableHeightInches.toFixed(2)}" at ${targetDpi} DPI.`;
    
    // Warn if image is very small
    if (printableWidthInches < 2 || printableHeightInches < 2) {
      suggestion = `This image is quite small for print. It will only be ${printableWidthInches.toFixed(1)}×${printableHeightInches.toFixed(1)} inches at professional quality (${targetDpi} DPI).`;
    }
  }
  
  // KDP specific check (minimum 300 DPI for covers)
  const kdpCompatible = pixelWidth >= 1500 && pixelHeight >= 2400; // Approximate minimum for 5x8
  
  return {
    isValid,
    pixelWidth,
    pixelHeight,
    targetDpi,
    printableWidthInches,
    printableHeightInches,
    printableWidthMm,
    printableHeightMm,
    message,
    suggestion,
    kdpCompatible,
    minimumRequiredPixels: requiredWidthInches && requiredHeightInches
      ? {
          width: Math.ceil(requiredWidthInches * targetDpi),
          height: Math.ceil(requiredHeightInches * targetDpi),
        }
      : undefined,
  };
}

/**
 * Get human-readable DPI category based on effective DPI
 */
export function getDpiCategory(effectiveDpi: number): {
  category: 'excellent' | 'good' | 'acceptable' | 'poor' | 'web-only';
  label: string;
  color: string;
} {
  if (effectiveDpi >= 300) {
    return { category: 'excellent', label: 'Professional Print Quality', color: '#10b981' };
  }
  if (effectiveDpi >= 200) {
    return { category: 'good', label: 'Good Print Quality', color: '#22c55e' };
  }
  if (effectiveDpi >= 150) {
    return { category: 'acceptable', label: 'Acceptable for Print', color: '#eab308' };
  }
  if (effectiveDpi >= 72) {
    return { category: 'poor', label: 'Low Quality Print', color: '#f97316' };
  }
  return { category: 'web-only', label: 'Web Only', color: '#ef4444' };
}

/**
 * Calculate effective DPI for a given print size
 */
export function calculateEffectiveDpi(
  pixelWidth: number,
  pixelHeight: number,
  printWidthInches: number,
  printHeightInches: number
): { horizontalDpi: number; verticalDpi: number; effectiveDpi: number } {
  const horizontalDpi = pixelWidth / printWidthInches;
  const verticalDpi = pixelHeight / printHeightInches;
  const effectiveDpi = Math.min(horizontalDpi, verticalDpi); // Use the lower value (limiting factor)
  
  return { horizontalDpi, verticalDpi, effectiveDpi };
}

/**
 * Format DPI validation result for display in UI
 */
export function formatDpiValidationForDisplay(result: DpiValidationResult): {
  title: string;
  details: string[];
  status: 'success' | 'warning' | 'error';
  badge: string;
} {
  const status = result.isValid ? 'success' : result.kdpCompatible ? 'warning' : 'error';
  const badge = result.isValid 
    ? `✓ ${result.targetDpi} DPI Ready` 
    : `⚠ Below ${result.targetDpi} DPI`;
  
  const details = [
    `Pixel dimensions: ${result.pixelWidth} × ${result.pixelHeight}px`,
    `Print size at ${result.targetDpi} DPI: ${result.printableWidthInches.toFixed(2)}" × ${result.printableHeightInches.toFixed(2)}"`,
    `Print size (metric): ${result.printableWidthMm.toFixed(1)}mm × ${result.printableHeightMm.toFixed(1)}mm`,
  ];
  
  if (result.suggestion) {
    details.push(result.suggestion);
  }
  
  return {
    title: result.message,
    details,
    status,
    badge,
  };
}

/**
 * Validate image from HTML Element (for client-side use)
 */
export function validateImageElement(
  img: HTMLImageElement,
  targetDpi: number = DPI_TARGETS.PRINT_PROFESSIONAL,
  requiredWidthInches?: number,
  requiredHeightInches?: number
): DpiValidationResult {
  return validateImageDpi(
    img.naturalWidth,
    img.naturalHeight,
    targetDpi,
    requiredWidthInches,
    requiredHeightInches
  );
}

/**
 * Validate image from File object (async - loads image to get dimensions)
 */
export async function validateImageFile(
  file: File,
  targetDpi: number = DPI_TARGETS.PRINT_PROFESSIONAL,
  requiredWidthInches?: number,
  requiredHeightInches?: number
): Promise<DpiValidationResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(validateImageDpi(
        img.naturalWidth,
        img.naturalHeight,
        targetDpi,
        requiredWidthInches,
        requiredHeightInches
      ));
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for DPI validation'));
    };
    
    img.src = url;
  });
}
