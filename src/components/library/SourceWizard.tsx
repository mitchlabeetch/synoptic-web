// src/components/library/SourceWizard.tsx
// PURPOSE: Dynamic configuration form for each source type
// ACTION: Renders appropriate inputs based on tile capabilities
// MECHANISM: Conditional form sections with live preview

'use client';

import { memo, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  Dice5, 
  BookOpen, 
  Calendar,
  Loader2,
  Eye,
} from 'lucide-react';
import { LibraryTile, WizardConfig, IngestedContent } from '@/services/library/types';
import { BIBLE_BOOKS, BIBLE_CHAPTERS } from '@/services/library/adapters';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface SourceWizardProps {
  tile: LibraryTile;
  config: WizardConfig;
  onConfigChange: (config: WizardConfig) => void;
  onPreview?: () => void;
  previewContent?: Partial<IngestedContent> | null;
  previewLoading?: boolean;
}

export const SourceWizard = memo(function SourceWizard({
  tile,
  config,
  onConfigChange,
  onPreview,
  previewContent,
  previewLoading,
}: SourceWizardProps) {
  const { capabilities, sourceId } = tile;
  const t = useTranslations('Library.wizard');

  // Update config helper
  const updateConfig = (updates: Partial<WizardConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* Search-based Sources */}
      {capabilities.supportsSearch && (
        <div className="space-y-3">
          <Label htmlFor="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            {t('search')}
          </Label>
          <div className="flex gap-2">
            <Input
              id="search"
              placeholder={getSearchPlaceholder(sourceId)}
              value={config.searchQuery || ''}
              onChange={(e) => updateConfig({ searchQuery: e.target.value })}
              className="flex-grow"
            />
            {onPreview && (
              <Button 
                variant="outline" 
                onClick={onPreview}
                disabled={previewLoading || !config.searchQuery}
              >
                {previewLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Reference-based Sources (Bible, Quran, etc.) */}
      {capabilities.supportsReference && sourceId.includes('bible') && (
        <BibleReferenceSelector
          book={config.book}
          chapter={config.chapter as number}
          onBookChange={(book) => updateConfig({ book })}
          onChapterChange={(chapter) => updateConfig({ chapter })}
        />
      )}

      {/* Generic Reference Picker */}
      {capabilities.supportsReference && !sourceId.includes('bible') && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Book/Section</Label>
            <Input
              placeholder="Enter reference..."
              value={config.book || ''}
              onChange={(e) => updateConfig({ book: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Chapter/Verse</Label>
            <Input
              placeholder="e.g., 1:1-10"
              value={config.chapter?.toString() || ''}
              onChange={(e) => updateConfig({ chapter: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Date-based Sources (Newspapers, NASA APOD) */}
      {capabilities.supportsDateRange && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Select Date
          </Label>
          <Input
            type="date"
            value={config.date?.toString() || ''}
            onChange={(e) => updateConfig({ date: e.target.value })}
            max={new Date().toISOString().split('T')[0]}
          />
          <p className="text-xs text-muted-foreground">
            Tip: Try dates from 100 years ago for historical newspapers
          </p>
        </div>
      )}

      {/* Random Mode */}
      {capabilities.supportsRandom && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Dice5 className="w-4 h-4" />
            Random Count
          </Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[config.randomCount || 5]}
              onValueChange={([val]) => updateConfig({ randomCount: val })}
              min={1}
              max={20}
              step={1}
              className="flex-grow"
            />
            <span className="text-sm font-mono w-8 text-center">
              {config.randomCount || 5}
            </span>
          </div>
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={() => {
              updateConfig({ randomCount: config.randomCount || 5 });
              onPreview?.();
            }}
          >
            <Dice5 className="w-4 h-4" />
            {t('randomize')}
          </Button>
        </div>
      )}

      {/* Import Range (for books) */}
      {tile.layout === 'book' && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Import Range
          </Label>
          <Select
            value={config.importRange || 'chapters'}
            onValueChange={(val) => updateConfig({ importRange: val as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chapters">{t('selectedChapters')}</SelectItem>
              <SelectItem value="full">{t('fullBook')}</SelectItem>
              <SelectItem value="custom">{t('customRange')}</SelectItem>
            </SelectContent>
          </Select>

          {config.importRange === 'chapters' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t('startChapter')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={config.startChapter || 1}
                  onChange={(e) => updateConfig({ startChapter: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('endChapter')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={config.endChapter || 3}
                  onChange={(e) => updateConfig({ endChapter: parseInt(e.target.value) })}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Panel */}
      {previewContent && (
        <PreviewPanel content={previewContent} />
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════
// BIBLE REFERENCE SELECTOR
// ═══════════════════════════════════════════════════════════════════

interface BibleReferenceSelectorProps {
  book?: string;
  chapter?: number;
  onBookChange: (book: string) => void;
  onChapterChange: (chapter: number) => void;
}

function BibleReferenceSelector({
  book = 'John',
  chapter = 1,
  onBookChange,
  onChapterChange,
}: BibleReferenceSelectorProps) {
  const maxChapters = BIBLE_CHAPTERS[book] || 1;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Book</Label>
        <Select value={book} onValueChange={onBookChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {BIBLE_BOOKS.map(b => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Chapter (1–{maxChapters})</Label>
        <div className="flex items-center gap-4">
          <Slider
            value={[chapter]}
            onValueChange={([val]) => onChapterChange(val)}
            min={1}
            max={maxChapters}
            step={1}
            className="flex-grow"
          />
          <Input
            type="number"
            min={1}
            max={maxChapters}
            value={chapter}
            onChange={(e) => onChapterChange(parseInt(e.target.value) || 1)}
            className="w-20 text-center"
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREVIEW PANEL
// ═══════════════════════════════════════════════════════════════════

function PreviewPanel({ content }: { content: Partial<IngestedContent> }) {
  const firstPage = content.pages?.[0];
  const lines = firstPage?.lines?.slice(0, 5) || [];

  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
        <Eye className="w-4 h-4" />
        Preview
      </h4>
      
      {content.title && (
        <p className="font-bold mb-2">{content.title}</p>
      )}
      
      <div className="space-y-2 text-sm">
        {lines.map((line, i) => (
          <div key={line.id || i} className={cn(
            line.type === 'heading' && 'font-bold',
            line.type === 'separator' && 'border-t my-2'
          )}>
            {line.type === 'separator' ? null : line.L1}
          </div>
        ))}
        
        {lines.length > 0 && content.pages && content.pages[0].lines.length > 5 && (
          <p className="text-muted-foreground italic">
            ... and {content.pages[0].lines.length - 5} more lines
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function getSearchPlaceholder(sourceId: string): string {
  switch (sourceId) {
    case 'gutendex':
      return 'Search books by title or author...';
    case 'poetrydb':
      return 'Search by poet name or poem title...';
    case 'met-museum':
      return 'Search artworks, artists, periods...';
    case 'tatoeba':
      return 'Enter a word or phrase...';
    default:
      return 'Search...';
  }
}
