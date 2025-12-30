// src/components/dashboard/SavedTemplates.tsx
// PURPOSE: Display user's saved library templates on dashboard
// ACTION: Shows favorites grid with quick-start buttons
// MECHANISM: Fetches favorites from API, displays as compact cards

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ArrowRight, Loader2, Library, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LIBRARY_TILES, getTileById } from '@/services/library/registry';
import { LibraryTile } from '@/services/library/types';
import { cn } from '@/lib/utils';

interface SavedTemplatesProps {
  className?: string;
}

export function SavedTemplates({ className }: SavedTemplatesProps) {
  const router = useRouter();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch favorites on mount
  useEffect(() => {
    async function fetchFavorites() {
      try {
        const response = await fetch('/api/favorites');
        if (response.ok) {
          const data = await response.json();
          setFavorites(data.favorites.map((f: { tileId: string }) => f.tileId));
        }
      } catch (error) {
        console.error('Failed to fetch favorites:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchFavorites();
  }, []);

  // Get tile objects from favorites
  const favoriteTiles = favorites
    .map(id => getTileById(id))
    .filter((tile): tile is LibraryTile => tile !== undefined);

  // Handle quick start
  const handleQuickStart = (tile: LibraryTile) => {
    // Navigate to new project creation with source pre-selected
    router.push(`/dashboard/new?source=${tile.sourceId}&tileId=${tile.id}`);
  };

  // Handle browse library
  const handleBrowseLibrary = () => {
    router.push('/library');
  };

  if (isLoading) {
    return (
      <div className={cn('rounded-xl border bg-card p-6', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Empty state
  if (favoriteTiles.length === 0) {
    return (
      <div className={cn('rounded-xl border bg-card', className)}>
        <div className="p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Library className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">No saved templates yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Browse our library and save your favorite content sources for quick access.
          </p>
          <Button onClick={handleBrowseLibrary} variant="outline" size="sm" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Explore Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          <h2 className="font-semibold">My Saved Templates</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {favoriteTiles.length}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleBrowseLibrary} className="gap-1 text-xs">
          Browse All
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {favoriteTiles.slice(0, 6).map(tile => (
            <button
              key={tile.id}
              onClick={() => handleQuickStart(tile)}
              className={cn(
                'group relative p-3 rounded-lg text-left transition-all duration-200',
                'border border-transparent hover:border-primary/50',
                'bg-muted/30 hover:bg-muted/50',
                'hover:shadow-md'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0',
                  tile.tileColor
                )}>
                  📚
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {tile.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {tile.subtitle}
                  </p>
                </div>
              </div>
              
              {/* Hover arrow */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4 text-primary" />
              </div>
            </button>
          ))}
        </div>

        {favoriteTiles.length > 6 && (
          <div className="text-center mt-3 pt-3 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBrowseLibrary}
              className="text-xs"
            >
              View all {favoriteTiles.length} saved templates
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
