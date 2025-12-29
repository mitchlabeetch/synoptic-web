// src/components/editor/blocks/TextBlock.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import { TextBlock } from '@/types/blocks';
import { isRTL, getDefaultFont } from '@/data/languages';
import { useProjectStore } from '@/lib/store/projectStore';
import { cn } from '@/lib/utils';
import { FloatingToolbar } from './FloatingToolbar';

import { Sparkles, Loader2, Trash2, BookOpen } from 'lucide-react';

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
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const direction = useProjectStore((state) => {
    if (state.settings.direction !== 'auto') return state.settings.direction;
    return isRTL(sourceLang) ? 'rtl' : 'ltr';
  });
  
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

  const handleAiTranslate = async () => {
    if (!block.L1.content || isAiProcessing) return;
    
    setIsAiProcessing(true);
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: block.L1.content.replace(/<[^>]*>/g, ''), // Strip HTML for translation
          sourceLang,
          targetLang
        }),
      });

      if (!response.ok) throw new Error('Translation failed');
      const data = await response.json();

      onUpdate({
        L2: { ...block.L2, content: data.translation }
      });
    } catch (error) {
      console.error('AI Translation Error:', error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAiAnnotate = async () => {
    if (isAiProcessing) return;
    
    setIsAiProcessing(true);
    try {
      const response = await fetch('/api/ai/annotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          L1Text: block.L1.content.replace(/<[^>]*>/g, ''),
          L2Text: block.L2.content.replace(/<[^>]*>/g, ''),
          L1Lang: sourceLang,
          L2Lang: targetLang
        }),
      });

      if (!response.ok) throw new Error('Annotation failed');
      const data = await response.json();

      // Clear existing annotations for this block
      const store = useProjectStore.getState();
      
      // Add Word Groups
      data.wordGroups?.forEach((g: any) => {
        store.addWordGroup({
          id: `wg-${block.id}-${Math.random().toString(36).substr(2, 9)}`,
          blockId: block.id,
          ...g
        });
      });

      // Add Arrows
      data.arrows?.forEach((a: any) => {
        store.addArrow({
          id: `ar-${block.id}-${Math.random().toString(36).substr(2, 9)}`,
          blockId: block.id,
          ...a
        });
      });

      // Add Notes
      data.notes?.forEach((n: any) => {
        store.addNote({
          id: `nt-${block.id}-${Math.random().toString(36).substr(2, 9)}`,
          blockId: block.id,
          ...n
        });
      });

    } catch (error) {
      console.error('AI Annotation Error:', error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Helper to tokenized text into targetable spans
  const TokenizedText = ({ content, lang, side }: { content: string, lang: string, side: 'L1' | 'L2' }) => {
    // Basic tokenizer that preserves some HTML if needed, but for annotations we focus on words
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/);
    return (
      <>
        {words.map((word, i) => (
          <span 
            key={i} 
            data-word-id={`${block.id}-${side}-${i}`}
            className="inline-block mr-1 hover:bg-primary/10 transition-colors rounded px-0.5"
          >
            {word}
          </span>
        ))}
      </>
    );
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

  const currentLayout = block.layout || settings.layout || 'side-by-side';

  // Logical grid classes
  const layoutStyles = {
    'side-by-side': direction === 'rtl' ? 'book-grid-rtl gap-8' : 'book-grid-ltr gap-8',
    'interlinear': 'flex flex-col gap-1',
    'stacked': 'flex flex-col gap-4',
    'alternating': 'flex flex-col gap-4',
  };

  const handleAiExplain = async () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || isAiProcessing) return;
    
    const word = selection.toString();
    const range = selection.getRangeAt(0);
    
    // Determine which language the selection is in
    let lang = sourceLang;
    let context = '';
    
    if (l1Ref.current?.contains(range.commonAncestorContainer)) {
      lang = sourceLang;
      context = l1Ref.current.innerText;
    } else if (l2Ref.current?.contains(range.commonAncestorContainer)) {
      lang = targetLang;
      context = l2Ref.current.innerText;
    } else {
      return;
    }

    setIsAiProcessing(true);
    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, context, language: lang }),
      });

      if (!response.ok) throw new Error('AI explanation failed');
      const data = await response.json();
      
      // For now, show a native alert, we'll implement a premium modal later
      alert(`${data.role.toUpperCase()}: ${data.explanation}\n\nExamples: ${data.examples?.join(', ')}`);
    } catch (error) {
      console.error('AI Explain Error:', error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div
      className={cn(
        'group relative rounded-xl transition-all duration-300 outline-none mb-4 border border-transparent',
        isSelected ? 'ring-2 ring-primary ring-offset-4 bg-background shadow-lg' : 'hover:border-primary/20 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 hover:shadow-sm'
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
      <FloatingToolbar 
        isVisible={toolbarVisible} 
        position={toolbarPos} 
        onAiExplain={handleAiExplain}
      />

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
            textAlign: block.L1.formatting?.alignment || 'start',
          }}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={() => handleTextChange('L1')}
          // dangerouslySetInnerHTML={{ __html: block.L1.content }}
        >
          <TokenizedText content={block.L1.content} lang={sourceLang} side="L1" />
        </div>

        {/* L2 (Target Language) */}
        <div
          ref={l2Ref}
          className={cn(
            'p-2 rounded transition-colors min-h-[1.5em] prose prose-sm max-w-none dark:prose-invert opacity-80 relative',
            isEditing && 'hover:bg-primary/5 focus:bg-primary/5 focus:outline-none focus:ring-1 focus:ring-primary/20',
            block.isTitle && 'text-3xl font-extrabold tracking-tight mb-4',
            block.isChapterHeading && 'text-2xl font-bold italic text-muted-foreground mb-4'
          )}
          style={{
            direction: isL2RTL ? 'rtl' : 'ltr',
            fontFamily: block.L2.formatting?.fontFamily || (block.isTitle || block.isChapterHeading ? settings.fonts.heading : settings.fonts.body),
            fontSize: block.L2.formatting?.fontSize ? `${block.L2.formatting.fontSize}px` : `${settings.typography.baseSize}pt`,
            color: block.L2.formatting?.color || settings.colors.secondary,
            textAlign: block.L2.formatting?.alignment || 'start',
          }}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={() => handleTextChange('L2')}
          // dangerouslySetInnerHTML={{ __html: block.L2.content }}
        >
          <TokenizedText content={block.L2.content} lang={targetLang} side="L2" />
          {isAiProcessing && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg z-10 backdrop-blur-[1px]">
               <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Block Actions Overlay */}
      {isSelected && (
        <div className="absolute -right-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); handleAiTranslate(); }}
            disabled={isAiProcessing}
            title="AI Translate (L1 → L2)"
            className="p-1.5 bg-primary text-primary-foreground rounded-md shadow-sm hover:scale-110 transition-transform disabled:opacity-50"
          >
            {isAiProcessing ? <Loader2 className="h-[14px] w-[14px] animate-spin" /> : <Sparkles className="h-[14px] w-[14px]" />}
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); handleAiAnnotate(); }}
            disabled={isAiProcessing}
            title="AI Deep Analysis"
            className="p-1.5 bg-accent text-accent-foreground rounded-md shadow-sm hover:scale-110 transition-transform disabled:opacity-50"
          >
            <BookOpen className="h-[14px] w-[14px]" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 bg-destructive text-destructive-foreground rounded-md shadow-sm hover:scale-110 transition-transform"
          >
            <Trash2 className="h-[14px] w-[14px]" />
          </button>
        </div>
      )}
    </div>
  );
}
