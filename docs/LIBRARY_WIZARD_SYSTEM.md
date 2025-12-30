# SYNOPTIC LIBRARY - Wizard System Implementation

> The Wizard is the bridge between "Inspiration" (the Tile Grid) and "Creation" (the Editor).
> It must adapt dynamically based on the Source's capabilities.

---

## Table of Contents

1. [Wizard Architecture](#wizard-architecture)
2. [Wizard State Machine](#wizard-state-machine)
3. [Dynamic Form Generation](#dynamic-form-generation)
4. [Source-Specific Wizard Flows](#source-specific-flows)
5. [Integration with Project Creation](#project-creation-integration)

---

## Wizard Architecture

The wizard is a **polymorphic configuration tool** that renders different UI based on the selected source's `capabilities` flags.

```
┌─────────────────────────────────────────────────────────────────┐
│                    WIZARD STATE MACHINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [IDLE] ──click tile──▶ [PREVIEW] ──start──▶ [CONFIGURE]        │
│                              │                      │            │
│                              │                      ▼            │
│                              │              [FETCH_CONTENT]      │
│                              │                      │            │
│                              │                      ▼            │
│                              │              [CREATE_PROJECT]     │
│                              │                      │            │
│                              └──close──◀────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Types

### File: `src/services/library/wizard-types.ts`

```typescript
// Wizard state type
export type WizardStep =
  | 'preview' // Show tile details + CTA
  | 'configure' // Source-specific configuration
  | 'loading' // Fetching content
  | 'confirm' // Preview ingested content
  | 'creating'; // Creating project

// Configuration form state
export interface WizardConfig {
  // Reference-based sources (Bible, Quran, Gita)
  book?: string;
  chapter?: string;
  verse?: string;

  // Search-based sources (Gutendex, Met Museum)
  searchQuery?: string;
  selectedId?: string | number;

  // Range-based sources (Novels)
  importRange?: 'full' | 'chapters' | 'custom';
  startChapter?: number;
  endChapter?: number;

  // Date-based sources (Chronicling America)
  date?: Date;

  // Random mode (Facts, Quotes)
  randomCount?: number;

  // Layout preferences
  targetLayout?: string;

  // Utility toggles
  enableDictionary?: boolean;
  enableGrammarCheck?: boolean;
  enableAITranslate?: boolean;
}

// Wizard component props
export interface SourceWizardProps {
  tileId: string;
  sourceId: string;
  capabilities: SourceCapabilities;
  onConfigComplete: (config: WizardConfig) => void;
  onBack: () => void;
}
```

---

## Wizard State Machine

### File: `src/hooks/useLibraryWizard.ts`

```typescript
import { useState, useCallback } from 'react';
import {
  LibraryTile,
  WizardConfig,
  WizardStep,
} from '@/services/library/types';

export function useLibraryWizard() {
  const [step, setStep] = useState<WizardStep>('preview');
  const [selectedTile, setSelectedTile] = useState<LibraryTile | null>(null);
  const [config, setConfig] = useState<WizardConfig>({});
  const [ingestedContent, setIngestedContent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 1: User clicks a tile
  const selectTile = useCallback((tile: LibraryTile) => {
    setSelectedTile(tile);
    setStep('preview');
    setConfig({});
    setError(null);
  }, []);

  // Step 2: User clicks "Start Project"
  const startConfiguration = useCallback(() => {
    if (!selectedTile) return;

    // Skip configuration for random sources
    if (
      selectedTile.capabilities.supportsRandom &&
      !selectedTile.capabilities.supportsSearch &&
      !selectedTile.capabilities.supportsReference
    ) {
      // Directly fetch random content
      fetchContent({ randomCount: 1 });
    } else {
      setStep('configure');
    }
  }, [selectedTile]);

  // Step 3: Configuration complete, fetch content
  const fetchContent = useCallback(
    async (finalConfig: WizardConfig) => {
      if (!selectedTile) return;

      setStep('loading');
      setConfig(finalConfig);

      try {
        const response = await fetch('/api/library/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId: selectedTile.sourceId,
            config: finalConfig,
            layout: selectedTile.layout,
          }),
        });

        if (!response.ok) throw new Error('Ingestion failed');

        const data = await response.json();
        setIngestedContent(data);
        setStep('confirm');
      } catch (e) {
        setError((e as Error).message);
        setStep('configure');
      }
    },
    [selectedTile]
  );

  // Step 4: Confirm and create project
  const createProject = useCallback(async () => {
    if (!selectedTile || !ingestedContent) return;

    setStep('creating');

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ingestedContent.title,
          source_lang: ingestedContent.sourceLang,
          target_lang: ingestedContent.targetLang || 'en',
          content: {
            pages: ingestedContent.pages,
            wordGroups: [],
            arrows: [],
            stamps: [],
          },
          settings: {
            theme: 'classic',
            layout: selectedTile.layout,
            // ... other settings from ingestedContent.meta
          },
          library_source: {
            tileId: selectedTile.id,
            sourceId: selectedTile.sourceId,
            config: config,
          },
        }),
      });

      if (!response.ok) throw new Error('Project creation failed');

      const { project } = await response.json();
      // Redirect handled by parent component
      return project;
    } catch (e) {
      setError((e as Error).message);
      setStep('confirm');
    }
  }, [selectedTile, ingestedContent, config]);

  // Reset wizard
  const close = useCallback(() => {
    setSelectedTile(null);
    setStep('preview');
    setConfig({});
    setIngestedContent(null);
    setError(null);
  }, []);

  return {
    step,
    selectedTile,
    config,
    ingestedContent,
    error,
    selectTile,
    startConfiguration,
    fetchContent,
    createProject,
    close,
    setStep,
  };
}
```

---

## Dynamic Form Generation

### File: `src/components/library/SourceWizard.tsx`

This component renders different form fields based on source capabilities.

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, Search, Shuffle, ChevronRight } from 'lucide-react';
import { SourceCapabilities, WizardConfig } from '@/services/library/types';

interface SourceWizardProps {
  sourceId: string;
  capabilities: SourceCapabilities;
  onConfigComplete: (config: WizardConfig) => void;
  onBack: () => void;
}

export function SourceWizard({
  sourceId,
  capabilities,
  onConfigComplete,
  onBack,
}: SourceWizardProps) {
  const [config, setConfig] = useState<WizardConfig>({});
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ═══════════════════════════════════════════
  // STRATEGY 1: REFERENCE-BASED (Bible, Quran, Gita)
  // ═══════════════════════════════════════════
  if (capabilities.supportsReference) {
    return (
      <ReferenceWizard
        sourceId={sourceId}
        onConfigComplete={onConfigComplete}
        onBack={onBack}
      />
    );
  }

  // ═══════════════════════════════════════════
  // STRATEGY 2: SEARCH-BASED (Gutendex, Met Museum)
  // ═══════════════════════════════════════════
  if (capabilities.supportsSearch) {
    return (
      <SearchWizard
        sourceId={sourceId}
        hasVisuals={capabilities.hasVisuals}
        onConfigComplete={onConfigComplete}
        onBack={onBack}
      />
    );
  }

  // ═══════════════════════════════════════════
  // STRATEGY 3: DATE-BASED (Chronicling America)
  // ═══════════════════════════════════════════
  if (capabilities.supportsDateRange) {
    return (
      <DateWizard
        sourceId={sourceId}
        onConfigComplete={onConfigComplete}
        onBack={onBack}
      />
    );
  }

  // ═══════════════════════════════════════════
  // STRATEGY 4: RANDOM/SURPRISE (Facts, Quotes)
  // ═══════════════════════════════════════════
  return (
    <div className="text-center py-12 space-y-6">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <Shuffle className="w-10 h-10 text-primary" />
      </div>
      <div>
        <h3 className="text-xl font-bold">Ready for a Surprise?</h3>
        <p className="text-muted-foreground mt-2">
          We'll fetch a curated random selection for you.
        </p>
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          size="lg"
          onClick={() => onConfigComplete({ randomCount: 1 })}
          className="gap-2"
        >
          <Shuffle className="w-4 h-4" />
          Surprise Me!
        </Button>
      </div>
    </div>
  );
}
```

---

## Source-Specific Wizard Components

### Reference Wizard (Bible, Quran, Gita)

```typescript
// src/components/library/wizards/ReferenceWizard.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ChevronRight } from 'lucide-react';

// Bible books metadata
const BIBLE_BOOKS = {
  oldTestament: [
    'Genesis',
    'Exodus',
    'Leviticus',
    'Numbers',
    'Deuteronomy' /* ... */,
  ],
  newTestament: ['Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans' /* ... */],
};

// Quran surahs metadata
const QURAN_SURAHS = [
  { number: 1, name: 'Al-Fatiha', ayahs: 7 },
  { number: 2, name: 'Al-Baqarah', ayahs: 286 },
  // ... 114 surahs
];

// Gita chapters metadata
const GITA_CHAPTERS = [
  { number: 1, name: 'Arjuna Vishada Yoga', verses: 47 },
  { number: 2, name: 'Sankhya Yoga', verses: 72 },
  // ... 18 chapters
];

interface ReferenceWizardProps {
  sourceId: string;
  onConfigComplete: (config: any) => void;
  onBack: () => void;
}

export function ReferenceWizard({
  sourceId,
  onConfigComplete,
  onBack,
}: ReferenceWizardProps) {
  const [book, setBook] = useState('');
  const [chapter, setChapter] = useState('');
  const [importRange, setImportRange] = useState<'chapter' | 'full'>('chapter');

  // Get available options based on source
  const getOptions = () => {
    switch (sourceId) {
      case 'bible-api':
        return {
          label: 'Book',
          options: [...BIBLE_BOOKS.oldTestament, ...BIBLE_BOOKS.newTestament],
          hasChapters: true,
        };
      case 'alquran':
        return {
          label: 'Surah',
          options: QURAN_SURAHS.map((s) => `${s.number}. ${s.name}`),
          hasChapters: false, // Surahs don't have "chapters"
        };
      case 'gita-api':
        return {
          label: 'Chapter',
          options: GITA_CHAPTERS.map((c) => `${c.number}. ${c.name}`),
          hasChapters: false,
        };
      default:
        return { label: 'Section', options: [], hasChapters: true };
    }
  };

  const options = getOptions();

  const handleSubmit = () => {
    onConfigComplete({
      book,
      chapter: options.hasChapters ? chapter : undefined,
      importRange,
    });
  };

  const canSubmit = book && (!options.hasChapters || chapter);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">{options.label}</Label>
          <Select value={book} onValueChange={setBook}>
            <SelectTrigger className="mt-2 h-12">
              <SelectValue
                placeholder={`Select ${options.label.toLowerCase()}...`}
              />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {options.options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {options.hasChapters && book && (
          <div>
            <Label className="text-base font-semibold">Chapter</Label>
            <Select value={chapter} onValueChange={setChapter}>
              <SelectTrigger className="mt-2 h-12">
                <SelectValue placeholder="Select chapter..." />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {Array.from({ length: 50 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    Chapter {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Import Range Options */}
        <div className="p-4 bg-muted/30 rounded-xl border border-dashed">
          <Label className="text-sm font-semibold">Import Range</Label>
          <div className="flex gap-4 mt-3">
            <Button
              variant={importRange === 'chapter' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImportRange('chapter')}
            >
              Single Chapter
            </Button>
            <Button
              variant={importRange === 'full' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImportRange('full')}
            >
              Full Book
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button disabled={!canSubmit} onClick={handleSubmit} className="gap-2">
          Load Content
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
```

### Search Wizard (Gutendex, Met Museum)

```typescript
// src/components/library/wizards/SearchWizard.tsx

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ChevronRight } from 'lucide-react';
import { debounce } from '@/lib/utils';

interface SearchWizardProps {
  sourceId: string;
  hasVisuals: boolean;
  onConfigComplete: (config: any) => void;
  onBack: () => void;
}

export function SearchWizard({
  sourceId,
  hasVisuals,
  onConfigComplete,
  onBack,
}: SearchWizardProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);

      try {
        const response = await fetch(
          `/api/library/search?source=${sourceId}&q=${encodeURIComponent(
            searchQuery
          )}`
        );
        const data = await response.json();
        setResults(data.results || []);
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [sourceId]
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    performSearch(value);
  };

  const handleSelect = (item: any) => {
    setSelectedItem(item);
  };

  const handleSubmit = () => {
    if (!selectedItem) return;
    onConfigComplete({
      selectedId: selectedItem.id,
      searchQuery: query,
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search by title, author, or topic..."
          className="pl-10 h-12"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results Grid */}
      <div className="max-h-[350px] overflow-y-auto space-y-2">
        {results.length === 0 && query.length > 0 && !isSearching && (
          <p className="text-center text-muted-foreground py-8">
            No results found. Try a different search term.
          </p>
        )}

        {results.map((item) => (
          <div
            key={item.id}
            onClick={() => handleSelect(item)}
            className={`
              p-3 rounded-xl border cursor-pointer transition-all flex gap-4 items-center
              ${
                selectedItem?.id === item.id
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }
            `}
          >
            {/* Thumbnail (if visual source) */}
            {hasVisuals && item.thumbnail && (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-16 h-20 object-cover rounded"
              />
            )}

            {/* Text Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold truncate">{item.title}</h4>
              <p className="text-sm text-muted-foreground truncate">
                {item.subtitle || item.author || item.artist}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button
          disabled={!selectedItem}
          onClick={handleSubmit}
          className="gap-2"
        >
          Select & Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
```

---

## Date Wizard (Historical Sources)

```typescript
// src/components/library/wizards/DateWizard.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { History, ChevronRight } from 'lucide-react';

interface DateWizardProps {
  sourceId: string;
  onConfigComplete: (config: any) => void;
  onBack: () => void;
}

export function DateWizard({
  sourceId,
  onConfigComplete,
  onBack,
}: DateWizardProps) {
  // Default to 100 years ago today
  const defaultDate = new Date();
  defaultDate.setFullYear(defaultDate.getFullYear() - 100);

  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate);

  const handleSubmit = () => {
    onConfigComplete({ date: selectedDate });
  };

  // Calculate "on this day" message
  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <History className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold">Select a Date in History</h3>
        <p className="text-muted-foreground mt-2">
          We'll fetch newspaper headlines from that day.
        </p>
      </div>

      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          disabled={(date) => {
            // Only allow dates between 1850 and 1963 (LOC coverage)
            const year = date.getFullYear();
            return year < 1850 || year > 1963;
          }}
          defaultMonth={defaultDate}
          className="rounded-xl border"
        />
      </div>

      <div className="text-center p-4 bg-muted/30 rounded-xl">
        <p className="text-sm font-medium">{formattedDate}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Headlines from this day will be imported
        </p>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSubmit} className="gap-2">
          Load Headlines
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
```

---

## Integration with Project Creation

### File: `src/components/library/LibraryModal.tsx`

The main modal that orchestrates the entire wizard flow.

```typescript
'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLibraryWizard } from '@/hooks/useLibraryWizard';
import { SourceWizard } from './SourceWizard';
import { Loader2, BookOpen, Sparkles } from 'lucide-react';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tile: LibraryTile | null;
  isLoggedIn: boolean;
}

export function LibraryModal({
  isOpen,
  onClose,
  tile,
  isLoggedIn,
}: LibraryModalProps) {
  const router = useRouter();
  const wizard = useLibraryWizard();

  if (!tile) return null;

  // Handle not logged in
  const handleStartWithoutAuth = () => {
    // Serialize tile selection as URL params
    const params = new URLSearchParams({
      intent: 'import',
      source: tile.sourceId,
      tile: tile.id,
    }).toString();
    router.push(`/auth/signup?redirect=/dashboard?${params}`);
  };

  // Handle project creation success
  const handleProjectCreated = async () => {
    const project = await wizard.createProject();
    if (project) {
      onClose();
      router.push(`/editor/${project.id}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Header with cover image */}
        <div
          className="h-48 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${tile.coverImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <div className="flex gap-2 mb-2">
              {tile.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-white/20 border-0"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <h2 className="text-2xl font-black">{tile.title}</h2>
            <p className="text-white/80">{tile.subtitle}</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Step: Preview */}
          {wizard.step === 'preview' && (
            <div className="space-y-6">
              <p className="text-muted-foreground">
                {tile.description ||
                  'Start your translation project with this pre-formatted template. ' +
                    'Synoptic will automatically import the text and prepare the bilingual layout.'}
              </p>

              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Layout: {tile.layout}</p>
                  <p className="text-sm text-muted-foreground">
                    Difficulty: {tile.difficulty}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                {isLoggedIn ? (
                  <Button
                    size="lg"
                    className="flex-1 font-bold"
                    onClick={wizard.startConfiguration}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Project
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="flex-1 font-bold"
                    onClick={handleStartWithoutAuth}
                  >
                    Create Free Account to Start
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step: Configure */}
          {wizard.step === 'configure' && (
            <SourceWizard
              sourceId={tile.sourceId}
              capabilities={tile.capabilities}
              onConfigComplete={wizard.fetchContent}
              onBack={() => wizard.setStep('preview')}
            />
          )}

          {/* Step: Loading */}
          {wizard.step === 'loading' && (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Fetching your content...</p>
            </div>
          )}

          {/* Step: Confirm */}
          {wizard.step === 'confirm' && wizard.ingestedContent && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                <p className="font-medium text-green-800 dark:text-green-200">
                  ✓ Content loaded successfully!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {wizard.ingestedContent.pages?.[0]?.lines?.length || 0} items
                  ready to import
                </p>
              </div>

              {/* Preview of first few items */}
              <div className="max-h-[200px] overflow-y-auto space-y-2 p-4 bg-muted/20 rounded-xl">
                {wizard.ingestedContent.pages?.[0]?.lines
                  ?.slice(0, 5)
                  .map((line: any, i: number) => (
                    <p key={i} className="text-sm truncate">
                      {line.L1 || line.text}
                    </p>
                  ))}
                {(wizard.ingestedContent.pages?.[0]?.lines?.length || 0) >
                  5 && (
                  <p className="text-sm text-muted-foreground">
                    ... and {wizard.ingestedContent.pages[0].lines.length - 5}{' '}
                    more
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => wizard.setStep('configure')}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 font-bold"
                  onClick={handleProjectCreated}
                  disabled={wizard.step === 'creating'}
                >
                  {wizard.step === 'creating' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {wizard.error && (
            <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20 mt-4">
              <p className="text-sm text-destructive">{wizard.error}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Summary

The Wizard System provides:

1. **Polymorphic Configuration**: Different UIs for different source types
2. **State Machine**: Clear flow from preview → configure → fetch → confirm → create
3. **Error Handling**: Graceful recovery from API failures
4. **Auth Integration**: Redirects to signup with "intent" params for unauthenticated users
5. **Preview Before Commit**: Users see what they're importing before creating the project

---

_Proceed to: LIBRARY_ADAPTERS.md for adapter implementation details_
