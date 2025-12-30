// src/components/library/SearchToolbar.tsx
// PURPOSE: Enhanced search and filter controls for Library
// ACTION: Provides search input, category tabs, license filter, difficulty, and quick tags
// MECHANISM: Controlled components that emit filter changes

'use client';

import { memo, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX,
  X,
  BookOpen,
  Palette,
  Newspaper,
  GraduationCap,
  MessageCircle,
  Gamepad2,
  History,
  Lightbulb,
  ScrollText,
  Sparkles,
  Zap,
  Star,
  SlidersHorizontal,
} from 'lucide-react';
import { TileCategory } from '@/services/library/types';
import { cn } from '@/lib/utils';

interface SearchToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: TileCategory | 'all';
  onCategoryChange: (category: TileCategory | 'all') => void;
  licenseFilter: 'all' | 'commercial-safe' | 'attribution' | 'personal-only';
  onLicenseChange: (license: 'all' | 'commercial-safe' | 'attribution' | 'personal-only') => void;
  difficultyFilter?: 'all' | 'beginner' | 'intermediate' | 'expert';
  onDifficultyChange?: (difficulty: 'all' | 'beginner' | 'intermediate' | 'expert') => void;
  totalCount: number;
  filteredCount: number;
  tiles?: any[]; // For extracting popular tags
}

const CATEGORIES: { value: TileCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: null },
  { value: 'sacred', label: 'Sacred', icon: <ScrollText className="w-4 h-4" /> },
  { value: 'literature', label: 'Literature', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'visual', label: 'Visual', icon: <Palette className="w-4 h-4" /> },
  { value: 'knowledge', label: 'Knowledge', icon: <Lightbulb className="w-4 h-4" /> },
  { value: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
  { value: 'language', label: 'Language', icon: <MessageCircle className="w-4 h-4" /> },
  { value: 'academic', label: 'Academic', icon: <GraduationCap className="w-4 h-4" /> },
  { value: 'popculture', label: 'Pop', icon: <Gamepad2 className="w-4 h-4" /> },
  { value: 'news', label: 'News', icon: <Newspaper className="w-4 h-4" /> },
];

// Quick filter tags for popular searches
const QUICK_TAGS = [
  { tag: 'bestseller', label: '🏆 Bestsellers', color: 'bg-amber-100 text-amber-800 hover:bg-amber-200' },
  { tag: 'daily', label: '📅 Daily Practice', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
  { tag: 'quick', label: '⚡ Quick Sessions', color: 'bg-green-100 text-green-800 hover:bg-green-200' },
  { tag: 'gift', label: '🎁 Gift Ideas', color: 'bg-pink-100 text-pink-800 hover:bg-pink-200' },
  { tag: 'poster', label: '🖼️ Posters', color: 'bg-violet-100 text-violet-800 hover:bg-violet-200' },
  { tag: 'flashcard', label: '📚 Flashcards', color: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200' },
  { tag: 'vocabulary', label: '📖 Vocabulary', color: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
  { tag: 'social', label: '📱 Social Media', color: 'bg-purple-100 text-purple-800 hover:bg-purple-200' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'All Levels', icon: null },
  { value: 'beginner', label: 'Beginner', icon: '🟢', color: 'text-green-600' },
  { value: 'intermediate', label: 'Intermediate', icon: '🟡', color: 'text-yellow-600' },
  { value: 'expert', label: 'Expert', icon: '🔴', color: 'text-red-600' },
];

export const SearchToolbar = memo(function SearchToolbar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  licenseFilter,
  onLicenseChange,
  difficultyFilter = 'all',
  onDifficultyChange,
  totalCount,
  filteredCount,
  tiles,
}: SearchToolbarProps) {
  const hasFilters = searchQuery || selectedCategory !== 'all' || licenseFilter !== 'all' || difficultyFilter !== 'all';

  // Handle quick tag click
  const handleQuickTagClick = (tag: string) => {
    if (searchQuery === tag) {
      onSearchChange('');
    } else {
      onSearchChange(tag);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title, topic, author, or keyword..."
            className="pl-10 h-11"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex gap-2">
          {/* License Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 gap-2 min-w-[130px]">
                {licenseFilter === 'all' && <Filter className="w-4 h-4" />}
                {licenseFilter === 'commercial-safe' && <ShieldCheck className="w-4 h-4 text-green-600" />}
                {licenseFilter === 'attribution' && <ShieldAlert className="w-4 h-4 text-yellow-600" />}
                {licenseFilter === 'personal-only' && <ShieldX className="w-4 h-4 text-red-600" />}
                <span className="hidden sm:inline">
                  {licenseFilter === 'all' && 'License'}
                  {licenseFilter === 'commercial-safe' && 'Commercial'}
                  {licenseFilter === 'attribution' && 'Attribution'}
                  {licenseFilter === 'personal-only' && 'Personal'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>License Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={licenseFilter} onValueChange={(v) => onLicenseChange(v as any)}>
                <DropdownMenuRadioItem value="all">
                  All Licenses
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="commercial-safe" className="gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  Commercial Safe 🟢
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="attribution" className="gap-2">
                  <ShieldAlert className="w-4 h-4 text-yellow-600" />
                  Attribution Required 🟡
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="personal-only" className="gap-2">
                  <ShieldX className="w-4 h-4 text-red-600" />
                  Personal Use Only 🔴
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Difficulty Filter Dropdown */}
          {onDifficultyChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 gap-2 min-w-[120px]">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {difficultyFilter === 'all' && 'Level'}
                    {difficultyFilter === 'beginner' && '🟢 Beginner'}
                    {difficultyFilter === 'intermediate' && '🟡 Intermediate'}
                    {difficultyFilter === 'expert' && '🔴 Expert'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Difficulty Level</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={difficultyFilter} onValueChange={(v) => onDifficultyChange(v as any)}>
                  {DIFFICULTY_OPTIONS.map(opt => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                      {opt.icon && <span className="mr-2">{opt.icon}</span>}
                      {opt.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Quick Filter Tags */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Quick filters:</span>
        {QUICK_TAGS.map(qt => (
          <button
            key={qt.tag}
            onClick={() => handleQuickTagClick(qt.tag)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all',
              searchQuery === qt.tag 
                ? 'ring-2 ring-primary ring-offset-1' 
                : '',
              qt.color
            )}
          >
            {qt.label}
          </button>
        ))}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(cat.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap',
              'transition-colors border',
              selectedCategory === cat.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 hover:bg-muted border-transparent'
            )}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results Count + Clear */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Showing <strong className="text-foreground">{filteredCount}</strong> of {totalCount} templates
        </span>
        
        {hasFilters && (
          <button
            onClick={() => {
              onSearchChange('');
              onCategoryChange('all');
              onLicenseChange('all');
              onDifficultyChange?.('all');
            }}
            className="text-primary hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
});
