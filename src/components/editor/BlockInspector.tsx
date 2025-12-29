// src/components/editor/BlockInspector.tsx
'use client';

import { useProjectStore } from '@/lib/store/projectStore';
import { 
  Settings2, 
  Type, 
  Trash2,
  Copy,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export default function BlockInspector() {
  const { 
    content, 
    currentPageIndex, 
    selectedBlockId, 
    updateBlock, 
    deleteBlock 
  } = useProjectStore();
  
  // Find the selected block across the current page
  const selectedBlock = content.pages[currentPageIndex]?.blocks.find(
    (b) => b.id === selectedBlockId
  );

  if (!selectedBlock) {
    return (
      <div className="flex-1 p-8 text-center py-20 bg-muted/5">
        <div className="h-20 w-20 mx-auto bg-muted/30 rounded-2xl flex items-center justify-center mb-6">
          <Settings2 className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h4 className="font-medium mb-2 text-foreground">Nothing Selected</h4>
        <p className="text-sm text-muted-foreground italic px-4">
          Select a text block or element on the page to adjust its fine-grained properties.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-card">
      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
          <Type className="h-4 w-4 text-primary" />
          Block Inspector
        </h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive hover:bg-destructive/10" 
          onClick={() => deleteBlock(currentPageIndex, selectedBlock.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {/* Layout Section */}
        <section className="space-y-4">
          <Label className="text-xs font-bold text-muted-foreground uppercase">Layout & Strategy</Label>
          <div className="grid grid-cols-2 gap-2">
            {['side-by-side', 'interlinear', 'stacked'].map((layout) => (
              <Button
                key={layout}
                variant={selectedBlock.layout === layout ? 'default' : 'outline'}
                className="justify-start gap-2 h-10 px-3 capitalize text-xs"
                onClick={() => updateBlock(currentPageIndex, selectedBlock.id, { layout: layout as any })}
              >
                <div className="w-2 h-2 rounded-full bg-current opacity-50" />
                {layout.replace('-', ' ')}
              </Button>
            ))}
          </div>
        </section>

        {/* Global Spacing */}
        <section className="space-y-4">
          <Label className="text-xs font-bold text-muted-foreground uppercase">Global Spacing</Label>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Line Height</span>
                <span className="text-sm font-medium">{selectedBlock.lineSpacing || 1.5}</span>
              </div>
              <Slider 
                value={[selectedBlock.lineSpacing || 1.5]} 
                max={3} 
                min={0.8}
                step={0.1} 
                onValueChange={([val]) => updateBlock(currentPageIndex, selectedBlock.id, { lineSpacing: val })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Paragraph Spacing</span>
                <span className="text-sm font-medium">{selectedBlock.paragraphSpacing || 20}px</span>
              </div>
              <Slider 
                value={[selectedBlock.paragraphSpacing || 20]} 
                max={100} 
                step={2} 
                onValueChange={([val]) => updateBlock(currentPageIndex, selectedBlock.id, { paragraphSpacing: val })}
              />
            </div>
          </div>
        </section>

        {/* Visibility Controls */}
        <section className="space-y-4">
          <Label className="text-xs font-bold text-muted-foreground uppercase">Visual Context</Label>
          <div className="flex gap-2">
            <Button
              variant={selectedBlock.isTitle ? 'default' : 'outline'}
              className="flex-1 h-12 flex-col gap-1"
              onClick={() => updateBlock(currentPageIndex, selectedBlock.id, { isTitle: !selectedBlock.isTitle })}
            >
              <span className="text-xs font-bold">TITLE</span>
              <span className="text-[10px] opacity-60 italic">H1 Style</span>
            </Button>
            <Button
              variant={selectedBlock.isChapterHeading ? 'default' : 'outline'}
              className="flex-1 h-12 flex-col gap-1"
              onClick={() => updateBlock(currentPageIndex, selectedBlock.id, { isChapterHeading: !selectedBlock.isChapterHeading })}
            >
              <span className="text-xs font-bold">CHAPTER</span>
              <span className="text-[10px] opacity-60 italic">Centered</span>
            </Button>
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-muted/5 flex gap-2">
        <Button variant="outline" className="flex-1 gap-2 text-xs">
          <Copy className="h-3 w-3" />
          Duplicate
        </Button>
        <Button variant="outline" className="flex-1 gap-2 text-xs">
          <Maximize2 className="h-3 w-3" />
          Convert Template
        </Button>
      </div>
    </div>
  );
}
