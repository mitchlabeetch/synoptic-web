// src/components/library/TileCard.tsx
// PURPOSE: Individual tile in the Library Bento Grid
// ACTION: Displays marketing info, license badge, and opens wizard on click
// MECHANISM: Card component with hover effects and license indicator

'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { LibraryTile } from '@/services/library/types';
import { LicenseIndicator } from './LicenseBadge';
import * as LucideIcons from 'lucide-react';
import Image from 'next/image';

interface TileCardProps {
  tile: LibraryTile;
  onClick: (tile: LibraryTile) => void;
  className?: string;
}

// Dynamic icon component
function TileIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.FileText;
  return <IconComponent className={className} />;
}

export const TileCard = memo(function TileCard({ 
  tile, 
  onClick,
  className 
}: TileCardProps) {
  // Determine grid span based on size
  const sizeClasses = {
    sm: 'col-span-1 row-span-1',
    md: 'col-span-1 row-span-2 md:col-span-2 md:row-span-1',
    lg: 'col-span-1 row-span-2 md:col-span-2 md:row-span-2',
  };

  const heightClasses = {
    sm: 'min-h-[180px]',
    md: 'min-h-[200px]',
    lg: 'min-h-[280px]',
  };

  // Difficulty indicator colors
  const difficultyColors = {
    beginner: 'bg-green-500',
    intermediate: 'bg-yellow-500',
    expert: 'bg-red-500',
  };

  return (
    <button
      onClick={() => onClick(tile)}
      className={cn(
        // Base
        'relative group overflow-hidden rounded-2xl',
        'text-left transition-all duration-300',
        // Sizing
        sizeClasses[tile.size],
        heightClasses[tile.size],
        // Colors
        tile.tileColor,
        // Hover effects
        'hover:scale-[1.02] hover:shadow-2xl',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
    >
      {/* Cover Image (if available) */}
      {tile.coverImage && (
        <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
          <Image
            src={tile.coverImage}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative h-full p-5 flex flex-col">
        {/* Top Row: Icon + License */}
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            'p-2.5 rounded-xl',
            'bg-white/60 dark:bg-black/20 backdrop-blur-sm',
            'group-hover:scale-110 transition-transform'
          )}>
            <TileIcon name={tile.icon} className="w-6 h-6" />
          </div>
          
          {/* License indicator */}
          <div className="flex items-center gap-2">
            <LicenseIndicator license={tile.license} />
            <span className={cn(
              'w-2 h-2 rounded-full',
              difficultyColors[tile.difficulty]
            )} title={tile.difficulty} />
          </div>
        </div>

        {/* Middle: Title and Subtitle */}
        <div className="flex-grow">
          <h3 className={cn(
            'font-bold mb-1 leading-tight',
            tile.size === 'lg' ? 'text-xl' : 'text-lg'
          )}>
            {tile.title}
          </h3>
          <p className="text-sm opacity-70 line-clamp-2">
            {tile.subtitle}
          </p>
        </div>

        {/* Bottom: Tags */}
        <div className="mt-3 flex flex-wrap gap-1">
          {tile.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-medium',
                'bg-black/5 dark:bg-white/10'
              )}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Hover Arrow */}
        <div className={cn(
          'absolute bottom-4 right-4',
          'opacity-0 group-hover:opacity-100',
          'translate-x-2 group-hover:translate-x-0',
          'transition-all duration-200'
        )}>
          <LucideIcons.ArrowRight className="w-5 h-5" />
        </div>
      </div>

      {/* Personal Only Warning Badge */}
      {tile.license.type === 'personal-only' && (
        <div className={cn(
          'absolute top-3 right-3',
          'px-2 py-1 rounded-md text-[9px] font-bold uppercase',
          'bg-red-500 text-white'
        )}>
          Study Only
        </div>
      )}
    </button>
  );
});
