// src/components/editor/blocks/QuizBlock.tsx
// PURPOSE: Render interactive cloze-deletion exercises (fill-in-the-blank) for workbook generation
// ACTION: Displays a sentence with a hidden word that can be revealed, with auto-generated hints via Datamuse
// MECHANISM: React component with edit/preview modes, integrating with wordPolisher for synonym hints

'use client';

import { useState } from 'react';
import { QuizBlock as QuizBlockType } from '@/types/blocks';
import { wordPolisher } from '@/services/datamuse';
import { cn } from '@/lib/utils';
import { 
  Lightbulb, 
  Eye, 
  EyeOff, 
  GripVertical, 
  Trash2,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuizBlockComponentProps {
  block: QuizBlockType;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<QuizBlockType>) => void;
  onDelete: () => void;
  isEditing: boolean;
}

export function QuizBlockComponent({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  isEditing,
}: QuizBlockComponentProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [loadingHint, setLoadingHint] = useState(false);

  // Auto-generate a hint using Datamuse synonyms
  const generateHint = async () => {
    if (!block.answer) return;
    setLoadingHint(true);
    try {
      const synonyms = await wordPolisher.getSynonyms(block.answer);
      // Pick the first synonym that isn't the word itself
      const bestHint = synonyms.find(s => 
        s.word.toLowerCase() !== block.answer.toLowerCase()
      );
      if (bestHint) {
        onUpdate({ hint: bestHint.word });
      }
    } finally {
      setLoadingHint(false);
    }
  };

  const difficultyColors = {
    easy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    hard: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  return (
    <div
      className={cn(
        'group relative my-6 rounded-xl border-2 border-dashed transition-all duration-300',
        isSelected 
          ? 'border-primary/40 bg-primary/5 ring-2 ring-primary ring-offset-4' 
          : 'border-primary/20 bg-primary/5 hover:border-primary/30 hover:shadow-lg'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Editor Controls (visible on hover) */}
      {isSelected && (
        <div className="absolute -right-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 bg-destructive text-destructive-foreground rounded-md shadow-sm hover:scale-110 transition-transform"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary/70">
            Workbook Exercise
          </span>
          {block.difficulty && (
            <span 
              className={cn("text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase", difficultyColors[block.difficulty])}
            >
              {block.difficulty}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); setShowAnswer(!showAnswer); }}
            className="h-7 gap-1.5 text-xs"
          >
            {showAnswer ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showAnswer ? 'Hide' : 'Peek'}
          </Button>
          
          {isEditing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); generateHint(); }}
              disabled={loadingHint || !block.answer}
              className="h-7 gap-1.5 text-xs border-primary/20 text-primary hover:bg-primary/5"
            >
              <Lightbulb className="h-3 w-3" />
              {loadingHint ? 'Thinking...' : block.hint ? 'Regenerate' : 'Auto-Hint'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="flex flex-wrap items-baseline gap-2 text-lg font-medium leading-relaxed font-serif">
          {/* Pre-text */}
          {isEditing ? (
            <Input 
              value={block.preText} 
              onChange={(e) => onUpdate({ preText: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="inline-block w-auto min-w-[120px] border-none bg-transparent p-0 h-auto text-lg font-serif focus-visible:ring-0" 
              placeholder="Start of sentence..."
            />
          ) : (
            <span className="text-foreground/90">{block.preText}</span>
          )}

          {/* The "Blank" / Answer */}
          <div className="relative inline-flex flex-col items-center">
            {isEditing ? (
              <Input 
                value={block.answer}
                onChange={(e) => onUpdate({ answer: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                className="h-9 w-36 border-b-2 border-primary bg-white text-center font-bold text-primary focus-visible:ring-0 rounded-t-md rounded-b-none"
                placeholder="Answer"
              />
            ) : (
              <span className={cn(
                "inline-block min-w-[120px] px-4 py-1 border-b-2 text-center transition-all duration-300",
                showAnswer 
                  ? "border-emerald-400 text-emerald-700 font-bold bg-emerald-50 rounded-md"
                  : "border-primary/30 bg-white"
              )}>
                {showAnswer ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    {block.answer}
                  </span>
                ) : (
                  <span className="text-muted-foreground/40 text-sm select-none font-normal">
                    {block.hint ? `💡 ${block.hint}` : '_______'}
                  </span>
                )}
              </span>
            )}
            
            {/* Hint Badge (shown below in reading mode) */}
            {block.hint && !isEditing && !showAnswer && (
              <span className="mt-1 text-[10px] font-medium text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-full">
                Hint available
              </span>
            )}
          </div>

          {/* Post-text */}
          {isEditing ? (
            <Input 
              value={block.postText} 
              onChange={(e) => onUpdate({ postText: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="inline-block w-auto min-w-[80px] border-none bg-transparent p-0 h-auto text-lg font-serif focus-visible:ring-0"
              placeholder="end..."
            />
          ) : (
            <span className="text-foreground/90">{block.postText}</span>
          )}
        </div>

        {/* Editable Hint Field */}
        {isEditing && (
          <div className="mt-4 pt-4 border-t border-primary/10">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Custom Hint
              </span>
            </div>
            <Input 
              value={block.hint || ''} 
              onChange={(e) => onUpdate({ hint: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="mt-2 text-sm border-dashed" 
              placeholder="Optional hint for learners (or use Auto-Hint)..."
            />
          </div>
        )}
      </div>

      {/* Difficulty Selector (Edit Mode) */}
      {isEditing && (
        <div className="px-5 py-3 border-t border-primary/10 bg-muted/20 flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Difficulty:
          </span>
          <div className="flex gap-1">
            {(['easy', 'medium', 'hard'] as const).map((level) => (
              <button
                key={level}
                onClick={(e) => { e.stopPropagation(); onUpdate({ difficulty: level }); }}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase rounded-full border transition-all",
                  block.difficulty === level 
                    ? difficultyColors[level] 
                    : "bg-background text-muted-foreground border-muted-foreground/20 hover:border-muted-foreground/40"
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
