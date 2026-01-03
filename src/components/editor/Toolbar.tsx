// src/components/editor/Toolbar.tsx
// PURPOSE: Main editor toolbar with actions and status
// ACTION: Provides undo/redo, export, preview and document stats
// MECHANISM: Integrates with project store and save status indicator

'use client';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { 
  Undo2, 
  Redo2, 
  Play, 
  Download, 
  Share2,
  Maximize2,
  FileText,
  Keyboard
} from 'lucide-react';
import { useProjectStore } from '@/lib/store/projectStore';
import { AssetBank } from '@/components/tools/AssetBank';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { useMemo, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/components/ui/Toast';

// Accessible toolbar button with tooltip
function ToolbarButton({
  onClick,
  icon: Icon,
  label,
  shortcut,
  disabled,
  variant = 'ghost',
  className,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  variant?: 'ghost' | 'outline' | 'default';
  className?: string;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant={variant} 
            size="icon" 
            className={`h-8 w-8 ${className || ''}`} 
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-keyshortcuts={shortcut}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="flex items-center gap-2">
          <span>{label}</span>
          {shortcut && (
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              {shortcut}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function Toolbar() {
  const { undo, redo, canUndo, canRedo, content, selectedBlockId, updateBlock, currentPageIndex } = useProjectStore();
  const t = useTranslations('Studio');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Calculate total word count across all pages for AI credit estimation
  const wordCount = useMemo(() => {
    if (!content?.pages) return 0;
    
    let count = 0;
    content.pages.forEach(page => {
      page.blocks.forEach((block) => {
        if (block.type === 'text') {
          // Type assertion for text block properties
          const textBlock = block as { L1?: { content?: string }; L2?: { content?: string } };
          const l1 = textBlock.L1?.content || '';
          const l2 = textBlock.L2?.content || '';
          // Strip HTML tags and count words
          const text = (l1 + ' ' + l2).replace(/<[^>]*>/g, '');
          count += text.split(/\s+/).filter(Boolean).length;
        }
      });
    });
    return count;
  }, [content]);

  // Handle emoji insertion from AssetBank
  const handleEmojiInsert = (emoji: string) => {
    // If a block is selected, try to append emoji to it
    // For now, copy to clipboard as a fallback
    navigator.clipboard.writeText(emoji).then(() => {
      toast.success('Copied to clipboard', { description: emoji });
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      className="flex items-center gap-2"
      role="toolbar"
      aria-label="Editor toolbar"
    >
      {/* Undo/Redo Group */}
      <div 
        className="flex items-center gap-1 bg-muted/50 p-1 rounded-md"
        role="group"
        aria-label="History controls"
      >
        <ToolbarButton 
          onClick={undo} 
          icon={Undo2} 
          label={t('undo') || 'Undo'} 
          shortcut="⌘Z"
          disabled={!canUndo}
        />
        <ToolbarButton 
          onClick={redo} 
          icon={Redo2} 
          label={t('redo') || 'Redo'} 
          shortcut="⌘⇧Z"
          disabled={!canRedo}
        />
      </div>

      <div className="h-4 w-[1px] bg-muted mx-1" aria-hidden="true" />

      {/* Asset Bank Button */}
      <AssetBank onSelect={handleEmojiInsert} />

      <div className="h-4 w-[1px] bg-muted mx-1" aria-hidden="true" />

      {/* Action Buttons */}
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2"
        aria-label={t('collaborate')}
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t('collaborate')}</span>
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2"
        aria-label={t('export')}
        onClick={() => {
          // Dispatch event to open sidebar publish panel
          window.dispatchEvent(new CustomEvent('open-sidebar-panel', { detail: 'publish' }));
        }}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t('export')}</span>
      </Button>

      <Button 
        size="sm" 
        className="bg-primary hover:bg-primary/90 gap-2"
        aria-label={t('preview')}
      >
        <Play className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t('preview')}</span>
      </Button>
      
      <div className="h-4 w-[1px] bg-muted mx-1" aria-hidden="true" />
      
      {/* Save Status Indicator */}
      <SaveStatusIndicator className="hidden md:flex" />
      
      <div className="h-4 w-[1px] bg-muted mx-1 hidden md:block" aria-hidden="true" />
      
      {/* Word Count Indicator */}
      <div 
        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30 text-[10px] text-muted-foreground font-medium"
        role="status"
        aria-label={`${wordCount.toLocaleString()} words`}
      >
        <FileText className="h-3 w-3" aria-hidden="true" />
        <span>{wordCount.toLocaleString()}</span>
        <span className="opacity-60 hidden sm:inline">words</span>
      </div>
      
      {/* Keyboard Shortcuts Hint */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hidden lg:flex"
              aria-label="Keyboard shortcuts"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="text-xs space-y-1">
              <p><kbd className="bg-muted px-1 rounded">⌘K</kbd> Command Palette</p>
              <p><kbd className="bg-muted px-1 rounded">⌘Z</kbd> Undo</p>
              <p><kbd className="bg-muted px-1 rounded">⌘⇧Z</kbd> Redo</p>
              <p><kbd className="bg-muted px-1 rounded">⌘S</kbd> Save</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <ToolbarButton 
        onClick={toggleFullscreen} 
        icon={Maximize2} 
        label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        shortcut="F11"
      />
    </div>
  );
}
