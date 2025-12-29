// src/components/editor/BlockRenderer.tsx
'use client';

import {
  ContentBlock,
  TextBlock,
} from '@/types/blocks';
import { TextBlockComponent } from './blocks/TextBlock';
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

  // For now, only text is fully implemented with a specialized component
  // As we add ImageBlock, SeparatorBlock, etc., we'll add them here
  
  const commonProps = {
    isSelected: selectedBlockId === block.id,
    onSelect: () => setSelectedBlockId(block.id),
    onUpdate: (updates: Partial<ContentBlock>) => updateBlock(pageIndex, block.id, updates),
    onDelete: () => {
      deleteBlock(pageIndex, block.id);
      if (selectedBlockId === block.id) setSelectedBlockId(null);
    },
    isEditing: true, // Default to true for now
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
        <div className="p-4 border-2 border-dashed border-muted rounded-lg text-center text-muted-foreground italic">
          Image Block Placeholder
        </div>
      );

    case 'separator':
      return <hr className="my-8 border-t border-muted-foreground/20" />;

    case 'callout':
      return (
        <div className="p-4 bg-muted/30 border-l-4 border-primary rounded-r-lg">
          <p className="font-medium">Callout Block Placeholder</p>
        </div>
      );

    default:
      return null;
  }
}
