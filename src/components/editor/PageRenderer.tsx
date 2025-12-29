// src/components/editor/PageRenderer.tsx
"use client";

import { PageData } from '@/types/blocks';
import BlockRenderer from './BlockRenderer';
import { useProjectStore } from '@/lib/store/projectStore';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface PageRendererProps {
  page: PageData;
  pageIndex: number;
}

export default function PageRenderer({ page, pageIndex }: PageRendererProps) {
  const { settings, meta, reorderBlocks } = useProjectStore();

  const showHeader = page.showHeader !== false;
  const showFooter = page.showFooter !== false;
  const showPageNumber = page.showPageNumber !== false;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = page.blocks.findIndex((b) => b.id === active.id);
      const newIndex = page.blocks.findIndex((b) => b.id === over.id);
      reorderBlocks(pageIndex, oldIndex, newIndex);
    }
  };

  return (
    <div 
      className="shadow-[0_20px_50px_rgba(0,0,0,0.1)] mx-auto relative transition-all duration-500 min-h-[500px]"
      style={{
        width: `${settings.pageWidth}mm`,
        minHeight: `${settings.pageHeight}mm`,
        padding: '30mm 20mm', // standard margins
        backgroundColor: page.backgroundColor || settings.colors.background,
        color: settings.colors.primary,
        fontFamily: settings.fonts.body,
      }}
    >
      {/* Header Area */}
      {showHeader && (
        <div 
          className="absolute top-8 left-10 right-10 flex justify-between text-[10px] uppercase tracking-[0.2em] font-medium opacity-40 select-none pb-2 border-b border-current"
          style={{ color: settings.colors.secondary }}
        >
          <span className="truncate max-w-[40%]">{page.headerText || meta?.title || "Draft"}</span>
          <span className="truncate max-w-[40%] text-right">{page.chapterTitle}</span>
        </div>
      )}

      {/* Page Number */}
      {showPageNumber && (
        <div 
          className="absolute bottom-6 left-0 right-0 text-center text-[10px] uppercase tracking-widest opacity-30 select-none font-bold"
          style={{ color: settings.colors.secondary }}
        >
          — {page.number} —
        </div>
      )}

      {/* Footer Area */}
      {showFooter && page.footerText && (
        <div 
          className="absolute bottom-12 left-10 right-10 text-center text-[9px] italic opacity-30 select-none"
          style={{ color: settings.colors.secondary }}
        >
          {page.footerText}
        </div>
      )}

      <div className="space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={page.blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            {page.blocks.map((block) => (
              <BlockRenderer 
                key={block.id} 
                block={block} 
                pageIndex={pageIndex} 
              />
            ))}
          </SortableContext>
        </DndContext>

        {page.blocks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-muted/20 rounded-2xl bg-muted/5 group hover:bg-muted/10 transition-colors">
            <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center mb-4 text-muted-foreground/40 group-hover:scale-110 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-plus-2"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M3 15h6"/><path d="M6 12v6"/></svg>
            </div>
            <p className="text-sm text-muted-foreground italic font-medium">Ready for your bilingual masterpiece</p>
          </div>
        )}
      </div>
    </div>
  );
}
