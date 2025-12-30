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
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { WordPolisher } from '@/components/tools/WordPolisher';
import { SocialShareModal } from '../tools/SocialShareModal';

interface FloatingToolbarProps {
  isVisible: boolean;
  position: { top: number; left: number };
  onAiExplain?: () => void;
  selectedText?: string;
  onReplaceText?: (newText: string) => void;
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
  sourceText = '',
  targetText = '',
  sourceLang = 'EN',
  targetLang = 'FR'
}: FloatingToolbarProps) {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
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

  // Check if selected text is a single word (for WordPolisher)
  const isSingleWord = selectedText.trim().split(/\s+/).length === 1 && selectedText.trim().length > 0;
  
  // Check if we have content for social share
  const hasShareableContent = (sourceText && sourceText.length > 0) || (targetText && targetText.length > 0);

  return (
    <div
      className="fixed z-[100] bg-background border rounded-lg shadow-xl flex items-center p-1 gap-1 animate-in fade-in zoom-in duration-200 pointer-events-auto"
      style={{
        top: position.top - 50,
        left: position.left,
        transform: 'translateX(-50%)',
      }}
      onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
    >
      <ToolbarButton onClick={() => handleFormat('bold')} icon={Bold} label="Bold" />
      <ToolbarButton onClick={() => handleFormat('italic')} icon={Italic} label="Italic" />
      <ToolbarButton onClick={() => handleFormat('underline')} icon={Underline} label="Underline" />
      <ToolbarButton onClick={() => handleFormat('strikeThrough')} icon={Strikethrough} label="Strikethrough" />
      
      <div className="w-[1px] h-4 bg-muted mx-1" />
      
      <ToolbarButton onClick={() => {}} icon={Highlighter} label="Highlight" color="text-yellow-500" />
      <ToolbarButton onClick={() => {}} icon={Link2} label="Link" />
      
      {/* Word Polisher - Only show for single word selections */}
      {isSingleWord && (
        <>
          <div className="w-[1px] h-4 bg-muted mx-1" />
          <WordPolisher 
            selectedText={selectedText.trim()} 
            onReplace={handleWordReplace} 
          />
        </>
      )}
      
      {onAiExplain && (
        <>
          <div className="w-[1px] h-4 bg-muted mx-1" />
          <ToolbarButton 
            onClick={onAiExplain} 
            icon={Sparkles} 
            label="AI Explain" 
            color="text-primary animate-pulse hover:animate-none" 
          />
        </>
      )}

      {/* Social Share Button - Viral loop for Instagram/Twitter */}
      {hasShareableContent && (
        <>
          <div className="w-[1px] h-4 bg-muted mx-1" />
          <SocialShareModal
            triggerContent={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-pink-50 hover:text-pink-500 transition-colors"
                title="Share as Image"
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
    </div>
  );
}

function ToolbarButton({ 
  onClick, 
  icon: Icon, 
  label,
  color
}: { 
  onClick: () => void; 
  icon: any; 
  label: string;
  color?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8 hover:bg-muted", color)}
      onClick={onClick}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

