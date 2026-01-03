// src/components/editor/blocks/FloatingToolbar.tsx
// PURPOSE: Contextual formatting toolbar that appears on text selection
// ACTION: Provides quick formatting, AI explain, word polishing, and social share
// MECHANISM: Positioned absolutely near selection, triggers document.execCommand or modal opens

'use client';

import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Highlighter,
  Link2,
  Sparkles,
  Share2,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { WordPolisher } from '@/components/tools/WordPolisher';
import { SocialShareModal } from '../tools/SocialShareModal';
import { isSingleWord } from '@/lib/utils/wordTokenizer';

interface FloatingToolbarProps {
  isVisible: boolean;
  position: { top: number; left: number };
  onAiExplain?: () => void;
  selectedText?: string;
  onReplaceText?: (newText: string) => void;
  locale?: string; // For multilingual word tokenization
  // For Social Share
  sourceText?: string;
  targetText?: string;
  sourceLang?: string;
  targetLang?: string;
}

export function FloatingToolbar({ 
  isVisible, 
  position, 
  onAiExplain,
  selectedText = '',
  onReplaceText,
  locale,
  sourceText = '',
  targetText = '',
  sourceLang = 'EN',
  targetLang = 'FR'
}: FloatingToolbarProps) {
  const [show, setShow] = useState(isVisible);
  const [showOverflow, setShowOverflow] = useState(false);

  useEffect(() => {
    setShow(isVisible);
    // Reset overflow menu when toolbar visibility changes
    if (!isVisible) {
      setShowOverflow(false);
    }
  }, [isVisible]);

  const handleFormat = (command: string) => {
    document.execCommand(command, false);
  };

  // Handle word replacement from WordPolisher
  const handleWordReplace = (newWord: string) => {
    if (onReplaceText) {
      onReplaceText(newWord);
    } else {
      // Fallback: use execCommand to insert text
      document.execCommand('insertText', false, newWord);
    }
  };

  if (!show) return null;

  // Check if selected text is a single word (using robust multilingual tokenizer)
  const singleWordCheck = isSingleWord(selectedText.trim(), locale);
  
  // Check if we have content for social share
  const hasShareableContent = (sourceText && sourceText.length > 0) || (targetText && targetText.length > 0);
  
  // Check if we have any secondary actions
  const hasSecondaryActions = singleWordCheck || onAiExplain || hasShareableContent;

  // Primary formatting buttons
  const primaryButtons = (
    <>
      <ToolbarButton 
        onClick={() => handleFormat('bold')} 
        icon={Bold} 
        label="Bold"
        ariaLabel="Bold text"
      />
      <ToolbarButton 
        onClick={() => handleFormat('italic')} 
        icon={Italic} 
        label="Italic"
        ariaLabel="Italic text"
      />
      <ToolbarButton 
        onClick={() => handleFormat('underline')} 
        icon={Underline} 
        label="Underline"
        ariaLabel="Underline text"
      />
      <ToolbarButton 
        onClick={() => handleFormat('strikeThrough')} 
        icon={Strikethrough} 
        label="Strikethrough"
        ariaLabel="Strikethrough text"
      />
      
      <div className="w-[1px] h-4 bg-muted mx-1" aria-hidden="true" />
      
      <ToolbarButton 
        onClick={() => {}} 
        icon={Highlighter} 
        label="Highlight" 
        ariaLabel="Highlight text"
        color="text-yellow-500" 
      />
      <ToolbarButton 
        onClick={() => {}} 
        icon={Link2} 
        label="Link"
        ariaLabel="Insert link"
      />
    </>
  );

  // Secondary/AI buttons
  const secondaryButtons = (
    <>
      {/* Word Polisher - Only show for single word selections */}
      {singleWordCheck && (
        <>
          <div className="w-[1px] h-4 bg-muted mx-1" aria-hidden="true" />
          <WordPolisher 
            selectedText={selectedText.trim()} 
            onReplace={handleWordReplace} 
          />
        </>
      )}
      
      {onAiExplain && (
        <>
          <div className="w-[1px] h-4 bg-muted mx-1" aria-hidden="true" />
          <ToolbarButton 
            onClick={onAiExplain} 
            icon={Sparkles} 
            label="AI Explain" 
            ariaLabel="Explain selected text with AI"
            color="text-primary animate-pulse hover:animate-none" 
          />
        </>
      )}

      {/* Social Share Button - Viral loop for Instagram/Twitter */}
      {hasShareableContent && (
        <>
          <div className="w-[1px] h-4 bg-muted mx-1" aria-hidden="true" />
          <SocialShareModal
            triggerContent={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-pink-50 hover:text-pink-500 transition-colors"
                title="Share as Image"
                aria-label="Share selection as image"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            }
            sourceText={sourceText || selectedText}
            targetText={targetText || selectedText}
            sourceLang={sourceLang}
            targetLang={targetLang}
          />
        </>
      )}
    </>
  );

  return (
    <div
      className="fixed z-[100] bg-background border rounded-lg shadow-xl flex items-center p-1 animate-in fade-in zoom-in duration-200 pointer-events-auto max-w-[calc(100vw-2rem)]"
      style={{
        top: position.top - 50,
        left: position.left,
        transform: 'translateX(-50%)',
      }}
      onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
      role="toolbar"
      aria-label="Text formatting toolbar"
    >
      {/* Scrollable container for overflow handling */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {/* Primary buttons - always visible */}
        {primaryButtons}
        
        {/* Secondary buttons - in overflow on mobile */}
        <div className="hidden sm:contents">
          {secondaryButtons}
        </div>
        
        {/* Overflow dropdown for mobile */}
        {hasSecondaryActions && (
          <div className="sm:hidden relative">
            <div className="w-[1px] h-4 bg-muted mx-1" aria-hidden="true" />
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 hover:bg-muted flex items-center gap-0.5",
                showOverflow && "bg-muted"
              )}
              onClick={() => setShowOverflow(!showOverflow)}
              aria-label="More options"
              aria-expanded={showOverflow}
              aria-haspopup="menu"
            >
              <MoreHorizontal className="h-4 w-4" />
              <ChevronDown className={cn(
                "h-3 w-3 transition-transform",
                showOverflow && "rotate-180"
              )} />
            </Button>
            
            {/* Overflow dropdown menu */}
            {showOverflow && (
              <div 
                className="absolute top-full right-0 mt-1 bg-background border rounded-lg shadow-xl p-1 flex flex-wrap gap-1 min-w-[180px] z-50"
                role="menu"
                aria-label="Additional options"
              >
                {secondaryButtons}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({ 
  onClick, 
  icon: Icon, 
  label,
  ariaLabel,
  color
}: { 
  onClick: () => void; 
  icon: React.ComponentType<{ className?: string }>; 
  label: string;
  ariaLabel: string;
  color?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8 hover:bg-muted", color)}
      onClick={onClick}
      title={label}
      aria-label={ariaLabel}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
