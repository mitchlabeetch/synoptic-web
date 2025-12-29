// src/components/editor/PageRenderer.tsx
"use client";

import { PageData } from '@/types/blocks';
import BlockRenderer from './BlockRenderer';
import { cn } from '@/lib/utils';

interface PageRendererProps {
  page: PageData;
  pageIndex: number;
}

export default function PageRenderer({ page, pageIndex }: PageRendererProps) {
  return (
    <div 
      className="bg-white shadow-2xl mx-auto my-8 relative overflow-hidden"
      style={{
        width: '210mm', // A4 for now, will be dynamic from settings later
        minHeight: '297mm',
        padding: '20mm',
        backgroundColor: page.backgroundColor || '#ffffff'
      }}
    >
      {/* Draft Page Number (Visual only) */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground select-none">
        {page.number}
      </div>

      <div className="space-y-4">
        {page.blocks.map((block) => (
          <BlockRenderer 
            key={block.id} 
            block={block} 
            pageIndex={pageIndex} 
          />
        ))}

        {page.blocks.length === 0 && (
          <div className="flex items-center justify-center py-20 border-2 border-dashed border-muted rounded-lg">
            <p className="text-muted-foreground italic">Add your first block to start your story</p>
          </div>
        )}
      </div>
    </div>
  );
}
