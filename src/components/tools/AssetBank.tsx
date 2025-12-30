// src/components/tools/AssetBank.tsx
// PURPOSE: Visual asset bank using EmojiHub API
// ACTION: Provides categorized emoji selection for flashcards and callouts
// MECHANISM: Fetches from EmojiHub API with caching, search, and category tabs

'use client';

import { useState, useEffect, useMemo } from 'react';
import { assetBank, EmojiAsset } from '@/services/emojihub';
import { Smile, Search, Loader2, Grid, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface AssetBankProps {
  onSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
}

// Category icons/labels mapping
const CATEGORY_LABELS: Record<string, string> = {
  'smileys-and-people': '😊 People',
  'animals-and-nature': '🐾 Nature',
  'food-and-drink': '🍕 Food',
  'travel-and-places': '✈️ Travel',
  'activities': '⚽ Activity',
  'objects': '💡 Objects',
  'symbols': '💠 Symbols',
  'flags': '🏳️ Flags',
};

export function AssetBank({ onSelect, trigger }: AssetBankProps) {
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState<EmojiAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Fetch library on mount
  useEffect(() => {
    if (!open) return;
    
    setLoading(true);
    assetBank.getLibrary()
      .then(setLibrary)
      .catch(() => setLibrary([]))
      .finally(() => setLoading(false));
  }, [open]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(library.map(e => e.category)));
    return ['all', ...cats];
  }, [library]);

  // Filter emojis by search and category
  const filteredEmojis = useMemo(() => {
    let filtered = library;
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(e => e.category === activeCategory);
    }
    
    // Filter by search
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(e => 
        e.name.toLowerCase().includes(lowerSearch)
      );
    }
    
    return filtered.slice(0, 100); // Limit for performance
  }, [library, activeCategory, search]);

  const handleSelect = (emoji: EmojiAsset) => {
    // Convert HTML entity to actual character
    const char = emoji.htmlCode[0]
      ? String.fromCodePoint(
          parseInt(emoji.htmlCode[0].replace('&#', '').replace(';', ''))
        )
      : emoji.unicode[0] || '❓';
    
    onSelect(char);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5 text-amber-600 hover:bg-amber-50 hover:text-amber-700 h-8"
          >
            <Smile className="w-4 h-4" />
            <span className="text-xs font-medium">Emoji Bank</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-primary" />
            Asset Bank
          </DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search emojis..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 border-b scrollbar-hide">
          {categories.slice(0, 8).map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "shrink-0 text-xs h-7 px-2",
                activeCategory === cat && "bg-primary/10 text-primary"
              )}
            >
              {cat === 'all' ? '✨ All' : CATEGORY_LABELS[cat] || cat}
            </Button>
          ))}
        </div>

        {/* Emoji Grid */}
        <div className="h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading assets...</span>
            </div>
          ) : filteredEmojis.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Smile className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-sm">No emojis found</span>
            </div>
          ) : (
            <div className="grid grid-cols-8 gap-0.5 p-1">
              {filteredEmojis.map((emoji, idx) => {
                // Convert to actual character for display
                let char = '?';
                try {
                  char = emoji.htmlCode[0]
                    ? String.fromCodePoint(
                        parseInt(emoji.htmlCode[0].replace('&#', '').replace(';', ''))
                      )
                    : '?';
                } catch {
                  char = '?';
                }
                
                return (
                  <button
                    key={`${emoji.name}-${idx}`}
                    onClick={() => handleSelect(emoji)}
                    className="w-8 h-8 flex items-center justify-center text-xl hover:bg-muted rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                    title={emoji.name}
                  >
                    {char}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Powered by badge */}
        <div className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground/60 pt-2 border-t">
          <Sparkles className="w-2.5 h-2.5" />
          Powered by EmojiHub
        </div>
      </DialogContent>
    </Dialog>
  );
}
