// src/components/editor/BlockRenderer.tsx
'use client';

import {
  ContentBlock,
  TextBlock,
} from '@/types/blocks';
import { TextBlockComponent } from './blocks/TextBlock';
import { ImageBlockComponent } from './blocks/ImageBlock';
import { SeparatorBlockComponent } from './blocks/SeparatorBlock';
import { useProjectStore } from '@/lib/store/projectStore';

interface BlockRendererProps {
  block: ContentBlock;
  pageIndex: number;
}

export default function BlockRenderer({
  block,
  pageIndex,
}: BlockRendererProps) {
  const { 
    updateBlock, 
    deleteBlock, 
    meta,
    selectedBlockId,
    setSelectedBlockId
  } = useProjectStore();

  const commonProps = {
    isSelected: selectedBlockId === block.id,
    onSelect: () => setSelectedBlockId(block.id),
    onUpdate: (updates: Partial<ContentBlock>) => updateBlock(pageIndex, block.id, updates),
    onDelete: () => {
      deleteBlock(pageIndex, block.id);
      if (selectedBlockId === block.id) setSelectedBlockId(null);
    },
    isEditing: true,
    sourceLang: meta?.source_lang || 'fr',
    targetLang: meta?.target_lang || 'en',
  };

  switch (block.type) {
    case 'text':
      return (
        <TextBlockComponent
          block={block as TextBlock}
          {...commonProps}
        />
      );

    case 'image':
      return (
        <ImageBlockComponent
          block={block as any}
          {...commonProps}
        />
      );

    case 'separator':
      return (
        <SeparatorBlockComponent
          block={block as any}
          {...commonProps}
        />
      );

    case 'callout':
      return (
        <div className="p-6 my-4 bg-muted/20 border-l-4 border-primary rounded-r-xl transition-all hover:bg-muted/30 group relative">
          <p className="font-bold text-primary mb-1 text-xs uppercase tracking-widest">Callout Block</p>
          <div className="text-sm text-foreground italic">Integration pending in Phase 3...</div>
        </div>
      );

    default:
      return null;
  }
}
