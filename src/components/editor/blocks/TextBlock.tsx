// src/components/editor/blocks/TextBlock.tsx
// PURPOSE: Bilingual text block with professional rich text editing (Tiptap)
// ACTION: Renders L1/L2 content with proper DOM management, formatting support, and AI integration
// MECHANISM: Uses Tiptap (ProseMirror) instead of raw contentEditable to avoid React/DOM conflicts

'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { TextBlock } from '@/types/blocks';
import { isRTL, getDefaultFont, getLanguageByCode } from '@/data/languages';
import { useProjectStore } from '@/lib/store/projectStore';
import { cn } from '@/lib/utils';
import { TiptapEditor, TiptapEditorRef } from '../TiptapEditor';

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
  const { settings, pushHistory } = useProjectStore();
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [l1Selection, setL1Selection] = useState({ hasSelection: false, text: '' });
  const [l2Selection, setL2Selection] = useState({ hasSelection: false, text: '' });

  const l1EditorRef = useRef<TiptapEditorRef>(null);
  const l2EditorRef = useRef<TiptapEditorRef>(null);

  const direction = useProjectStore((state) => {
    if (state.settings.direction !== 'auto') return state.settings.direction;
    return isRTL(sourceLang) ? 'rtl' : 'ltr';
  });

  const isL1RTL = isRTL(sourceLang);
  const isL2RTL = isRTL(targetLang);

  const l1Script = useMemo(() => getLanguageByCode(sourceLang)?.script || 'latin', [sourceLang]);
  const l2Script = useMemo(() => getLanguageByCode(targetLang)?.script || 'latin', [targetLang]);

  // Handle content updates on blur (not every keystroke - performance optimization)
  const handleL1Blur = useCallback((html: string) => {
    if (html !== block.L1.content) {
      onUpdate({
        L1: { ...block.L1, content: html }
      });
      // Push history on blur, not every keystroke
      pushHistory();
    }
  }, [block.L1, onUpdate, pushHistory]);

  const handleL2Blur = useCallback((html: string) => {
    if (html !== block.L2.content) {
      onUpdate({
        L2: { ...block.L2, content: html }
      });
      pushHistory();
    }
  }, [block.L2, onUpdate, pushHistory]);

  const handleAiTranslate = async () => {
    if (!block.L1.content || isAiProcessing) return;
    
    setIsAiProcessing(true);
    try {
      // Get plain text for translation
      const plainText = l1EditorRef.current?.getText() || block.L1.content.replace(/<[^>]*>/g, '');
      
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: plainText,
          sourceLang,
          targetLang
        }),
      });

      if (!response.ok) throw new Error('Translation failed');
      const data = await response.json();

      // Update L2 content and sync editor
      onUpdate({
        L2: { ...block.L2, content: data.translation }
      });
      l2EditorRef.current?.setContent(data.translation);
      pushHistory();
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
      const l1Text = l1EditorRef.current?.getText() || block.L1.content.replace(/<[^>]*>/g, '');
      const l2Text = l2EditorRef.current?.getText() || block.L2.content.replace(/<[^>]*>/g, '');
      
      const response = await fetch('/api/ai/annotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          L1Text: l1Text,
          L2Text: l2Text,
          L1Lang: sourceLang,
          L2Lang: targetLang
        }),
      });

      if (!response.ok) throw new Error('Annotation failed');
      const data = await response.json();

      // Add annotations to store
      const store = useProjectStore.getState();
      
      data.wordGroups?.forEach((g: Record<string, unknown>) => {
        store.addWordGroup({
          id: `wg-${block.id}-${Math.random().toString(36).substr(2, 9)}`,
          blockId: block.id,
          ...g
        } as Parameters<typeof store.addWordGroup>[0]);
      });

      data.arrows?.forEach((a: Record<string, unknown>) => {
        store.addArrow({
          id: `ar-${block.id}-${Math.random().toString(36).substr(2, 9)}`,
          blockId: block.id,
          ...a
        } as Parameters<typeof store.addArrow>[0]);
      });

      data.notes?.forEach((n: Record<string, unknown>) => {
        store.addNote({
          id: `nt-${block.id}-${Math.random().toString(36).substr(2, 9)}`,
          blockId: block.id,
          ...n
        } as Parameters<typeof store.addNote>[0]);
      });

    } catch (error) {
      console.error('AI Annotation Error:', error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAiExplain = async (lang: 'L1' | 'L2') => {
    const selection = lang === 'L1' ? l1Selection : l2Selection;
    if (!selection.hasSelection || isAiProcessing) return;
    
    setIsAiProcessing(true);
    try {
      const context = lang === 'L1' 
        ? l1EditorRef.current?.getText() 
        : l2EditorRef.current?.getText();
      const language = lang === 'L1' ? sourceLang : targetLang;

      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          word: selection.text, 
          context, 
          language 
        }),
      });

      if (!response.ok) throw new Error('AI explanation failed');
      const data = await response.json();
      
      // TODO: Replace with premium modal component
      alert(`${data.role?.toUpperCase() || 'INFO'}: ${data.explanation}\n\nExamples: ${data.examples?.join(', ')}`);
    } catch (error) {
      console.error('AI Explain Error:', error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const currentLayout = block.layout || settings.layout || 'side-by-side';

  // Layout grid classes
  const layoutStyles = {
    'side-by-side': direction === 'rtl' ? 'book-grid-rtl gap-8' : 'book-grid-ltr gap-8',
    'interlinear': 'flex flex-col gap-1',
    'stacked': 'flex flex-col gap-4',
    'alternating': 'flex flex-col gap-4',
  };

  // Common editor styles
  const getEditorStyle = (langContent: typeof block.L1, isL1: boolean): React.CSSProperties => ({
    direction: (isL1 ? isL1RTL : isL2RTL) ? 'rtl' : 'ltr',
    fontFamily: langContent.formatting?.fontFamily || 
      ((block.isTitle || block.isChapterHeading) ? settings.fonts.heading : settings.fonts.body),
    fontSize: langContent.formatting?.fontSize 
      ? `${langContent.formatting.fontSize}px` 
      : `${settings.typography.baseSize}pt`,
    color: langContent.formatting?.color || (isL1 ? settings.colors.primary : settings.colors.secondary),
    textAlign: langContent.formatting?.alignment || 'start',
  });

  return (
    <div
      className={cn(
        'group relative rounded-xl transition-all duration-300 outline-none mb-4 border border-transparent',
        isSelected 
          ? 'ring-2 ring-primary ring-offset-4 bg-background shadow-lg' 
          : 'hover:border-primary/20 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 hover:shadow-sm'
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
      <div className={cn(
        layoutStyles[currentLayout as keyof typeof layoutStyles],
        (block.isTitle || block.isChapterHeading) && "text-center"
      )}>
        {/* L1 (Source Language) */}
        <div 
          className={cn(
            'p-2 rounded transition-colors',
            isEditing && 'hover:bg-primary/5 focus-within:bg-primary/5 focus-within:ring-1 focus-within:ring-primary/20',
            block.isTitle && 'text-3xl font-extrabold tracking-tight mb-4',
            block.isChapterHeading && 'text-2xl font-bold italic text-muted-foreground mb-4',
            `script-${l1Script}`
          )}
          lang={sourceLang}
        >
          <TiptapEditor
            ref={l1EditorRef}
            content={block.L1.content}
            editable={isEditing}
            direction={isL1RTL ? 'rtl' : 'ltr'}
            placeholder="Enter source text..."
            style={getEditorStyle(block.L1, true)}
            onBlur={handleL1Blur}
            onSelectionChange={(hasSelection, text) => setL1Selection({ hasSelection, text })}
            onAiExplain={() => handleAiExplain('L1')}
            isAiProcessing={isAiProcessing}
          />
        </div>

        {/* L2 (Target Language) */}
        <div 
          className={cn(
            'p-2 rounded transition-colors opacity-80 relative',
            isEditing && 'hover:bg-primary/5 focus-within:bg-primary/5 focus-within:ring-1 focus-within:ring-primary/20',
            block.isTitle && 'text-3xl font-extrabold tracking-tight mb-4',
            block.isChapterHeading && 'text-2xl font-bold italic text-muted-foreground mb-4',
            `script-${l2Script}`
          )}
          lang={targetLang}
        >
          <TiptapEditor
            ref={l2EditorRef}
            content={block.L2.content}
            editable={isEditing}
            direction={isL2RTL ? 'rtl' : 'ltr'}
            placeholder="Enter translation..."
            style={getEditorStyle(block.L2, false)}
            onBlur={handleL2Blur}
            onSelectionChange={(hasSelection, text) => setL2Selection({ hasSelection, text })}
            onAiExplain={() => handleAiExplain('L2')}
            isAiProcessing={isAiProcessing}
          />
          
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
