// src/components/editor/TiptapEditor.tsx
// PURPOSE: Professional rich text editor component using Tiptap/ProseMirror
// ACTION: Provides a robust contentEditable replacement with proper DOM management
// MECHANISM: Uses Tiptap extensions for formatting, maintains proper cursor handling

'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { GrammarMark } from './extensions/GrammarMark';
import { ArrowAnchor } from './extensions/ArrowAnchor';
import { useCallback, useEffect, forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Sparkles, Loader2, MoreHorizontal, ChevronDown
} from 'lucide-react';
import { WordPolisher } from '@/components/tools/WordPolisher';
import { AIDraftButton } from '@/components/tools/AIDraftButton';
import { GrammarChecker } from '@/components/tools/GrammarChecker';
import { AddToGlossary } from '@/components/tools/AddToGlossary';
import { isSingleWord } from '@/lib/utils/wordTokenizer';
import { sanitizePastedHTML } from '@/lib/utils/pasteSanitizer';

export interface TiptapEditorRef {
  getHTML: () => string;
  getText: () => string;
  setContent: (content: string) => void;
  focus: () => void;
  getEditor: () => ReturnType<typeof useEditor>;
}

interface TiptapEditorProps {
  content: string;
  placeholder?: string;
  editable?: boolean;
  direction?: 'ltr' | 'rtl';
  className?: string;
  style?: React.CSSProperties;
  locale?: string; // For word tokenization (CJK support)
  onUpdate?: (html: string) => void;
  onBlur?: (html: string) => void;
  onFocus?: () => void;
  onSelectionChange?: (hasSelection: boolean, selectedText: string) => void;
  onAiExplain?: () => void;
  isAiProcessing?: boolean;
}

// Accessible icon button component
function IconButton({
  onClick,
  isActive,
  title,
  ariaLabel,
  disabled,
  className,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'p-1.5 rounded transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={isActive}
    >
      {children}
    </button>
  );
}

export const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  function TiptapEditor(
    {
      content,
      placeholder = 'Start writing...',
      editable = true,
      direction = 'ltr',
      className,
      style,
      locale,
      onUpdate,
      onBlur,
      onFocus,
      onSelectionChange,
      onAiExplain,
      isAiProcessing = false,
    },
    ref
  ) {
    const [selectedText, setSelectedText] = useState('');
    const [showOverflow, setShowOverflow] = useState(false);
    const bubbleMenuRef = useRef<HTMLDivElement>(null);
    const selectionRangeRef = useRef<{ from: number; to: number } | null>(null);
    
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          // Disable some features we don't need
          codeBlock: false,
          blockquote: {
            HTMLAttributes: {
              class: 'border-l-4 border-primary/30 pl-4 italic',
            },
          },
          // UndoRedo extension is included in StarterKit
          // It automatically groups rapid changes within 500ms (newGroupDelay default)
          undoRedo: {
            depth: 100,
            newGroupDelay: 500, // Group rapid edits into single undo steps
          },
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass: 'is-editor-empty opacity-50',
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Underline,
        TextStyle,
        Color.configure({
          types: ['textStyle'],
        }),
        // Grammar Painter Extension - enables semantic highlighting
        GrammarMark,
        // Arrow Anchor Extension - enables syntax arrow connections
        ArrowAnchor,
      ],
      content,
      editable,
      editorProps: {
        attributes: {
          class: cn(
            'prose prose-sm max-w-none dark:prose-invert focus:outline-none min-h-[1.5em]',
            className
          ),
          dir: direction,
          style: Object.entries(style || {})
            .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
            .join('; '),
        },
        // Sanitize pasted HTML from Word/Google Docs
        transformPastedHTML(html) {
          return sanitizePastedHTML(html);
        },
      },
      onUpdate: ({ editor }) => {
        onUpdate?.(editor.getHTML());
      },
      onBlur: ({ editor }) => {
        onBlur?.(editor.getHTML());
      },
      onFocus: () => {
        onFocus?.();
      },
      onSelectionUpdate: ({ editor }) => {
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;
        const text = hasSelection ? editor.state.doc.textBetween(from, to) : '';
        setSelectedText(text);
        // Store selection range for focus restoration
        if (hasSelection) {
          selectionRangeRef.current = { from, to };
        }
        onSelectionChange?.(hasSelection, text);
      },
    });

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() || '',
      getText: () => editor?.getText() || '',
      setContent: (content: string) => editor?.commands.setContent(content),
      focus: () => editor?.commands.focus(),
      getEditor: () => editor,
    }));

    // Sync content when prop changes (from AI or external updates)
    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }, [content, editor]);

    // Toggle format helper
    const toggleFormat = useCallback(
      (format: 'bold' | 'italic' | 'underline') => {
        if (!editor) return;
        switch (format) {
          case 'bold':
            editor.chain().focus().toggleBold().run();
            break;
          case 'italic':
            editor.chain().focus().toggleItalic().run();
            break;
          case 'underline':
            editor.chain().focus().toggleUnderline().run();
            break;
        }
      },
      [editor]
    );

    const setAlignment = useCallback(
      (align: 'left' | 'center' | 'right' | 'justify') => {
        editor?.chain().focus().setTextAlign(align).run();
      },
      [editor]
    );

    // Handle word replacement from WordPolisher/AI tools
    // Ensures focus returns to the exact selection range after AI actions
    const handleWordReplace = useCallback((newWord: string) => {
      if (!editor) return;
      
      // Store current selection for undo grouping
      const storedRange = selectionRangeRef.current;
      
      // Replace the current selection with the new word
      // This is automatically grouped in undo history due to history config
      editor.chain().focus().insertContent(newWord).run();
      
      // Restore focus to editor after modal closes
      requestAnimationFrame(() => {
        editor.commands.focus();
      });
    }, [editor]);

    // Focus management: restore selection after AI modal actions
    const restoreFocusAndSelection = useCallback(() => {
      if (!editor) return;
      
      requestAnimationFrame(() => {
        editor.commands.focus();
        // If we have a stored selection range, try to restore it
        if (selectionRangeRef.current) {
          const { from, to } = selectionRangeRef.current;
          const docLength = editor.state.doc.content.size;
          // Only restore if range is still valid
          if (from <= docLength && to <= docLength) {
            editor.commands.setTextSelection({ from, to });
          }
        }
      });
    }, [editor]);

    if (!editor) {
      return null;
    }

    // Check if selection is a single word (using robust multilingual tokenizer)
    const singleWordCheck = isSingleWord(selectedText.trim(), locale);

    // Determine which secondary actions to show
    const hasAnySelection = selectedText.trim().length > 0;
    const hasLongSelection = selectedText.trim().length > 10;
    
    // Primary formatting buttons (always visible)
    const primaryButtons = (
      <>
        <IconButton
          onClick={() => toggleFormat('bold')}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
          ariaLabel="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton
          onClick={() => toggleFormat('italic')}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
          ariaLabel="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton
          onClick={() => toggleFormat('underline')}
          isActive={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
          ariaLabel="Underline"
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </IconButton>

        <div className="w-px h-4 bg-border mx-1" aria-hidden="true" />

        <IconButton
          onClick={() => setAlignment('left')}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
          ariaLabel="Align text left"
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton
          onClick={() => setAlignment('center')}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
          ariaLabel="Align text center"
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton
          onClick={() => setAlignment('right')}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
          ariaLabel="Align text right"
        >
          <AlignRight className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton
          onClick={() => setAlignment('justify')}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Justify"
          ariaLabel="Justify text"
        >
          <AlignJustify className="h-3.5 w-3.5" />
        </IconButton>
      </>
    );

    // Secondary/AI buttons (may overflow on mobile)
    const secondaryButtons = (
      <>
        {/* Word Polisher - Only for single word selections */}
        {singleWordCheck && (
          <>
            <div className="w-px h-4 bg-border mx-1" aria-hidden="true" />
            <WordPolisher 
              selectedText={selectedText.trim()} 
              onReplace={handleWordReplace}
            />
          </>
        )}

        {/* AI Draft - Quick translation for selected text */}
        {hasAnySelection && (
          <>
            <div className="w-px h-4 bg-border mx-1" aria-hidden="true" />
            <AIDraftButton
              selectedText={selectedText.trim()}
              onApply={handleWordReplace}
            />
          </>
        )}

        {/* Grammar Check - For longer selections */}
        {hasLongSelection && (
          <>
            <div className="w-px h-4 bg-border mx-1" aria-hidden="true" />
            <GrammarChecker
              text={selectedText.trim()}
              onFix={handleWordReplace}
            />
          </>
        )}

        {/* Add to Glossary - For any selection */}
        {hasAnySelection && (
          <>
            <div className="w-px h-4 bg-border mx-1" aria-hidden="true" />
            <AddToGlossary
              selectedText={selectedText.trim()}
            />
          </>
        )}

        {onAiExplain && (
          <>
            <div className="w-px h-4 bg-border mx-1" aria-hidden="true" />
            <IconButton
              onClick={() => {
                onAiExplain();
                // Schedule focus restoration after AI action completes
                setTimeout(restoreFocusAndSelection, 100);
              }}
              disabled={isAiProcessing}
              title="AI Explain Selection"
              ariaLabel="Explain selected text with AI"
              className="bg-violet-500/20 hover:bg-violet-500/30 text-violet-600"
            >
              {isAiProcessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
            </IconButton>
          </>
        )}
      </>
    );

    // Check if we need overflow menu (for mobile/narrow screens)
    const hasSecondaryActions = singleWordCheck || hasAnySelection || hasLongSelection || onAiExplain;

    return (
      <div className="tiptap-wrapper relative">
        {/* Bubble Menu - appears on text selection */}
        <BubbleMenu
          editor={editor}
          className="flex items-center bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-1"
        >
          {/* Scrollable container for overflow handling */}
          <div 
            ref={bubbleMenuRef}
            className="flex items-center gap-0.5 max-w-[calc(100vw-2rem)] overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
            role="toolbar"
            aria-label="Text formatting toolbar"
          >
            {/* Primary formatting buttons - always visible */}
            {primaryButtons}
            
            {/* Secondary buttons - in overflow dropdown on mobile */}
            <div className="hidden sm:contents">
              {secondaryButtons}
            </div>
            
            {/* Overflow dropdown for mobile */}
            {hasSecondaryActions && (
              <div className="sm:hidden relative">
                <div className="w-px h-4 bg-border mx-1" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => setShowOverflow(!showOverflow)}
                  className={cn(
                    'p-1.5 rounded transition-colors hover:bg-muted flex items-center gap-0.5',
                    showOverflow && 'bg-muted'
                  )}
                  aria-label="More formatting options"
                  aria-expanded={showOverflow}
                  aria-haspopup="menu"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                  <ChevronDown className={cn(
                    'h-2.5 w-2.5 transition-transform',
                    showOverflow && 'rotate-180'
                  )} />
                </button>
                
                {/* Overflow dropdown menu */}
                {showOverflow && (
                  <div 
                    className="absolute top-full right-0 mt-1 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-1 flex flex-wrap gap-0.5 min-w-[200px] z-50"
                    role="menu"
                    aria-label="Additional formatting options"
                  >
                    {secondaryButtons}
                  </div>
                )}
              </div>
            )}
          </div>
        </BubbleMenu>

        {/* Main Editor Content */}
        <EditorContent editor={editor} />
      </div>
    );
  }
);
