// src/components/editor/blocks/SeparatorBlock.tsx
'use client';

import { SeparatorBlock, SeparatorStyle } from '@/types/blocks';
import { cn } from '@/lib/utils';

interface SeparatorBlockComponentProps {
  block: SeparatorBlock;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<SeparatorBlock>) => void;
  onDelete: () => void;
}

export function SeparatorBlockComponent({
  block,
  isSelected,
  onSelect,
  onDelete,
}: SeparatorBlockComponentProps) {
  
  const styles: Record<string, string> = {
    line: 'border-t',
    'double-line': 'border-t-4 border-double',
    dashed: 'border-t-2 border-dashed',
    dotted: 'border-t-2 border-dotted',
    gradient: 'h-[1px] bg-gradient-to-r from-transparent via-muted-foreground to-transparent border-none',
    'ornament-fleuron': 'before:content-["❦"] before:text-2xl before:text-muted-foreground flex items-center justify-center border-none',
  };

  const currentStyle = styles[block.style || 'line'] || styles.line;

  return (
    <div
      className={cn(
        'group relative py-8 px-2 rounded-sm transition-all duration-200 outline-none my-2 flex items-center justify-center min-h-[40px]',
        isSelected ? 'ring-2 ring-primary ring-offset-4' : 'hover:bg-primary/5'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div 
        className={cn(
          'transition-all border-muted-foreground/30',
          currentStyle
        )}
        style={{ 
          width: block.width ? `${block.width}%` : '80%',
          borderColor: block.style === 'gradient' ? undefined : (block.color || 'currentColor'),
          borderTopWidth: (block.style === 'gradient' || block.style?.startsWith('ornament')) ? undefined : (block.thickness ? `${block.thickness}px` : undefined)
        }}
      />

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
