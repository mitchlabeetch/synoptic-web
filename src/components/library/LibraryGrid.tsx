// src/components/library/LibraryGrid.tsx
// PURPOSE: Asymmetric Bento Grid layout for Library tiles
// ACTION: Renders all tiles with category, license, and difficulty filtering
// MECHANISM: CSS Grid with dynamic spans and enhanced filtering

'use client';

import { useState, useMemo, memo } from 'react';
import { cn } from '@/lib/utils';
import { LibraryTile, TileCategory } from '@/services/library/types';
import { TileCard } from './TileCard';
import { SearchToolbar } from './SearchToolbar';

interface LibraryGridProps {
  tiles: LibraryTile[];
  onTileClick: (tile: LibraryTile) => void;
  className?: string;
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

  // Filter tiles based on search and filters
  const filteredTiles = useMemo(() => {
    let result = [...tiles];

    // Apply search (matches title, subtitle, tags, description, sourceName)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(tile =>
        tile.title.toLowerCase().includes(q) ||
        tile.subtitle.toLowerCase().includes(q) ||
        tile.tags.some(tag => tag.includes(q)) ||
        tile.description?.toLowerCase().includes(q) ||
        tile.sourceName?.toLowerCase().includes(q) ||
        tile.sourceId.toLowerCase().includes(q)
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
  }, [tiles, searchQuery, selectedCategory, licenseFilter, difficultyFilter]);

  // Group tiles by category for organized display
  const groupedTiles = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredTiles };
    }

    // Custom category order for better presentation
    const categoryOrder: TileCategory[] = [
      'sacred',
      'literature', 
      'visual',
      'knowledge',
      'language',
      'history',
      'academic',
      'popculture',
      'news',
    ];

    const groups: Record<string, LibraryTile[]> = {};
    
    // Initialize groups in order
    categoryOrder.forEach(cat => {
      const categoryTiles = filteredTiles.filter(t => t.category === cat);
      if (categoryTiles.length > 0) {
        groups[cat] = categoryTiles;
      }
    });

    return groups;
  }, [filteredTiles, selectedCategory]);

  const categoryLabels: Record<TileCategory, string> = {
    sacred: '📖 Sacred & Wisdom',
    literature: '✍️ Literature',
    visual: '🎨 Visual & Art',
    news: '📰 News & Media',
    history: '📜 History',
    language: '💬 Language Learning',
    knowledge: '🧠 Knowledge & Facts',
    academic: '🎓 Academic & Research',
    popculture: '🎮 Pop Culture',
  };

  const categoryDescriptions: Record<TileCategory, string> = {
    sacred: 'Spiritual texts from world traditions',
    literature: 'Novels, poetry, drama, and folklore',
    visual: 'Museum art, NASA photography, and more',
    news: 'Headlines, articles, and media',
    history: 'Historical documents and archives',
    language: 'Sentences, vocabulary, and drills',
    knowledge: 'Facts, quotes, recipes, and geography',
    academic: 'Research, formal writing, and test prep',
    popculture: 'Comics, games, and entertainment',
  };

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

      {/* Tile Groups */}
      {Object.entries(groupedTiles).map(([category, categoryTiles]) => (
        <section key={category} className="space-y-4">
          {/* Category Header (if showing all) */}
          {selectedCategory === 'all' && (
            <div className="space-y-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {categoryLabels[category as TileCategory] || category}
                <span className="text-sm font-normal text-muted-foreground">
                  ({categoryTiles.length})
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                {categoryDescriptions[category as TileCategory]}
              </p>
            </div>
          )}

          {/* Bento Grid */}
          <div className={cn(
            'grid gap-4',
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
            'auto-rows-[180px]'
          )}>
            {categoryTiles.map(tile => (
              <TileCard
                key={tile.id}
                tile={tile}
                onClick={onTileClick}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
});
