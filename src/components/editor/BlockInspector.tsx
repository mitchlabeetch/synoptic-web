// src/components/editor/BlockInspector.tsx
'use client';

import { useProjectStore } from '@/lib/store/projectStore';
import { 
  Settings2, 
  Type, 
  Trash2,
  Copy,
  Maximize2,
  Image as ImageIcon,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Scaling,
  SeparatorHorizontal,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function BlockInspector() {
  const { 
    content, 
    currentPageIndex, 
    selectedBlockId, 
    updateBlock, 
    deleteBlock 
  } = useProjectStore();
  
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
          Select a block on the page to adjust its fine-grained properties.
        </p>
      </div>
    );
  }

  const isText = selectedBlock.type === 'text';
  const isImage = selectedBlock.type === 'image';
  const isSeparator = selectedBlock.type === 'separator';

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-card">
      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
          {isText && <Type className="h-4 w-4 text-primary" />}
          {isImage && <ImageIcon className="h-4 w-4 text-primary" />}
          {isSeparator && <SeparatorHorizontal className="h-4 w-4 text-primary" />}
          {selectedBlock.type} Inspector
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
        {/* TEXT SPECIFIC CONTROLS */}
        {isText && (
          <>
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

            <section className="space-y-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Typography</Label>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Line Height</span>
                    <span className="font-medium">{(selectedBlock as any).lineSpacing || 1.5}</span>
                  </div>
                  <Slider 
                    value={[(selectedBlock as any).lineSpacing || 1.5]} 
                    max={3} 
                    min={0.8}
                    step={0.1} 
                    onValueChange={([val]) => updateBlock(currentPageIndex, selectedBlock.id, { lineSpacing: val } as any)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Paragraph Spacing</span>
                    <span className="font-medium">{(selectedBlock as any).paragraphSpacing || 20}px</span>
                  </div>
                  <Slider 
                    value={[(selectedBlock as any).paragraphSpacing || 20]} 
                    max={100} 
                    step={2} 
                    onValueChange={([val]) => updateBlock(currentPageIndex, selectedBlock.id, { paragraphSpacing: val } as any)}
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {/* IMAGE SPECIFIC CONTROLS */}
        {isImage && (
          <>
            <section className="space-y-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Dimensions & Alignment</Label>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Width (%)</span>
                    <span className="font-medium">{(selectedBlock as any).width || 100}%</span>
                  </div>
                  <Slider 
                    value={[(selectedBlock as any).width || 100]} 
                    max={100} 
                    min={10}
                    step={1} 
                    onValueChange={([val]) => updateBlock(currentPageIndex, selectedBlock.id, { width: val } as any)}
                  />
                </div>
                
                <div className="flex gap-2">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <Button
                      key={align}
                      variant={(selectedBlock as any).alignment === align ? 'default' : 'outline'}
                      size="icon"
                      className="flex-1"
                      onClick={() => updateBlock(currentPageIndex, selectedBlock.id, { alignment: align } as any)}
                    >
                      {align === 'left' && <AlignLeft className="h-4 w-4" />}
                      {align === 'center' && <AlignCenter className="h-4 w-4" />}
                      {align === 'right' && <AlignRight className="h-4 w-4" />}
                    </Button>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Style & Effects</Label>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Shadow</span>
                  <Button 
                    variant={(selectedBlock as any).shadow ? 'default' : 'outline'} 
                    size="sm" 
                    className="h-7 w-12"
                    onClick={() => updateBlock(currentPageIndex, selectedBlock.id, { shadow: !(selectedBlock as any).shadow } as any)}
                  >
                    {(selectedBlock as any).shadow ? 'On' : 'Off'}
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Border Radius</span>
                    <span className="font-medium">{(selectedBlock as any).borderRadius || 0}px</span>
                  </div>
                  <Slider 
                    value={[(selectedBlock as any).borderRadius || 0]} 
                    max={50} 
                    step={1} 
                    onValueChange={([val]) => updateBlock(currentPageIndex, selectedBlock.id, { borderRadius: val } as any)}
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {/* SEPARATOR SPECIFIC CONTROLS */}
        {isSeparator && (
          <>
            <section className="space-y-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Style & Pattern</Label>
              <Select 
                value={(selectedBlock as any).style || 'line'}
                onValueChange={(val) => updateBlock(currentPageIndex, selectedBlock.id, { style: val } as any)}
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Solid Line</SelectItem>
                  <SelectItem value="double-line">Double Line</SelectItem>
                  <SelectItem value="dashed">Dashed Line</SelectItem>
                  <SelectItem value="dotted">Dotted Line</SelectItem>
                  <SelectItem value="gradient">Gradient Fade</SelectItem>
                  <SelectItem value="ornament-fleuron">Fleuron Ornament</SelectItem>
                </SelectContent>
              </Select>
            </section>

            <section className="space-y-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Dimensions</Label>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Width (%)</span>
                    <span className="font-medium">{(selectedBlock as any).width || 80}%</span>
                  </div>
                  <Slider 
                    value={[(selectedBlock as any).width || 80]} 
                    max={100} 
                    min={5}
                    step={1} 
                    onValueChange={([val]) => updateBlock(currentPageIndex, selectedBlock.id, { width: val } as any)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Thickness</span>
                    <span className="font-medium">{(selectedBlock as any).thickness || 1}px</span>
                  </div>
                  <Slider 
                    value={[(selectedBlock as any).thickness || 1]} 
                    max={10} 
                    min={1}
                    step={1} 
                    onValueChange={([val]) => updateBlock(currentPageIndex, selectedBlock.id, { thickness: val } as any)}
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      <div className="p-4 border-t bg-muted/5 flex gap-2 mt-auto">
        <Button variant="outline" className="flex-1 gap-2 text-xs" onClick={() => {}}>
          <Copy className="h-3 w-3" />
          Duplicate
        </Button>
        <Button variant="outline" className="flex-1 gap-2 text-xs" onClick={() => {}}>
          <Palette className="h-3 w-3" />
          Style Preset
        </Button>
      </div>
    </div>
  );
}
