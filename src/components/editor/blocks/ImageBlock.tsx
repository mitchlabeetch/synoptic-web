// src/components/editor/blocks/ImageBlock.tsx
'use client';

import { ImageBlock } from '@/types/blocks';
import { cn } from '@/lib/utils';
import { ImageIcon, Maximize2, Move } from 'lucide-react';

interface ImageBlockComponentProps {
  block: ImageBlock;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ImageBlock>) => void;
  onDelete: () => void;
  isEditing: boolean;
}

export function ImageBlockComponent({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  isEditing,
}: ImageBlockComponentProps) {
  
  const alignmentStyles = {
    left: 'justify-start mr-auto',
    center: 'justify-center mx-auto',
    right: 'justify-end ml-auto',
  };

  const wrapStyles = {
    none: 'block',
    left: 'float-left mr-4 mb-4',
    right: 'float-right ml-4 mb-4',
    both: 'block', // default
  };

  return (
    <div
      className={cn(
        'group relative rounded-sm transition-all duration-200 outline-none mb-4',
        isSelected ? 'ring-2 ring-primary ring-offset-4' : 'hover:ring-1 hover:ring-muted-foreground/20'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div 
        className={cn(
          'flex transition-all',
          alignmentStyles[block.alignment || 'center'],
          wrapStyles[block.wrap || 'none']
        )}
        style={{ width: block.width ? `${block.width}%` : '100%' }}
      >
        <div className="relative overflow-hidden rounded-lg shadow-sm w-full group/img">
          {!block.url ? (
            <div className="bg-muted aspect-video flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg">
              <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground font-medium italic">Empty Image Block</p>
            </div>
          ) : (
            <img 
              src={block.url} 
              alt={block.altText} 
              className="w-full h-auto object-cover transition-transform duration-500 group-hover/img:scale-[1.02]"
              style={{
                borderRadius: `${block.borderRadius || 0}px`,
                opacity: block.opacity !== undefined ? block.opacity : 1,
                border: block.borderWidth ? `${block.borderWidth}px solid ${block.borderColor || '#000'}` : 'none',
                boxShadow: block.shadow ? '0 4px 20px rgba(0,0,0,0.15)' : 'none'
              }}
            />
          )}

          {/* Image Overlay for Selection */}
          {isSelected && (
            <div className="absolute inset-0 bg-primary/5 pointer-events-none flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
              <Move className="h-12 w-12 text-primary/40" />
            </div>
          )}
        </div>
      </div>

      {/* Captions */}
      {(block.caption?.L1 || block.caption?.L2 || isSelected) && (
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div className="text-[10px] text-muted-foreground italic text-center px-4">
            {block.caption?.L1 || "Add L1 caption..."}
          </div>
          <div className="text-[10px] text-muted-foreground italic text-center px-4">
            {block.caption?.L2 || "Add L2 caption..."}
          </div>
        </div>
      )}

      {/* Block Actions Overlay */}
      {isSelected && (
        <div className="absolute -right-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 bg-destructive text-destructive-foreground rounded-md shadow-sm hover:scale-110 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
