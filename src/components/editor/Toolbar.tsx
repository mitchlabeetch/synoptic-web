// src/components/editor/Toolbar.tsx
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
  FileText
} from 'lucide-react';
import { useProjectStore } from '@/lib/store/projectStore';
import { AssetBank } from '@/components/tools/AssetBank';
import { useMemo } from 'react';

export default function Toolbar() {
  const { undo, redo, content, selectedBlockId, updateBlock, currentPageIndex } = useProjectStore();
  const t = useTranslations('Studio');

  // Calculate total word count across all pages for AI credit estimation
  const wordCount = useMemo(() => {
    if (!content?.pages) return 0;
    
    let count = 0;
    content.pages.forEach(page => {
      page.blocks.forEach((block: any) => {
        if (block.type === 'text') {
          const l1 = block.L1?.content || '';
          const l2 = block.L2?.content || '';
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
      // Could show a toast here
      console.log('Emoji copied:', emoji);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo}>
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-4 w-[1px] bg-muted mx-1" />

      {/* Asset Bank Button */}
      <AssetBank onSelect={handleEmojiInsert} />

      <div className="h-4 w-[1px] bg-muted mx-1" />

      <Button variant="outline" size="sm" className="gap-2">
        <Share2 className="h-4 w-4" />
        {t('collaborate')}
      </Button>

      <Button variant="outline" size="sm" className="gap-2">
        <Download className="h-4 w-4" />
        {t('export')}
      </Button>

      <Button size="sm" className="bg-primary hover:bg-primary/90 gap-2">
        <Play className="h-4 w-4" />
        {t('preview')}
      </Button>
      
      <div className="h-4 w-[1px] bg-muted mx-1" />
      
      {/* Word Count Indicator */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30 text-[10px] text-muted-foreground font-medium">
        <FileText className="h-3 w-3" />
        <span>{wordCount.toLocaleString()}</span>
        <span className="opacity-60">words</span>
      </div>
      
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

