# SYNOPTIC LIBRARY - UI Components Implementation

> The Library page is a "Canva for Translators" – a visual, template-driven discovery engine.
> It uses an asymmetric "Bento Grid" layout to feel curated, not like a database dump.

---

## Table of Contents

1. [Page Structure](#page-structure)
2. [Bento Grid Component](#bento-grid)
3. [Tile Card Component](#tile-card)
4. [Search Toolbar](#search-toolbar)
5. [Preview Modal](#preview-modal)
6. [Responsive Design](#responsive)
7. [Animation & Micro-interactions](#animations)
8. [i18n Keys](#i18n)

---

## Page Structure

### File: `src/app/(marketing)/library/page.tsx`

```typescript
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { LibraryGrid } from '@/components/library/LibraryGrid';
import { SearchToolbar } from '@/components/library/SearchToolbar';
import { LibraryModal } from '@/components/library/LibraryModal';
import { LIBRARY_TILES } from '@/services/library/registry';
import { LibraryTile, TileCategory } from '@/services/library/types';
import { useAuth } from '@/hooks/useAuth';

export default function LibraryPage() {
  const t = useTranslations('Library');
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    TileCategory | 'all'
  >('all');
  const [selectedTile, setSelectedTile] = useState<LibraryTile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter tiles based on search and category
  const filteredTiles = useMemo(() => {
    let tiles = LIBRARY_TILES;

    // Category filter
    if (selectedCategory !== 'all') {
      tiles = tiles.filter((tile) => tile.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      tiles = tiles.filter(
        (tile) =>
          tile.title.toLowerCase().includes(query) ||
          tile.subtitle.toLowerCase().includes(query) ||
          tile.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return tiles;
  }, [searchQuery, selectedCategory]);

  // Handle tile click
  const handleTileClick = (tile: LibraryTile) => {
    setSelectedTile(tile);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTile(null), 300);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-black font-serif mb-6">
              {t('heroTitle')}
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              {t('heroSubtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search Toolbar (Sticky) */}
      <SearchToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Main Grid */}
      <section className="container mx-auto px-4 py-12">
        {filteredTiles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl font-bold text-muted-foreground mb-4">
              {t('noResults')}
            </p>
            <p className="text-muted-foreground">{t('tryDifferentSearch')}</p>
          </div>
        ) : (
          <LibraryGrid tiles={filteredTiles} onTileClick={handleTileClick} />
        )}
      </section>

      {/* Tile Detail Modal */}
      <LibraryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        tile={selectedTile}
        isLoggedIn={!!user}
      />
    </div>
  );
}
```

---

## Bento Grid Component

The grid uses CSS Grid with strategic `col-span` and `row-span` to create the magazine-like layout.

### File: `src/components/library/LibraryGrid.tsx`

```typescript
'use client';

import { motion } from 'framer-motion';
import { TileCard } from './TileCard';
import { LibraryTile } from '@/services/library/types';

interface LibraryGridProps {
  tiles: LibraryTile[];
  onTileClick: (tile: LibraryTile) => void;
}

export function LibraryGrid({ tiles, onTileClick }: LibraryGridProps) {
  // Container animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-[280px] gap-4"
    >
      {/* Hero Marketing Tile (Always First) */}
      <HeroTile />

      {/* Dynamic Tiles */}
      {tiles.map((tile, index) => (
        <TileCard
          key={tile.id}
          tile={tile}
          index={index}
          onClick={() => onTileClick(tile)}
        />
      ))}
    </motion.div>
  );
}

// Hero Marketing Tile
function HeroTile() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-1 sm:col-span-2 row-span-2 relative group overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white p-8 flex flex-col justify-end shadow-2xl cursor-default"
    >
      {/* Noise Overlay */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Elements */}
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-8 right-8 text-6xl"
      >
        ✨
      </motion.div>

      {/* Content */}
      <div className="relative z-10">
        <h2 className="text-4xl md:text-5xl font-black font-serif mb-4 leading-tight">
          Start with a<br />
          Masterpiece
        </h2>
        <p className="text-white/80 text-lg max-w-md">
          Don't stare at a blank page. Import classic literature, sacred texts,
          or art descriptions instantly.
        </p>
      </div>
    </motion.div>
  );
}
```

---

## Tile Card Component

### File: `src/components/library/TileCard.tsx`

```typescript
'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { LibraryTile } from '@/services/library/types';
import {
  Book,
  Feather,
  Palette,
  Globe,
  MessageCircle,
  Database,
  Newspaper,
  GraduationCap,
  Sparkles,
  Mic,
  Scroll,
} from 'lucide-react';

interface TileCardProps {
  tile: LibraryTile;
  index: number;
  onClick: () => void;
}

// Icon mapping
const ICONS: Record<string, any> = {
  Book,
  Feather,
  Palette,
  Globe,
  MessageCircle,
  Database,
  Newspaper,
  GraduationCap,
  Sparkles,
  Mic,
  Scroll,
};

export function TileCard({ tile, index, onClick }: TileCardProps) {
  const Icon = ICONS[tile.icon] || Book;

  // Determine grid sizing based on tile.size
  const sizeClasses = {
    sm: '',
    md: 'sm:col-span-1 lg:row-span-1',
    lg: 'sm:col-span-2 lg:row-span-2',
  };

  // Create asymmetry patterns
  // Every 7th tile is big, every 5th is tall
  const isLargeDynamic = index % 7 === 0 && index !== 0;
  const isTall = index % 5 === 0 && !isLargeDynamic;

  const dynamicClasses = isLargeDynamic
    ? 'sm:col-span-2 lg:row-span-2'
    : isTall
    ? 'lg:row-span-2'
    : '';

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      layoutId={tile.id}
      onClick={onClick}
      className={`
        relative group overflow-hidden rounded-3xl cursor-pointer
        border border-border/50 hover:border-primary/30
        transition-all duration-500 ease-out
        hover:shadow-2xl hover:shadow-primary/10
        hover:scale-[1.02]
        ${sizeClasses[tile.size]}
        ${dynamicClasses}
      `}
    >
      {/* Background Image */}
      {tile.coverImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
          style={{ backgroundImage: `url(${tile.coverImage})` }}
        />
      ) : (
        <div className={`absolute inset-0 ${tile.tileColor}`} />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />

      {/* Icon Badge (Top Right) */}
      <div className="absolute top-4 right-4 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-white/80" />
      </div>

      {/* Difficulty Badge (Top Left) */}
      <Badge
        variant="secondary"
        className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm border-0 text-white/90 text-xs"
      >
        {tile.difficulty}
      </Badge>

      {/* Content (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {tile.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium uppercase tracking-wider text-white/60"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h3
          className={`font-bold leading-tight ${
            tile.size === 'lg' || isLargeDynamic
              ? 'text-2xl md:text-3xl'
              : 'text-lg md:text-xl'
          }`}
        >
          {tile.title}
        </h3>

        {/* Subtitle (visible on hover or large tiles) */}
        <p
          className={`text-white/70 text-sm mt-2 line-clamp-2 ${
            tile.size === 'lg' || isLargeDynamic
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
          }`}
        >
          {tile.subtitle}
        </p>
      </div>

      {/* Hover CTA Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-md text-white font-bold text-sm">
          Start Project →
        </div>
      </div>
    </motion.div>
  );
}
```

---

## Search Toolbar

### File: `src/components/library/SearchToolbar.tsx`

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Book,
  Feather,
  Palette,
  Newspaper,
  MessageCircle,
  GraduationCap,
  X,
} from 'lucide-react';
import { TileCategory } from '@/services/library/types';
import { cn } from '@/lib/utils';

interface SearchToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: TileCategory | 'all';
  onCategoryChange: (category: TileCategory | 'all') => void;
}

const CATEGORIES: { id: TileCategory | 'all'; label: string; icon: any }[] = [
  { id: 'all', label: 'All', icon: Search },
  { id: 'sacred', label: 'Sacred', icon: Book },
  { id: 'literature', label: 'Literature', icon: Feather },
  { id: 'visual', label: 'Art', icon: Palette },
  { id: 'news', label: 'History', icon: Newspaper },
  { id: 'language', label: 'Language', icon: MessageCircle },
  { id: 'academic', label: 'Academic', icon: GraduationCap },
];

export function SearchToolbar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
}: SearchToolbarProps) {
  const t = useTranslations('Library');

  return (
    <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xl w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="pl-12 h-14 bg-muted/30 border-transparent focus:bg-background focus:border-primary/20 rounded-2xl text-lg transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;

              return (
                <Button
                  key={cat.id}
                  variant={isSelected ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onCategoryChange(cat.id)}
                  className={cn(
                    'rounded-full gap-2 whitespace-nowrap transition-all',
                    isSelected ? 'shadow-lg' : 'hover:bg-muted'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{cat.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Preview Modal

### File: `src/components/library/LibraryPreviewModal.tsx`

(Full implementation in LIBRARY_WIZARD_SYSTEM.md)

Key features:

- Split layout: Cover image left, details right
- Responsive: Stacks on mobile
- Auth-aware CTA: "Sign up to start" vs "Create Project"
- Wizard integration: Seamless flow into configuration

---

## Responsive Design

### Breakpoints

| Breakpoint            | Grid Columns | Hero Tile         | Behavior            |
| --------------------- | ------------ | ----------------- | ------------------- |
| Mobile (<640px)       | 1            | Full width, 1 row | Single column stack |
| Tablet (640-1024px)   | 2            | 2 cols, 2 rows    | Compact 2-column    |
| Desktop (1024-1280px) | 3            | 2 cols, 2 rows    | Asymmetric layout   |
| Wide (>1280px)        | 4            | 2 cols, 2 rows    | Full bento grid     |

### CSS Classes

```css
/* Grid Layout */
.grid-cols-1        /* Mobile */
.sm:grid-cols-2     /* Tablet */
.lg:grid-cols-3     /* Desktop */
.xl:grid-cols-4     /* Wide */

/* Auto Rows */
.auto-rows-[280px]  /* Fixed row height for uniform cards */

/* Tile Sizing */
.col-span-1         /* Default */
.sm:col-span-2      /* Large tiles span 2 columns */
.lg:row-span-2      /* Tall tiles span 2 rows */
```

---

## Animation & Micro-interactions

### Entrance Animations (Framer Motion)

```typescript
// Container: Stagger children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

// Card: Fade up with scale
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};
```

### Hover Interactions

```css
/* Image Zoom */
.group-hover:scale-110

/* Gradient Darken */
.opacity-70.group-hover:opacity-90

/* Card Lift */
.hover:scale-[1.02]
.hover:shadow-2xl

/* CTA Reveal */
.opacity-0.group-hover:opacity-100
```

### Floating Elements (Hero Tile)

```typescript
<motion.div
  animate={{
    y: [0, -10, 0],
    rotate: [0, 5, 0],
  }}
  transition={{
    duration: 6,
    repeat: Infinity,
    ease: 'easeInOut',
  }}
>
  ✨
</motion.div>
```

---

## i18n Keys

### File: `src/messages/en.json` (additions)

```json
{
  "Library": {
    "heroTitle": "The Library",
    "heroSubtitle": "Don't stare at a blank page. Start with a masterpiece. Import classic literature, sacred texts, or art descriptions instantly.",
    "searchPlaceholder": "Search poems, novels, sacred texts...",
    "noResults": "No templates found",
    "tryDifferentSearch": "Try a different search term or browse all categories.",

    "categories": {
      "all": "All",
      "sacred": "Sacred Texts",
      "literature": "Literature",
      "visual": "Art & Visual",
      "news": "History & News",
      "language": "Language & Slang",
      "academic": "Academic"
    },

    "tile": {
      "startProject": "Start Project",
      "beginner": "Beginner",
      "intermediate": "Intermediate",
      "expert": "Expert",
      "publicDomain": "Public Domain"
    },

    "modal": {
      "layout": "Layout",
      "difficulty": "Difficulty",
      "createAccount": "Create Free Account to Start",
      "startWithTemplate": "Start with This Template",
      "description": "Start your translation project with this pre-formatted template. Synoptic will automatically import the text and prepare the bilingual layout."
    }
  }
}
```

---

## File Structure Summary

```
src/
├── app/
│   └── (marketing)/
│       └── library/
│           └── page.tsx              ← Main Library page
├── components/
│   └── library/
│       ├── LibraryGrid.tsx           ← Bento grid container
│       ├── TileCard.tsx              ← Individual tile
│       ├── SearchToolbar.tsx         ← Sticky search + filters
│       ├── LibraryModal.tsx          ← Preview & wizard modal
│       ├── SourceWizard.tsx          ← Dynamic config form
│       └── wizards/
│           ├── ReferenceWizard.tsx   ← Bible/Quran picker
│           ├── SearchWizard.tsx      ← Gutendex/Met search
│           └── DateWizard.tsx        ← Historical date picker
├── hooks/
│   └── useLibraryWizard.ts           ← Wizard state machine
├── services/
│   └── library/
│       ├── types.ts                  ← Core types
│       ├── registry.ts               ← 48 tile definitions
│       └── adapters/
│           ├── bible.ts
│           ├── quran.ts
│           ├── gita.ts
│           ├── gutendex.ts
│           ├── poetrydb.ts
│           ├── met-museum.ts
│           └── ...
└── data/
    └── seeds/
        ├── urban-dictionary-top-1000.json
        ├── political-speeches-de.json
        └── wordbank-children.json
```

---

## Implementation Checklist

### Phase 1: Foundation

- [ ] Create `/library` route
- [ ] Build `LibraryGrid.tsx`
- [ ] Build `TileCard.tsx`
- [ ] Build `SearchToolbar.tsx`
- [ ] Add i18n keys

### Phase 2: Modal & Wizard

- [ ] Build `LibraryModal.tsx`
- [ ] Build `SourceWizard.tsx`
- [ ] Implement `useLibraryWizard` hook
- [ ] Connect to `/api/library/ingest`

### Phase 3: Adapters

- [ ] Implement Bible adapter
- [ ] Implement Gutendex adapter
- [ ] Implement PoetryDB adapter
- [ ] Implement Met Museum adapter
- [ ] Implement Useless Facts adapter

### Phase 4: Polish

- [ ] Add all 48 tiles to registry
- [ ] Seed static datasets
- [ ] Test responsive design
- [ ] Add loading states
- [ ] Add error handling
- [ ] Performance optimization

---

_END OF UI COMPONENTS IMPLEMENTATION GUIDE_
