// src/components/editor/BlockRenderer.tsx
"use client";

import { ContentBlock, TextBlock, ImageBlock, SeparatorBlock, CalloutBlock } from '@/types/blocks';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/lib/store/projectStore';

interface BlockRendererProps {
  block: ContentBlock;
  pageIndex: number;
}

export default function BlockRenderer({ block, pageIndex }: BlockRendererProps) {
  const { updateBlock } = useProjectStore();

  switch (block.type) {
    case 'text':
      return <TextRenderer block={block as TextBlock} />;
    case 'image':
      return <ImageRenderer block={block as ImageBlock} />;
    case 'separator':
      return <SeparatorRenderer block={block as SeparatorBlock} />;
    case 'callout':
      return <CalloutRenderer block={block as CalloutBlock} />;
    default:
      return <div>Unknown block type: {block.type}</div>;
  }
}

function TextRenderer({ block }: { block: TextBlock }) {
  const { layout } = block;
  
  if (layout === 'side-by-side') {
    return (
      <div className="grid grid-cols-2 gap-8 py-2 group relative">
        <div className="prose prose-sm dark:prose-invert">
          {block.L1.content}
        </div>
        <div className="prose prose-sm dark:prose-invert italic text-muted-foreground">
          {block.L2.content}
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <p className="prose prose-sm dark:prose-invert">{block.L1.content}</p>
      <p className="prose prose-sm dark:prose-invert italic text-muted-foreground">{block.L2.content}</p>
    </div>
  );
}

function ImageRenderer({ block }: { block: ImageBlock }) {
  return (
    <div className="py-4 flex justify-center">
      <img
        src={block.url}
        alt={block.altText}
        className="rounded-lg shadow-md max-w-full"
        style={{ width: `${block.width}%` }}
      />
    </div>
  );
}

function SeparatorRenderer({ block }: { block: SeparatorBlock }) {
  return (
    <div className="py-4 flex justify-center">
      <hr 
        className="border-t-2" 
        style={{ 
          width: `${block.width}%`, 
          borderColor: block.color,
          borderStyle: block.style === 'dashed' ? 'dashed' : 'solid'
        }} 
      />
    </div>
  );
}

function CalloutRenderer({ block }: { block: CalloutBlock }) {
  return (
    <div 
      className="p-4 rounded-lg my-4 border-l-4"
      style={{ 
        backgroundColor: block.backgroundColor,
        borderColor: block.headerColor,
        color: block.textColor
      }}
    >
      <div className="font-bold flex items-center gap-2 mb-1">
        <span>{block.icon}</span>
        {block.title}
      </div>
      <div className="text-sm opacity-90">{block.content}</div>
    </div>
  );
}
