// src/components/editor/blocks/FloatingToolbar.tsx
'use client';

import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Highlighter,
  Link2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';

interface FloatingToolbarProps {
  isVisible: boolean;
  position: { top: number; left: number };
  onAiExplain?: () => void;
}

export function FloatingToolbar({ isVisible, position, onAiExplain }: FloatingToolbarProps) {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
  }, [isVisible]);

  const handleFormat = (command: string) => {
    document.execCommand(command, false);
  };

  if (!show) return null;

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
