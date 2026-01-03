// src/lib/hooks/useGridLockSync.ts
// PURPOSE: Dynamically equalize L1/L2 paragraph heights for CSS-perfect parallel books
// ACTION: Uses ResizeObserver to detect content height changes and synchronize row heights
// MECHANISM: Measures both language columns, applies max-height to ensure alignment

'use client';

import { useEffect, useRef, useCallback } from 'react';

interface GridLockOptions {
  /** Debounce interval in ms for resize observations */
  debounceMs?: number;
  /** CSS selector for text blocks */
  blockSelector?: string;
  /** CSS selector for L1 column within a block */
  l1Selector?: string;
  /** CSS selector for L2 column within a block */
  l2Selector?: string;
  /** Whether to enable synchronization */
  enabled?: boolean;
}

const DEFAULT_OPTIONS: Required<GridLockOptions> = {
  debounceMs: 50,
  blockSelector: '.block.side-by-side, .bilingual-block',
  l1Selector: '[lang]:first-child, .l1-col, section:first-of-type',
  l2Selector: '[lang]:last-child, .l2-col, section:last-of-type',
  enabled: true,
};

/**
 * Hook to synchronize L1/L2 column heights in bilingual book layouts.
 * Ensures that when L1 has 3 lines and L2 has 5 lines, both columns
 * expand to match the taller content, maintaining visual alignment.
 */
export function useGridLockSync(
  containerRef: React.RefObject<HTMLElement | null>,
  options: GridLockOptions = {}
) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const observerRef = useRef<ResizeObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  /**
   * Core synchronization function - measures and equalizes block heights
   */
  const synchronizeHeights = useCallback(() => {
    if (!containerRef.current || !mergedOptions.enabled) return;
    
    const blocks = containerRef.current.querySelectorAll(mergedOptions.blockSelector);
    
    blocks.forEach((block) => {
      const l1 = block.querySelector(mergedOptions.l1Selector) as HTMLElement | null;
      const l2 = block.querySelector(mergedOptions.l2Selector) as HTMLElement | null;
      
      if (!l1 || !l2) return;
      
      // Step 1: Reset heights to allow natural measurement
      l1.style.minHeight = '';
      l2.style.minHeight = '';
      
      // Step 2: Force reflow to get accurate measurements
      void l1.offsetHeight;
      void l2.offsetHeight;
      
      // Step 3: Measure natural heights
      const l1Height = l1.scrollHeight;
      const l2Height = l2.scrollHeight;
      
      // Step 4: Apply max height to both columns
      const maxHeight = Math.max(l1Height, l2Height);
      
      if (l1Height !== l2Height) {
        l1.style.minHeight = `${maxHeight}px`;
        l2.style.minHeight = `${maxHeight}px`;
      }
    });
  }, [containerRef, mergedOptions]);
  
  /**
   * Debounced synchronization to prevent excessive reflows
   */
  const debouncedSync = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      synchronizeHeights();
    }, mergedOptions.debounceMs);
  }, [synchronizeHeights, mergedOptions.debounceMs]);
  
  /**
   * Setup observers for height changes
   */
  useEffect(() => {
    if (!containerRef.current || !mergedOptions.enabled) return;
    
    const container = containerRef.current;
    
    // Initial synchronization
    synchronizeHeights();
    
    // ResizeObserver for content size changes (fonts loading, images, etc.)
    observerRef.current = new ResizeObserver((entries) => {
      // Only trigger if a relevant element changed size
      for (const entry of entries) {
        if (entry.target.closest(mergedOptions.blockSelector)) {
          debouncedSync();
          break;
        }
      }
    });
    
    // Observe the container and all blocks
    observerRef.current.observe(container);
    const blocks = container.querySelectorAll(mergedOptions.blockSelector);
    blocks.forEach((block) => {
      observerRef.current?.observe(block);
    });
    
    // MutationObserver for DOM changes (adding/removing blocks, editing content)
    mutationObserverRef.current = new MutationObserver((mutations) => {
      let shouldSync = false;
      
      for (const mutation of mutations) {
        // Check for added/removed nodes
        if (mutation.type === 'childList') {
          shouldSync = true;
          break;
        }
        // Check for character data changes (text editing)
        if (mutation.type === 'characterData') {
          shouldSync = true;
          break;
        }
        // Check for attribute changes that might affect layout
        if (mutation.type === 'attributes') {
          const target = mutation.target as HTMLElement;
          if (target.closest(mergedOptions.blockSelector)) {
            shouldSync = true;
            break;
          }
        }
      }
      
      if (shouldSync) {
        debouncedSync();
      }
    });
    
    mutationObserverRef.current.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
    
    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      observerRef.current?.disconnect();
      mutationObserverRef.current?.disconnect();
    };
  }, [containerRef, mergedOptions.enabled, synchronizeHeights, debouncedSync, mergedOptions.blockSelector]);
  
  // Re-sync on window resize
  useEffect(() => {
    if (!mergedOptions.enabled) return;
    
    const handleResize = () => debouncedSync();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [debouncedSync, mergedOptions.enabled]);
  
  // Return manual trigger for imperative use
  return {
    synchronizeHeights,
    forceSync: synchronizeHeights,
  };
}

/**
 * CSS helper to generate print-safe Grid-Lock styles
 */
export const gridLockPrintStyles = `
  @media print {
    .block.side-by-side,
    .bilingual-block {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12mm;
      page-break-inside: avoid;
    }
    
    .block.side-by-side > *,
    .bilingual-block > section {
      /* In print, CSS subgrid or manual alignment is used */
      break-inside: avoid;
    }
  }
`;

export default useGridLockSync;
