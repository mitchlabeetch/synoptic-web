// src/components/editor/tools/GrammarPainter.tsx
// PURPOSE: A speed-painting tool for manual pedagogical markup - click words to assign semantic colors
// ACTION: Provides a color palette toolbar; when active, clicking words instantly applies grammar highlights
// MECHANISM: Toggles between "paint mode" and normal editing; uses Tiptap marks to store color data

'use client';

import React, { useState, useCallback } from 'react';
import { 
  Palette, 
  Paintbrush, 
  X, 
  CircleDot, 
  Eraser,
  Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export type GrammarType = 
  | 'subject' 
  | 'verb' 
  | 'object' 
  | 'adjective' 
  | 'adverb' 
  | 'article'
  | 'complement'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'custom';

export interface GrammarColor {
  type: GrammarType;
  color: string;
  label: string;
  shortcut?: string;
}

export interface GrammarPainterProps {
  isActive: boolean;
  onToggle: () => void;
  selectedColor: GrammarColor | null;
  onColorSelect: (color: GrammarColor | null) => void;
  onClearAll?: () => void;
  className?: string;
}

// ═══════════════════════════════════════════
// DEFAULT PALETTE (Pedagogical Colors)
// ═══════════════════════════════════════════

export const DEFAULT_GRAMMAR_PALETTE: GrammarColor[] = [
  { type: 'subject', color: '#93c5fd', label: 'Subject', shortcut: '1' },           // Blue
  { type: 'verb', color: '#fca5a5', label: 'Verb', shortcut: '2' },                  // Red
  { type: 'object', color: '#86efac', label: 'Object', shortcut: '3' },              // Green
  { type: 'adjective', color: '#fcd34d', label: 'Adjective', shortcut: '4' },        // Yellow
  { type: 'adverb', color: '#c4b5fd', label: 'Adverb', shortcut: '5' },              // Purple
  { type: 'article', color: '#fdba74', label: 'Article', shortcut: '6' },            // Orange
  { type: 'complement', color: '#a5f3fc', label: 'Complement', shortcut: '7' },      // Cyan
  { type: 'pronoun', color: '#f9a8d4', label: 'Pronoun', shortcut: '8' },            // Pink
  { type: 'preposition', color: '#d9f99d', label: 'Preposition', shortcut: '9' },    // Lime
  { type: 'conjunction', color: '#e5e7eb', label: 'Conjunction', shortcut: '0' },    // Gray
];

// ═══════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════

export function GrammarPainter({
  isActive,
  onToggle,
  selectedColor,
  onColorSelect,
  onClearAll,
  className
}: GrammarPainterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations('Studio');

  // Handle color selection
  const handleColorClick = useCallback((color: GrammarColor) => {
    if (selectedColor?.type === color.type) {
      // Deselect if clicking same color
      onColorSelect(null);
    } else {
      onColorSelect(color);
    }
  }, [selectedColor, onColorSelect]);

  // Handle eraser (clear color)
  const handleEraser = useCallback(() => {
    onColorSelect(null);
  }, [onColorSelect]);

  // Keyboard shortcuts
  React.useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys for color selection
      const key = e.key;
      const paletteItem = DEFAULT_GRAMMAR_PALETTE.find(c => c.shortcut === key);
      if (paletteItem) {
        e.preventDefault();
        handleColorClick(paletteItem);
      }
      
      // Escape to deactivate
      if (key === 'Escape') {
        onToggle();
      }
      
      // E for eraser
      if (key === 'e' || key === 'E') {
        handleEraser();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleColorClick, handleEraser, onToggle]);

  return (
    <div className={cn(
      "flex items-center gap-1",
      className
    )}>
      <TooltipProvider>
        {/* Main Toggle Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isActive ? "default" : "outline"}
              size="icon"
              onClick={onToggle}
              className={cn(
                "h-8 w-8 transition-all",
                isActive && "bg-primary text-primary-foreground ring-2 ring-primary/50"
              )}
            >
              <Paintbrush className={cn(
                "h-4 w-4",
                isActive && "animate-pulse"
              )} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs font-medium">
              {isActive ? t('exitPaintMode') : t('grammarPainter')}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isActive ? 'ESC' : 'G'}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Color Palette (visible when active) */}
        {isActive && (
          <div className={cn(
            "flex items-center gap-0.5 p-1 bg-background/95 backdrop-blur-sm rounded-lg border shadow-lg",
            "animate-in slide-in-from-left-2 duration-200"
          )}>
            {/* Palette colors */}
            {DEFAULT_GRAMMAR_PALETTE.slice(0, isExpanded ? undefined : 6).map((color) => (
              <Tooltip key={color.type}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleColorClick(color)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-all hover:scale-110",
                      "ring-offset-background focus:outline-none focus:ring-2 focus:ring-offset-1",
                      selectedColor?.type === color.type && "ring-2 ring-foreground scale-110"
                    )}
                    style={{ backgroundColor: color.color }}
                    title={`${color.label} (${color.shortcut})`}
                  >
                    {selectedColor?.type === color.type && (
                      <CircleDot className="h-3 w-3 m-auto text-foreground/70" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px]">
                  {color.label} <kbd className="ml-1 text-muted-foreground">{color.shortcut}</kbd>
                </TooltipContent>
              </Tooltip>
            ))}

            {/* Expand/Collapse */}
            {DEFAULT_GRAMMAR_PALETTE.length > 6 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-6 h-6 rounded-full border border-dashed border-muted-foreground/30 
                           flex items-center justify-center text-muted-foreground hover:border-foreground
                           hover:text-foreground transition-colors"
              >
                <span className="text-[10px] font-bold">
                  {isExpanded ? '−' : '+'}
                </span>
              </button>
            )}

            {/* Separator */}
            <div className="w-px h-5 bg-border mx-1" />

            {/* Eraser */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEraser}
                  className={cn(
                    "h-6 w-6",
                    !selectedColor && "bg-muted"
                  )}
                >
                  <Eraser className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                Eraser <kbd className="ml-1 text-muted-foreground">E</kbd>
              </TooltipContent>
            </Tooltip>

            {/* Clear All */}
            {onClearAll && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClearAll}
                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px]">
                  Clear All Colors
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Active Color Indicator */}
        {isActive && selectedColor && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
            <div 
              className="w-3 h-3 rounded-full ring-1 ring-foreground/20"
              style={{ backgroundColor: selectedColor.color }}
            />
            <span className="text-[10px] font-medium text-muted-foreground">
              {selectedColor.label}
            </span>
          </div>
        )}
      </TooltipProvider>
    </div>
  );
}

// ═══════════════════════════════════════════
// HOOK FOR INTEGRATING WITH TIPTAP
// ═══════════════════════════════════════════

import type { Editor } from '@tiptap/react';
import { useEffect } from 'react';

interface UseGrammarPainterOptions {
  editor: Editor | null;
}

export function useGrammarPainter(options?: UseGrammarPainterOptions) {
  const [isActive, setIsActive] = useState(false);
  const [selectedColor, setSelectedColor] = useState<GrammarColor | null>(null);
  const editor = options?.editor;

  const toggle = useCallback(() => {
    setIsActive(prev => !prev);
    if (isActive) {
      setSelectedColor(null);
    }
  }, [isActive]);

  const selectColor = useCallback((color: GrammarColor | null) => {
    setSelectedColor(color);
  }, []);

  // Get the CSS class or inline style for a grammar type
  const getGrammarStyle = useCallback((type: GrammarType) => {
    const color = DEFAULT_GRAMMAR_PALETTE.find(c => c.type === type);
    if (!color) return {};
    
    return {
      backgroundColor: color.color,
      borderBottom: `2px solid ${color.color}`,
      paddingBottom: '1px'
    };
  }, []);

  // Apply grammar mark to current selection
  const applyMark = useCallback(() => {
    if (!editor || !selectedColor) return;
    
    const { from, to } = editor.state.selection;
    if (from === to) return; // No selection
    
    // Check if already painted with this color
    if (editor.isActive('grammar', { type: selectedColor.type })) return;
    
    // Apply the grammar mark
    editor.chain()
      .focus()
      .setGrammar({ type: selectedColor.type, color: selectedColor.color })
      .run();
  }, [editor, selectedColor]);

  // Clear all grammar marks from current selection
  const clearMark = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetGrammar().run();
  }, [editor]);

  // Clear all grammar marks from the entire document
  const clearAll = useCallback(() => {
    if (!editor) return;
    
    editor.chain()
      .focus()
      .selectAll()
      .unsetGrammar()
      .run();
  }, [editor]);

  // ═══════════════════════════════════════════
  // AUTO-PAINT EFFECT: Apply mark on text selection
  // ═══════════════════════════════════════════
  useEffect(() => {
    if (!editor || !isActive || !selectedColor) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      if (from === to) return; // No selection

      // Check if we already painted this exact selection to avoid loops
      if (editor.isActive('grammar', { type: selectedColor.type })) return;

      // Apply the mark immediately
      editor.chain()
        .setGrammar({ type: selectedColor.type, color: selectedColor.color })
        .run();
    };

    editor.on('selectionUpdate', handleSelectionUpdate);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, isActive, selectedColor]);

  return {
    isActive,
    selectedColor,
    toggle,
    selectColor,
    getGrammarStyle,
    applyMark,
    clearMark,
    clearAll,
    palette: DEFAULT_GRAMMAR_PALETTE
  };
}

export default GrammarPainter;

