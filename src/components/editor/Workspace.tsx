// src/components/editor/Workspace.tsx
// PURPOSE: Main editor workspace with virtualized page rendering
// ACTION: Renders the book canvas with performance optimization for large documents
// MECHANISM: Uses IntersectionObserver-based virtualization for pages

"use client";

import { useProjectStore, getEffectiveDirection } from '@/lib/store/projectStore';
import { useProjectSync } from '@/hooks/useProjectSync';
import { useVirtualizedPages, PagePlaceholder } from '@/hooks/useVirtualizedPages';
import PageRenderer from './PageRenderer';
import { Loader2, CloudCheck, AlertCircle, PlusCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { AnnotationLayer } from './annotations/AnnotationLayer';
import { OnboardingTour } from '../onboarding/OnboardingTour';
import { CommandPalette } from '../CommandPalette';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { FontLoader } from './FontLoader';
import { useCallback, useRef } from 'react';

interface WorkspaceProps {
  projectId: string;
}

export default function Workspace({ projectId }: WorkspaceProps) {
  const { syncStatus } = useProjectSync(projectId);
  const { content, addPage, settings } = useProjectStore();
  const direction = useProjectStore((state) => getEffectiveDirection(state));
  const t = useTranslations('Studio');
  
  useKeyboardShortcuts();

  // Virtualization for large documents
  const {
    virtualizedPages,
    containerRef,
    currentVisiblePage,
    totalPages,
    isVirtualized,
    scrollToPage,
  } = useVirtualizedPages(content.pages, {
    enabled: true,
    pageThreshold: 8, // Activate for 8+ pages
    overscan: 2,
    estimatedPageHeight: settings.pageHeight * 3.78, // mm to px approx
  });

  // Quick navigation handlers
  const handlePrevPage = useCallback(() => {
    if (currentVisiblePage > 0) {
      scrollToPage(currentVisiblePage - 1);
    }
  }, [currentVisiblePage, scrollToPage]);

  const handleNextPage = useCallback(() => {
    if (currentVisiblePage < totalPages - 1) {
      scrollToPage(currentVisiblePage + 1);
    }
  }, [currentVisiblePage, totalPages, scrollToPage]);

  if (syncStatus.status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center h-full" role="status" aria-live="polite">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" aria-hidden="true" />
          <p className="text-muted-foreground animate-pulse">{t('enteringStudio')}</p>
        </div>
      </div>
    );
  }

  if (syncStatus.status === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center h-full" role="alert">
        <div className="text-center space-y-4 max-w-md p-6 border-2 border-destructive/20 rounded-xl bg-destructive/5">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" aria-hidden="true" />
          <h2 className="text-xl font-bold">{t('failedToLoadProject')}</h2>
          <p className="text-muted-foreground">{syncStatus.error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm"
          >
            {t('retryConnection')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      dir={direction}
      className="flex-1 relative bg-neutral-100 dark:bg-neutral-900 overflow-auto scroll-smooth h-full transition-colors duration-500"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)`,
        backgroundSize: '40px 40px',
      }}
      role="main"
      aria-label="Book editor workspace"
    >
      <FontLoader />
      <OnboardingTour context="editor" />
      <CommandPalette />
      
      {/* Top Floating Status Indicator */}
      <div className="sticky top-4 z-50 flex justify-center pointer-events-none">
        <div className={cn(
          "px-4 py-2 rounded-full border bg-background/80 backdrop-blur-md shadow-lg flex items-center gap-2 text-sm transition-all pointer-events-auto",
          syncStatus.status === 'saving' && "border-primary/50 text-primary",
          syncStatus.status === 'saved' && "border-green-500/20 text-green-600"
        )}
        role="status"
        aria-live="polite"
        >
          {syncStatus.status === 'saving' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
              <span>{t('saving')}</span>
            </>
          )}
          {syncStatus.status === 'saved' && (
            <>
              <CloudCheck className="h-4 w-4 text-green-500" aria-hidden="true" />
              <span>{t('saved')}</span>
            </>
          )}
        </div>
      </div>

      {/* Page Navigation (for virtualized large documents) */}
      {isVirtualized && totalPages > 5 && (
        <nav 
          className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 bg-background/90 backdrop-blur-sm rounded-lg border shadow-lg p-2"
          aria-label="Page navigation"
        >
          <button
            onClick={handlePrevPage}
            disabled={currentVisiblePage === 0}
            className="p-2 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          
          <div className="text-center text-xs text-muted-foreground font-medium py-1">
            <span className="font-bold text-foreground">{currentVisiblePage + 1}</span>
            <span className="mx-0.5">/</span>
            <span>{totalPages}</span>
          </div>
          
          <button
            onClick={handleNextPage}
            disabled={currentVisiblePage >= totalPages - 1}
            className="p-2 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          
          {/* Quick Jump */}
          <div className="border-t pt-2 mt-1">
            <select
              value={currentVisiblePage}
              onChange={(e) => scrollToPage(Number(e.target.value))}
              className="w-full text-xs bg-muted/50 border-0 rounded px-1 py-1 text-center"
              aria-label="Jump to page"
            >
              {Array.from({ length: totalPages }, (_, i) => (
                <option key={i} value={i}>
                  Page {i + 1}
                </option>
              ))}
            </select>
          </div>
        </nav>
      )}

      {/* The Actual Canvas */}
      <div className="p-12 pb-32">
        <div 
          id="editor-workspace" 
          className="max-w-[1000px] mx-auto space-y-12 relative min-h-screen"
          role="region"
          aria-label="Document pages"
        >
          <AnnotationLayer />
          
          {virtualizedPages.map(({ page, index, isPlaceholder }) => (
            <div 
              key={page.id}
              data-page-id={page.id}
              data-page-index={index}
            >
              {isPlaceholder ? (
                <PagePlaceholder 
                  pageNumber={index + 1} 
                  estimatedHeight={settings.pageHeight * 3.78}
                />
              ) : (
                <PageRenderer 
                  page={page} 
                  pageIndex={index} 
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contextual Add Page / Footer */}
      <div className="h-64 flex flex-col items-center justify-center gap-6">
        <button 
          onClick={() => addPage()}
          className="group flex flex-col items-center gap-3 transition-all"
          aria-label={t('addPage')}
        >
          <div className="h-12 w-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 group-hover:scale-110 transition-all">
            <PlusCircle className="h-6 w-6 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
          </div>
          <span className="text-sm font-medium text-muted-foreground group-hover:text-primary">{t('addPage')}</span>
        </button>

        <div className="text-xs text-muted-foreground italic flex flex-col items-center gap-2 mt-8" aria-hidden="true">
          <div className="w-1 h-8 bg-muted rounded-full" />
          <span>{t('ready')}</span>
        </div>
      </div>
      
      {/* Skip to content link for accessibility */}
      <a 
        href="#editor-workspace" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to editor content
      </a>
    </div>
  );
}
