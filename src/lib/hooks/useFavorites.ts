// src/lib/hooks/useFavorites.ts
// PURPOSE: React hook for managing library favorites
// ACTION: Provides toggle, check, and list operations for favorites
// MECHANISM: Combines API calls with optimistic UI updates

'use client';

import { useState, useEffect, useCallback } from 'react';

interface FavoriteItem {
  tileId: string;
  savedAt: string;
}

interface UseFavoritesResult {
  favorites: string[];
  isLoading: boolean;
  error: string | null;
  isFavorite: (tileId: string) => boolean;
  toggleFavorite: (tileId: string) => Promise<void>;
  addFavorite: (tileId: string) => Promise<void>;
  removeFavorite: (tileId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useFavorites(isAuthenticated: boolean): UseFavoritesResult {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch favorites from API
  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/favorites');
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      const data = await response.json();
      setFavorites(data.favorites.map((f: FavoriteItem) => f.tileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Check if a tile is favorited
  const isFavorite = useCallback((tileId: string) => {
    return favorites.includes(tileId);
  }, [favorites]);

  // Add a favorite
  const addFavorite = useCallback(async (tileId: string) => {
    if (!isAuthenticated) return;

    // Optimistic update
    setFavorites(prev => [...prev, tileId]);

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tileId }),
      });

      if (!response.ok) {
        throw new Error('Failed to add favorite');
      }
    } catch (err) {
      // Revert on error
      setFavorites(prev => prev.filter(id => id !== tileId));
      setError(err instanceof Error ? err.message : 'Failed to add');
    }
  }, [isAuthenticated]);

  // Remove a favorite
  const removeFavorite = useCallback(async (tileId: string) => {
    if (!isAuthenticated) return;

    // Optimistic update
    setFavorites(prev => prev.filter(id => id !== tileId));

    try {
      const response = await fetch(`/api/favorites?tileId=${encodeURIComponent(tileId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove favorite');
      }
    } catch (err) {
      // Revert on error
      setFavorites(prev => [...prev, tileId]);
      setError(err instanceof Error ? err.message : 'Failed to remove');
    }
  }, [isAuthenticated]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (tileId: string) => {
    if (isFavorite(tileId)) {
      await removeFavorite(tileId);
    } else {
      await addFavorite(tileId);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  return {
    favorites,
    isLoading,
    error,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    refetch: fetchFavorites,
  };
}
