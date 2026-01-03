// src/hooks/useVirtualizedPages.ts
// PURPOSE: Virtualized page rendering for large document performance
// ACTION: Only renders pages that are visible or near the viewport
// MECHANISM: IntersectionObserver + windowing logic

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PageData } from '@/types/blocks';

interface VirtualizationConfig {
  /** Number of pages to render above/below viewport */
  overscan?: number;
  /** Estimated height of each page in pixels */
  estimatedPageHeight?: number;
  /** Enable virtualization (can be disabled for small docs) */
  enabled?: boolean;
  /** Threshold for activating virtualization */
  pageThreshold?: number;
}

interface VirtualizedPage {
  page: PageData;
  index: number;
  isVisible: boolean;
  isPlaceholder: boolean;
}

interface UseVirtualizedPagesResult {
  /** Pages to render (with visibility info) */
  virtualizedPages: VirtualizedPage[];
  /** Ref to attach to the scroll container */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Current visible page index */
  currentVisiblePage: number;
  /** Total page count */
  totalPages: number;
  /** Whether virtualization is active */
  isVirtualized: boolean;
  /** Jump to a specific page */
  scrollToPage: (pageIndex: number) => void;
}

const DEFAULT_CONFIG: Required<VirtualizationConfig> = {
  overscan: 2,
  estimatedPageHeight: 800,
  enabled: true,
  pageThreshold: 10, // Activate virtualization for 10+ pages
};

export function useVirtualizedPages(
  pages: PageData[],
  config: VirtualizationConfig = {}
): UseVirtualizedPagesResult {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { overscan, estimatedPageHeight, enabled, pageThreshold } = mergedConfig;

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: Math.min(5, pages.length) });
  const [currentVisiblePage, setCurrentVisiblePage] = useState(0);

  // Determine if virtualization should be active
  const isVirtualized = enabled && pages.length >= pageThreshold;

  // Track page visibility using IntersectionObserver
  useEffect(() => {
    if (!isVirtualized || !containerRef.current) return;

    const observers = new Map<string, IntersectionObserver>();
    
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      let minVisibleIndex = Infinity;
      let maxVisibleIndex = -1;

      entries.forEach(entry => {
        const pageId = entry.target.getAttribute('data-page-id');
        const pageIndex = pages.findIndex(p => p.id === pageId);
        
        if (entry.isIntersecting && pageIndex !== -1) {
          minVisibleIndex = Math.min(minVisibleIndex, pageIndex);
          maxVisibleIndex = Math.max(maxVisibleIndex, pageIndex);
        }
      });

      if (minVisibleIndex !== Infinity) {
        setVisibleRange({
          start: Math.max(0, minVisibleIndex - overscan),
          end: Math.min(pages.length, maxVisibleIndex + overscan + 1),
        });
        setCurrentVisiblePage(minVisibleIndex);
      }
    };

    const observer = new IntersectionObserver(handleIntersection, {
      root: containerRef.current,
      rootMargin: `${estimatedPageHeight * overscan}px 0px`,
      threshold: 0.1,
    });

    // Observe all page elements
    pageRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [pages, isVirtualized, overscan, estimatedPageHeight]);

  // Register page element refs
  const registerPageRef = useCallback((pageId: string, element: HTMLElement | null) => {
    if (element) {
      pageRefs.current.set(pageId, element);
    } else {
      pageRefs.current.delete(pageId);
    }
  }, []);

  // Generate virtualized pages array
  const virtualizedPages = useMemo((): VirtualizedPage[] => {
    if (!isVirtualized) {
      // No virtualization - render all pages
      return pages.map((page, index) => ({
        page,
        index,
        isVisible: true,
        isPlaceholder: false,
      }));
    }

    // Virtualized rendering
    return pages.map((page, index) => {
      const isInRange = index >= visibleRange.start && index < visibleRange.end;
      
      return {
        page,
        index,
        isVisible: isInRange,
        isPlaceholder: !isInRange,
      };
    });
  }, [pages, isVirtualized, visibleRange]);

  // Scroll to a specific page
  const scrollToPage = useCallback((pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= pages.length) return;
    
    const pageId = pages[pageIndex].id;
    const element = pageRefs.current.get(pageId);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Page not rendered yet - expand range and scroll after render
      setVisibleRange({
        start: Math.max(0, pageIndex - overscan),
        end: Math.min(pages.length, pageIndex + overscan + 1),
      });
      
      // Wait for render, then scroll
      requestAnimationFrame(() => {
        const el = pageRefs.current.get(pageId);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [pages, overscan]);

  return {
    virtualizedPages,
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    currentVisiblePage,
    totalPages: pages.length,
    isVirtualized,
    scrollToPage,
  };
}

// Placeholder component for off-screen pages
export function PagePlaceholder({ 
  pageNumber, 
  estimatedHeight = 800 
}: { 
  pageNumber: number; 
  estimatedHeight?: number;
}) {
  return (
    <div 
      className="bg-muted/5 rounded-lg border-2 border-dashed border-muted/20 flex items-center justify-center transition-opacity"
      style={{ height: estimatedHeight }}
      role="presentation"
      aria-hidden="true"
    >
      <div className="text-muted-foreground/40 text-sm font-medium">
        Page {pageNumber}
      </div>
    </div>
  );
}
