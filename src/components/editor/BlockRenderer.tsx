// src/components/editor/BlockRenderer.tsx
'use client';

import {
  ContentBlock,
  TextBlock,
  QuizBlock,
} from '@/types/blocks';
import { TextBlockComponent } from './blocks/TextBlock';
import { ImageBlockComponent } from './blocks/ImageBlock';
import { SeparatorBlockComponent } from './blocks/SeparatorBlock';
import { CalloutBlockComponent } from './blocks/CalloutBlock';
import { QuizBlockComponent } from './blocks/QuizBlock';
import { useProjectStore } from '@/lib/store/projectStore';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const commonProps = {
    isSelected: selectedBlockId === block.id,
    onSelect: () => setSelectedBlockId(block.id),
    onUpdate: (updates: Partial<ContentBlock>) => updateBlock(pageIndex, block.id, updates),
    onDelete: () => {
      deleteBlock(pageIndex, block.id);
      if (selectedBlockId === block.id) setSelectedBlockId(null);
    },
    isEditing: true,
    sourceLang: meta?.source_lang || 'en',
    targetLang: meta?.target_lang || 'en',
  };

  const renderBlockContent = () => {
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
          <CalloutBlockComponent
            block={block as any}
            {...commonProps}
          />
        );

      case 'quiz':
        return (
          <QuizBlockComponent
            block={block as QuizBlock}
            {...commonProps}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group/block",
        isDragging && "opacity-40"
      )}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover/block:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground z-50"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {renderBlockContent()}
    </div>
  );
}
