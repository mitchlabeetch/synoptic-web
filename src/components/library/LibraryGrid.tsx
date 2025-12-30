// src/components/library/LibraryGrid.tsx
// PURPOSE: Randomized Tetris-like Bento Grid layout for Library tiles
// ACTION: Renders all tiles without category grouping, with search filtering
// MECHANISM: CSS Grid with stable gaps and shuffled tile order

'use client';

import { useState, useMemo, memo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { LibraryTile, TileCategory } from '@/services/library/types';
import { TileCard } from './TileCard';
import { SearchToolbar } from './SearchToolbar';

interface LibraryGridProps {
  tiles: LibraryTile[];
  onTileClick: (tile: LibraryTile) => void;
  className?: string;
}

// Deterministic shuffle using seed for consistent SSR/CSR
function shuffleArray<T>(array: T[], seed: number = 42): T[] {
  const result = [...array];
  let m = result.length;
  
  // Simple seeded random
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  while (m) {
    const i = Math.floor(random() * m--);
    [result[m], result[i]] = [result[i], result[m]];
  }
  
  return result;
}

export const LibraryGrid = memo(function LibraryGrid({
  tiles,
  onTileClick,
  className,
}: LibraryGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TileCategory | 'all'>('all');
  const [licenseFilter, setLicenseFilter] = useState<'all' | 'commercial-safe' | 'attribution' | 'personal-only'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'expert'>('all');

  // Shuffle tiles once for randomized tetris-like display
  const shuffledTiles = useMemo(() => shuffleArray(tiles), [tiles]);

  // Filter tiles based on search and filters
  const filteredTiles = useMemo(() => {
    let result = [...shuffledTiles];

    // Apply search (matches title, subtitle, tags, description, sourceName)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(tile =>
        tile.title.toLowerCase().includes(q) ||
        tile.subtitle.toLowerCase().includes(q) ||
        tile.tags.some(tag => tag.includes(q)) ||
        tile.description?.toLowerCase().includes(q) ||
        tile.sourceName?.toLowerCase().includes(q) ||
        tile.sourceId.toLowerCase().includes(q) ||
        tile.category.toLowerCase().includes(q)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(tile => tile.category === selectedCategory);
    }

    // Apply license filter
    if (licenseFilter !== 'all') {
      result = result.filter(tile => tile.license.type === licenseFilter);
    }

    // Apply difficulty filter
    if (difficultyFilter !== 'all') {
      result = result.filter(tile => tile.difficulty === difficultyFilter);
    }

    return result;
  }, [shuffledTiles, searchQuery, selectedCategory, licenseFilter, difficultyFilter]);

  return (
    <div className={cn('space-y-8', className)}>
      {/* Search Toolbar */}
      <SearchToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        licenseFilter={licenseFilter}
        onLicenseChange={setLicenseFilter}
        difficultyFilter={difficultyFilter}
        onDifficultyChange={setDifficultyFilter}
        totalCount={tiles.length}
        filteredCount={filteredTiles.length}
        tiles={tiles}
      />

      {/* No Results */}
      {filteredTiles.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setLicenseFilter('all');
              setDifficultyFilter('all');
            }}
            className="text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Randomized Tetris-like Bento Grid - No category grouping */}
      {filteredTiles.length > 0 && (
        <div className={cn(
          'grid gap-5',
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          'auto-rows-[180px]'
        )}>
          {filteredTiles.map(tile => (
            <TileCard
              key={tile.id}
              tile={tile}
              onClick={onTileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
});
