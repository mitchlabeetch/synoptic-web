// src/components/editor/blocks/TextBlock.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import { TextBlock } from '@/types/blocks';
import { isRTL, getDefaultFont } from '@/data/languages';
import { useProjectStore } from '@/lib/store/projectStore';
import { cn } from '@/lib/utils';
import { FloatingToolbar } from './FloatingToolbar';

interface TextBlockComponentProps {
  block: TextBlock;
  sourceLang: string;
  targetLang: string;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextBlock>) => void;
  onDelete: () => void;
  isEditing: boolean;
}

export function TextBlockComponent({
  block,
  sourceLang,
  targetLang,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  isEditing,
}: TextBlockComponentProps) {
  const { settings } = useProjectStore();
  const l1Ref = useRef<HTMLDivElement>(null);
  const l2Ref = useRef<HTMLDivElement>(null);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });

  const isL1RTL = isRTL(sourceLang);
  const isL2RTL = isRTL(targetLang);

  const handleTextChange = (lang: 'L1' | 'L2') => {
    const ref = lang === 'L1' ? l1Ref : l2Ref;
    if (!ref.current) return;
    
    onUpdate({
      [lang]: { 
        ...block[lang], 
        content: ref.current.innerHTML 
      },
    });
  };

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !isSelected) {
        setToolbarVisible(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setToolbarPos({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width / 2,
      });
      setToolbarVisible(true);
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [isSelected]);

  const layoutStyles = {
    'side-by-side': 'grid grid-cols-2 gap-8',
    'interlinear': 'flex flex-col gap-1',
    'stacked': 'flex flex-col gap-4',
    'alternating': 'flex flex-col gap-4', // Alternating handled via CSS logic usually, but here just stacked fallback
  };

  const currentLayout = block.layout || settings.layout || 'side-by-side';

  return (
    <div
      className={cn(
        'group relative rounded-sm transition-all duration-200 outline-none mb-4',
        isSelected ? 'ring-2 ring-primary ring-offset-4' : 'hover:ring-1 hover:ring-muted-foreground/20'
      )}
      style={{
        lineHeight: block.lineSpacing || settings.typography.lineHeight,
        marginBottom: `${block.paragraphSpacing || 20}px`
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <FloatingToolbar isVisible={toolbarVisible} position={toolbarPos} />

      <div className={cn(
        layoutStyles[currentLayout as keyof typeof layoutStyles],
        (block.isTitle || block.isChapterHeading) && "text-center"
      )}>
        {/* L1 (Source Language) */}
        <div
          ref={l1Ref}
          className={cn(
            'p-2 rounded transition-colors min-h-[1.5em] prose prose-sm max-w-none dark:prose-invert',
            isEditing && 'hover:bg-primary/5 focus:bg-primary/5 focus:outline-none focus:ring-1 focus:ring-primary/20',
            block.isTitle && 'text-3xl font-extrabold tracking-tight mb-4',
            block.isChapterHeading && 'text-2xl font-bold italic text-muted-foreground mb-4'
          )}
          style={{
            direction: isL1RTL ? 'rtl' : 'ltr',
            fontFamily: block.L1.formatting?.fontFamily || (block.isTitle || block.isChapterHeading ? settings.fonts.heading : settings.fonts.body),
            fontSize: block.L1.formatting?.fontSize ? `${block.L1.formatting.fontSize}px` : `${settings.typography.baseSize}pt`,
            color: block.L1.formatting?.color || settings.colors.primary,
            textAlign: block.L1.formatting?.alignment || (isL1RTL ? 'right' : 'left'),
          }}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={() => handleTextChange('L1')}
          dangerouslySetInnerHTML={{ __html: block.L1.content }}
        />

        {/* L2 (Target Language) */}
        <div
          ref={l2Ref}
          className={cn(
            'p-2 rounded transition-colors min-h-[1.5em] prose prose-sm max-w-none dark:prose-invert opacity-80',
            isEditing && 'hover:bg-primary/5 focus:bg-primary/5 focus:outline-none focus:ring-1 focus:ring-primary/20',
            block.isTitle && 'text-3xl font-extrabold tracking-tight mb-4',
            block.isChapterHeading && 'text-2xl font-bold italic text-muted-foreground mb-4'
          )}
          style={{
            direction: isL2RTL ? 'rtl' : 'ltr',
            fontFamily: block.L2.formatting?.fontFamily || (block.isTitle || block.isChapterHeading ? settings.fonts.heading : settings.fonts.body),
            fontSize: block.L2.formatting?.fontSize ? `${block.L2.formatting.fontSize}px` : `${settings.typography.baseSize}pt`,
            color: block.L2.formatting?.color || settings.colors.secondary,
            textAlign: block.L2.formatting?.alignment || (isL2RTL ? 'right' : 'left'),
          }}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={() => handleTextChange('L2')}
          dangerouslySetInnerHTML={{ __html: block.L2.content }}
        />
      </div>

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
