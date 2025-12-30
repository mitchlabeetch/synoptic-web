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
import { useCallback, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Sparkles, Loader2
} from 'lucide-react';
import { WordPolisher } from '@/components/tools/WordPolisher';
import { AIDraftButton } from '@/components/tools/AIDraftButton';
import { GrammarChecker } from '@/components/tools/GrammarChecker';

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
  onUpdate?: (html: string) => void;
  onBlur?: (html: string) => void;
  onFocus?: () => void;
  onSelectionChange?: (hasSelection: boolean, selectedText: string) => void;
  onAiExplain?: () => void;
  isAiProcessing?: boolean;
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

    // Handle word replacement from WordPolisher
    const handleWordReplace = useCallback((newWord: string) => {
      if (!editor) return;
      // Replace the current selection with the new word
      editor.chain().focus().insertContent(newWord).run();
    }, [editor]);

    if (!editor) {
      return null;
    }

    // Check if selection is a single word (for WordPolisher)
    const isSingleWord = selectedText.trim().split(/\s+/).length === 1 && selectedText.trim().length > 1;

    return (
      <div className="tiptap-wrapper relative">
        {/* Bubble Menu - appears on text selection */}
        <BubbleMenu
          editor={editor}
          className="flex items-center gap-0.5 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-1"
        >
          <button
            type="button"
            onClick={() => toggleFormat('bold')}
            className={cn(
              'p-1.5 rounded transition-colors',
              editor.isActive('bold')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => toggleFormat('italic')}
            className={cn(
              'p-1.5 rounded transition-colors',
              editor.isActive('italic')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => toggleFormat('underline')}
            className={cn(
              'p-1.5 rounded transition-colors',
              editor.isActive('underline')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </button>

          <div className="w-px h-4 bg-border mx-1" />

          <button
            type="button"
            onClick={() => setAlignment('left')}
            className={cn(
              'p-1.5 rounded transition-colors',
              editor.isActive({ textAlign: 'left' })
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
            title="Align Left"
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setAlignment('center')}
            className={cn(
              'p-1.5 rounded transition-colors',
              editor.isActive({ textAlign: 'center' })
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
            title="Align Center"
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setAlignment('right')}
            className={cn(
              'p-1.5 rounded transition-colors',
              editor.isActive({ textAlign: 'right' })
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
            title="Align Right"
          >
            <AlignRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setAlignment('justify')}
            className={cn(
              'p-1.5 rounded transition-colors',
              editor.isActive({ textAlign: 'justify' })
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
            title="Justify"
          >
            <AlignJustify className="h-3.5 w-3.5" />
          </button>

          {/* Word Polisher - Only for single word selections */}
          {isSingleWord && (
            <>
              <div className="w-px h-4 bg-border mx-1" />
              <WordPolisher 
                selectedText={selectedText.trim()} 
                onReplace={handleWordReplace}
              />
            </>
          )}

          {/* AI Draft - Quick translation for selected text */}
          {selectedText.trim().length > 0 && (
            <>
              <div className="w-px h-4 bg-border mx-1" />
              <AIDraftButton
                selectedText={selectedText.trim()}
                onApply={handleWordReplace}
              />
            </>
          )}

          {/* Grammar Check - For longer selections */}
          {selectedText.trim().length > 10 && (
            <>
              <div className="w-px h-4 bg-border mx-1" />
              <GrammarChecker
                text={selectedText.trim()}
                onFix={handleWordReplace}
              />
            </>
          )}

          {onAiExplain && (
            <>
              <div className="w-px h-4 bg-border mx-1" />
              <button
                type="button"
                onClick={onAiExplain}
                disabled={isAiProcessing}
                className="p-1.5 rounded transition-colors bg-violet-500/20 hover:bg-violet-500/30 text-violet-600 disabled:opacity-50"
                title="AI Explain Selection"
              >
                {isAiProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
              </button>
            </>
          )}
        </BubbleMenu>

        {/* Main Editor Content */}
        <EditorContent editor={editor} />
      </div>
    );
  }
);

