// src/components/dashboard/LibraryImportHandler.tsx
// PURPOSE: Handle library imports from URL params or sessionStorage
// ACTION: Detects ?import=library or ?source=... and creates project with content
// MECHANISM: Reads sessionStorage/URL, calls ingest API, creates project

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertTriangle, BookOpen, ArrowRight } from 'lucide-react';
import { getTileById } from '@/services/library/registry';
import { SourceWizard } from '@/components/library/SourceWizard';
import { LibraryTile, WizardConfig, IngestedContent } from '@/services/library/types';
import { getAdapter } from '@/services/library/adapters';
import { usePendingImport } from '@/lib/hooks/usePendingImport';
import { cn } from '@/lib/utils';

type ImportStep = 'configure' | 'importing' | 'creating' | 'done' | 'error';

interface LibraryImportHandlerProps {
  onProjectCreated?: (projectId: string) => void;
}

export function LibraryImportHandler({ onProjectCreated }: LibraryImportHandlerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pendingImport, clearPendingImport } = usePendingImport();
  
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>('configure');
  const [tile, setTile] = useState<LibraryTile | null>(null);
  const [config, setConfig] = useState<WizardConfig>({});
  const [content, setContent] = useState<IngestedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Check for import params on mount
  useEffect(() => {
    const importType = searchParams.get('import');
    const sourceId = searchParams.get('source');
    const tileId = searchParams.get('tileId');

    // Handle ?import=library (from LibraryPageClient sessionStorage)
    if (importType === 'library') {
      try {
        const stored = sessionStorage.getItem('library-import');
        if (stored) {
          const { tile: storedTileId, content: storedContent } = JSON.parse(stored);
          const foundTile = getTileById(storedTileId);
          if (foundTile && storedContent) {
            setTile(foundTile);
            setContent(storedContent);
            setStep('creating');
            setIsOpen(true);
            sessionStorage.removeItem('library-import');
            return;
          }
        }
      } catch (e) {
        console.error('Failed to parse library import:', e);
      }
    }

    // Handle ?source=...&tileId=... (from direct link or auth redirect)
    if (sourceId || tileId) {
      const id = tileId || sourceId;
      const foundTile = getTileById(id!);
      if (foundTile) {
        setTile(foundTile);
        setStep('configure');
        setIsOpen(true);
        
        // Check for pending import config
        if (pendingImport && pendingImport.tileId === id) {
          setConfig(pendingImport.config);
          clearPendingImport();
        }
      }
    }
  }, [searchParams, pendingImport, clearPendingImport]);

  // Create project from content
  useEffect(() => {
    if (step === 'creating' && content && tile) {
      createProject();
    }
  }, [step, content, tile]);

  // Fetch content from adapter
  const handleImport = useCallback(async () => {
    if (!tile) return;

    const adapter = getAdapter(tile.sourceId);
    if (!adapter) {
      setError('Adapter not available');
      setStep('error');
      return;
    }

    setStep('importing');
    setError(null);

    try {
      const fetchedContent = await adapter.fetch(config);
      setContent(fetchedContent);
      setStep('creating');
    } catch (e) {
      setError((e as Error).message);
      setStep('error');
    }
  }, [tile, config]);

  // Create project with content
  const createProject = useCallback(async () => {
    if (!content || !tile) return;

    try {
      // Transform content to pages
      const pages = content.pages.map((page, pageIdx) => ({
        id: page.id || `page-${Date.now()}-${pageIdx}`,
        number: page.number || pageIdx + 1,
        isBlankPage: false,
        isChapterStart: pageIdx === 0,
        blocks: page.lines.map((line, lineIdx) => {
          if (line.type === 'heading') {
            return {
              id: line.id || `block-${Date.now()}-${lineIdx}`,
              type: 'text',
              sourceContent: `<h2>${line.L1}</h2>`,
              targetContent: line.L2 ? `<h2>${line.L2}</h2>` : '',
              meta: line.meta,
            };
          }
          if (line.type === 'image' && line.meta?.imageUrl) {
            return {
              id: line.id || `block-${Date.now()}-${lineIdx}`,
              type: 'image',
              sourceContent: line.L1 || '',
              targetContent: line.L2 || '',
              imageUrl: line.meta.imageUrl,
              thumbnailUrl: line.meta.thumbnailUrl,
              meta: line.meta,
            };
          }
          return {
            id: line.id || `block-${Date.now()}-${lineIdx}`,
            type: 'text',
            sourceContent: `<p>${line.L1}</p>`,
            targetContent: line.L2 ? `<p>${line.L2}</p>` : '',
            meta: line.meta,
          };
        }),
      }));

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: content.title || `${tile.title} Import`,
          source_lang: content.sourceLang || 'en',
          target_lang: content.targetLang || 'fr',
          content: {
            pages,
            wordGroups: [],
            arrows: [],
            stamps: [],
          },
          settings: {
            theme: 'classic',
            pageSize: '6x9',
            pageWidth: 152,
            pageHeight: 229,
            layout: content.layout || 'side-by-side',
            direction: 'auto',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const { project } = await response.json();
      setProjectId(project.id);
      setStep('done');

      // Notify parent
      if (onProjectCreated) {
        onProjectCreated(project.id);
      }

      // Clear URL params
      router.replace('/dashboard', { scroll: false });

      // Auto-navigate to editor after brief delay
      setTimeout(() => {
        router.push(`/editor/${project.id}`);
      }, 1500);

    } catch (e) {
      setError((e as Error).message);
      setStep('error');
    }
  }, [content, tile, router, onProjectCreated]);

  // Handle close
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTile(null);
    setContent(null);
    setConfig({});
    setStep('configure');
    setError(null);
    router.replace('/dashboard', { scroll: false });
  }, [router]);

  if (!tile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center text-lg',
              tile.tileColor
            )}>
              📚
            </div>
            <div>
              <div>Import: {tile.title}</div>
              <div className="text-sm font-normal text-muted-foreground">{tile.subtitle}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {step === 'configure' && (
            <div className="space-y-6">
              <SourceWizard
                tile={tile}
                config={config}
                onConfigChange={setConfig}
              />
              
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleImport} className="gap-2">
                  Import Content
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Fetching content from {tile.sourceName}...</p>
            </div>
          )}

          {step === 'creating' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Creating your project...</p>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">Project Created!</h3>
                <p className="text-muted-foreground">Opening editor...</p>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">Import Failed</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={() => setStep('configure')}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
