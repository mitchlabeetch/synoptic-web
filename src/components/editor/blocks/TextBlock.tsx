// src/components/editor/blocks/TextBlock.tsx
// PURPOSE: Bilingual text block with professional rich text editing (Tiptap)
// ACTION: Renders L1/L2 content with proper DOM management, formatting support, and AI integration
// MECHANISM: Uses Tiptap (ProseMirror) instead of raw contentEditable to avoid React/DOM conflicts

'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { TextBlock } from '@/types/blocks';
import { isRTL, getDefaultFont, getLanguageByCode } from '@/data/languages';
import { useProjectStore } from '@/lib/store/projectStore';
import { useGlossaryStore } from '@/lib/store/glossaryStore';
import { applyGlossaryToTranslation } from '@/lib/glossary/applyGlossary';
import { cn } from '@/lib/utils';
import { TiptapEditor, TiptapEditorRef } from '../TiptapEditor';
import { LinePlayer } from '../tools/LinePlayer';
import { GlossaryLintWarning } from '../GlossaryLintWarning';

import { Sparkles, Loader2, Trash2, BookOpen, Volume2, Shield } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

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
  const { settings, pushHistory, currentPageIndex, content } = useProjectStore();
  const { entries, lintContent, warnings } = useGlossaryStore();
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [l1Selection, setL1Selection] = useState({ hasSelection: false, text: '' });
  const [l2Selection, setL2Selection] = useState({ hasSelection: false, text: '' });

  const l1EditorRef = useRef<TiptapEditorRef>(null);
  const l2EditorRef = useRef<TiptapEditorRef>(null);

  // Get current page ID for linting
  const currentPageId = content?.pages[currentPageIndex]?.id || 'page-0';
  
  // Get warnings for this block
  const blockWarnings = warnings.filter(w => w.blockId === block.id);

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
      
      // Lint L1 content for glossary violations
      const plainText = html.replace(/<[^>]*>/g, '');
      lintContent(plainText, block.id, currentPageId, 'L1');
    }
  }, [block.L1, block.id, currentPageId, onUpdate, pushHistory, lintContent]);

  const handleL2Blur = useCallback((html: string) => {
    if (html !== block.L2.content) {
      onUpdate({
        L2: { ...block.L2, content: html }
      });
      pushHistory();
      
      // Lint L2 content for glossary violations
      const plainText = html.replace(/<[^>]*>/g, '');
      lintContent(plainText, block.id, currentPageId, 'L2');
    }
  }, [block.L2, block.id, currentPageId, onUpdate, pushHistory, lintContent]);

  const handleAiTranslate = async () => {
    if (!block.L1.content || isAiProcessing) return;
    
    setIsAiProcessing(true);
    try {
      // Get plain text for translation
      const plainText = l1EditorRef.current?.getText() || block.L1.content.replace(/<[^>]*>/g, '');
      
      // Pass glossary entries to enable AI pre-injection
      // Format entries for the API (minimize payload)
      const glossaryPayload = entries.map(e => ({
        sourceTerm: e.sourceTerm,
        targetTerm: e.targetTerm
      }));
      
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: plainText,
          sourceLang,
          targetLang,
          glossary: glossaryPayload // NEW: Pass glossary for AI pre-injection
        }),
      });

      if (!response.ok) throw new Error('Translation failed');
      const data = await response.json();

      // Double-layer enforcement: Apply Glossary Guard overrides AFTER AI translation
      // This catches any terms the AI might have missed despite the prompt context
      const finalTranslation = entries.length > 0
        ? applyGlossaryToTranslation(data.translation, entries, 'L2')
        : data.translation;

      // Update L2 content and sync editor
      onUpdate({
        L2: { ...block.L2, content: finalTranslation }
      });
      l2EditorRef.current?.setContent(finalTranslation);
      pushHistory();
      
      // Lint the new translation for any remaining violations
      const plainTranslation = finalTranslation.replace(/<[^>]*>/g, '');
      lintContent(plainTranslation, block.id, currentPageId, 'L2');
      
      // Show success toast with AI credit usage
      toast.credits(1, data.creditsRemaining);
    } catch (error) {
      console.error('AI Translation Error:', error);
      toast.error('Translation failed', { description: 'Please check your connection and try again.' });
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
      
      // Use streaming for long texts to avoid timeout issues
      // Threshold: 500+ combined characters uses streaming endpoint
      const useStreaming = (l1Text.length + l2Text.length) >= 500;
      
      const endpoint = useStreaming ? '/api/ai/annotate/stream' : '/api/ai/annotate';
      
      const response = await fetch(endpoint, {
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
      
      let data: Record<string, unknown> | undefined;
      
      if (useStreaming) {
        // Parse SSE stream and get final result
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');
        
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // Look for 'complete' event
          const completeMatch = buffer.match(/event:\s*complete\ndata:\s*(.+)/);
          if (completeMatch) {
            try {
              data = JSON.parse(completeMatch[1]);
              break;
            } catch {
              // Continue reading if parse fails
            }
          }
          
          // Check for error event
          const errorMatch = buffer.match(/event:\s*error\ndata:\s*(.+)/);
          if (errorMatch) {
            const errorData = JSON.parse(errorMatch[1]);
            throw new Error(errorData.message || 'Streaming annotation failed');
          }
        }
        
        // If we finished reading without finding complete event
        if (!data) throw new Error('Stream ended without result');
      } else {
        data = await response.json();
      }
      
      // Ensure data is defined at this point
      if (!data) throw new Error('No annotation data received');
      
      // Type-safe access to annotation data
      const annotationData = data as {
        wordGroups?: Array<Record<string, unknown>>;
        arrows?: Array<Record<string, unknown>>;
        notes?: Array<Record<string, unknown>>;
        creditsUsed?: number;
      };

      // Add annotations to store
      const store = useProjectStore.getState();
      
      annotationData.wordGroups?.forEach((g) => {
        store.addWordGroup({
          id: `wg-${block.id}-${Math.random().toString(36).substr(2, 9)}`,
          blockId: block.id,
          ...g
        } as Parameters<typeof store.addWordGroup>[0]);
      });

      annotationData.arrows?.forEach((a) => {
        store.addArrow({
          id: `ar-${block.id}-${Math.random().toString(36).substr(2, 9)}`,
          blockId: block.id,
          ...a
        } as Parameters<typeof store.addArrow>[0]);
      });

      annotationData.notes?.forEach((n) => {
        store.addNote({
          id: `nt-${block.id}-${Math.random().toString(36).substr(2, 9)}`,
          blockId: block.id,
          ...n
        } as Parameters<typeof store.addNote>[0]);
      });

      // Show success toast
      if (annotationData.creditsUsed) {
        toast.credits(annotationData.creditsUsed);
      }

    } catch (error) {
      console.error('AI Annotation Error:', error);
      toast.error('Annotation failed', { description: (error as Error).message });
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
  // Note: bilingual-grid collapses to vertical stack on mobile (< 768px) for readability
  const layoutStyles = {
    'side-by-side': cn(
      'bilingual-grid gap-8',
      direction === 'rtl' && 'book-grid-rtl'
    ),
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
    <article
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
      aria-label={block.isTitle ? 'Title block' : block.isChapterHeading ? 'Chapter heading block' : 'Text block'}
      aria-selected={isSelected}
      aria-busy={isAiProcessing}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
        if (e.key === 'Delete' && isSelected) {
          e.preventDefault();
          onDelete();
        }
      }}
    >
      <div className={cn(
        layoutStyles[currentLayout as keyof typeof layoutStyles],
        (block.isTitle || block.isChapterHeading) && "text-center"
      )}>
        {/* L1 (Source Language) */}
        <section 
          className={cn(
            'p-2 rounded transition-colors',
            isEditing && 'hover:bg-primary/5 focus-within:bg-primary/5 focus-within:ring-1 focus-within:ring-primary/20',
            block.isTitle && 'text-3xl font-extrabold tracking-tight mb-4',
            block.isChapterHeading && 'text-2xl font-bold italic text-muted-foreground mb-4',
            `script-${l1Script}`
          )}
          lang={sourceLang}
          aria-label={`Source text (${sourceLang.toUpperCase()})`}
        >
          <TiptapEditor
            ref={l1EditorRef}
            content={block.L1.content}
            editable={isEditing}
            direction={isL1RTL ? 'rtl' : 'ltr'}
            placeholder="Enter source text..."
            locale={sourceLang}
            style={getEditorStyle(block.L1, true)}
            onBlur={handleL1Blur}
            onSelectionChange={(hasSelection, text) => setL1Selection({ hasSelection, text })}
            onAiExplain={() => handleAiExplain('L1')}
            isAiProcessing={isAiProcessing}
          />
        </section>

        {/* L2 (Target Language) */}
        <section 
          className={cn(
            'p-2 rounded transition-colors opacity-80 relative',
            isEditing && 'hover:bg-primary/5 focus-within:bg-primary/5 focus-within:ring-1 focus-within:ring-primary/20',
            block.isTitle && 'text-3xl font-extrabold tracking-tight mb-4',
            block.isChapterHeading && 'text-2xl font-bold italic text-muted-foreground mb-4',
            `script-${l2Script}`
          )}
          lang={targetLang}
          aria-label={`Translation (${targetLang.toUpperCase()})`}
        >
          {/* Glossary Lint Warnings */}
          {blockWarnings.length > 0 && (
            <GlossaryLintWarning 
              blockId={block.id}
              onFix={(oldText, newText) => {
                // Replace the term in L2 content
                const currentContent = block.L2.content;
                const updatedContent = currentContent.replace(oldText, newText);
                onUpdate({ L2: { ...block.L2, content: updatedContent } });
                l2EditorRef.current?.setContent(updatedContent);
              }}
              className="mb-2"
            />
          )}
          
          <TiptapEditor
            ref={l2EditorRef}
            content={block.L2.content}
            editable={isEditing}
            direction={isL2RTL ? 'rtl' : 'ltr'}
            placeholder="Enter translation..."
            locale={targetLang}
            style={getEditorStyle(block.L2, false)}
            onBlur={handleL2Blur}
            onSelectionChange={(hasSelection, text) => setL2Selection({ hasSelection, text })}
            onAiExplain={() => handleAiExplain('L2')}
            isAiProcessing={isAiProcessing}
          />
          
          {isAiProcessing && (
            <div 
              className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg z-10 backdrop-blur-[1px]"
              role="status"
              aria-label="AI is processing"
            >
               <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
            </div>
          )}
        </section>
      </div>

      {/* Block Actions Overlay */}
      {isSelected && (
        <div 
          className="absolute -right-14 top-0 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          role="toolbar"
          aria-label="Block actions"
        >
          {/* Audio Players Section */}
          <div 
            className="flex flex-col gap-0.5 p-1 bg-background/90 backdrop-blur-sm rounded-lg border shadow-sm"
            role="group"
            aria-label="Audio playback"
          >
            {/* L2 Player (Target - Priority) */}
            {block.L2.content && (
              <LinePlayer 
                text={block.L2.content.replace(/<[^>]*>/g, '')} 
                lang={targetLang}
                variant="compact"
                className="opacity-100"
              />
            )}
            {/* L1 Player (Source - Secondary) */}
            {block.L1.content && (
              <LinePlayer 
                text={block.L1.content.replace(/<[^>]*>/g, '')} 
                lang={sourceLang}
                variant="compact"
                className="opacity-70 hover:opacity-100"
              />
            )}
          </div>

          {/* AI Actions */}
          <button 
            onClick={(e) => { e.stopPropagation(); handleAiTranslate(); }}
            disabled={isAiProcessing}
            aria-label="AI Translate from source to target language"
            title="AI Translate (L1 → L2)"
            className="p-1.5 bg-primary text-primary-foreground rounded-md shadow-sm hover:scale-110 transition-transform disabled:opacity-50"
          >
            {isAiProcessing ? <Loader2 className="h-[14px] w-[14px] animate-spin" aria-hidden="true" /> : <Sparkles className="h-[14px] w-[14px]" aria-hidden="true" />}
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); handleAiAnnotate(); }}
            disabled={isAiProcessing}
            aria-label="AI Deep Analysis"
            title="AI Deep Analysis"
            className="p-1.5 bg-accent text-accent-foreground rounded-md shadow-sm hover:scale-110 transition-transform disabled:opacity-50"
          >
            <BookOpen className="h-[14px] w-[14px]" aria-hidden="true" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label="Delete this block"
            title="Delete block"
            className="p-1.5 bg-destructive text-destructive-foreground rounded-md shadow-sm hover:scale-110 transition-transform"
          >
            <Trash2 className="h-[14px] w-[14px]" aria-hidden="true" />
          </button>
        </div>
      )}
    </article>
  );
}

