// src/components/editor/PageRenderer.tsx
"use client";

import { PageData } from '@/types/blocks';
import BlockRenderer from './BlockRenderer';
import { useProjectStore } from '@/lib/store/projectStore';
import { cn } from '@/lib/utils';

interface PageRendererProps {
  page: PageData;
  pageIndex: number;
}

export default function PageRenderer({ page, pageIndex }: PageRendererProps) {
  const { settings } = useProjectStore();

  return (
    <div 
      className="shadow-[0_20px_50px_rgba(0,0,0,0.1)] mx-auto relative overflow-hidden transition-all duration-500"
      style={{
        width: `${settings.pageWidth}mm`,
        minHeight: `${settings.pageHeight}mm`,
        padding: '20mm', // standard margin, will be dynamic in Phase 4
        backgroundColor: page.backgroundColor || settings.colors.background,
        color: settings.colors.primary,
        fontFamily: settings.fonts.body,
      }}
    >
      {/* Draft Page Number (Visual only) */}
      <div 
        className="absolute bottom-6 left-0 right-0 text-center text-[10px] uppercase tracking-widest opacity-30 select-none font-bold"
        style={{ color: settings.colors.secondary }}
      >
        — {page.number} —
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
