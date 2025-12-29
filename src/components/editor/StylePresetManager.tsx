// src/components/editor/StylePresetManager.tsx
'use client';

import { useProjectStore } from '@/lib/store/projectStore';
import { 
  Palette, 
  Plus, 
  Trash2, 
  Type, 
  Image as ImageIcon, 
  SeparatorHorizontal,
  Bookmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ContentBlock, StylePreset } from '@/types/blocks';

export default function StylePresetManager() {
  const { 
    content, 
    currentPageIndex, 
    selectedBlockId, 
    addPreset, 
    deletePreset, 
    applyPreset 
  } = useProjectStore();

  const presets = content.presets || [];
  
  const currentPage = content.pages[currentPageIndex];
  const selectedBlock = currentPage?.blocks.find(b => b.id === selectedBlockId);

  const handleCapturePreset = () => {
    if (!selectedBlock) return;

    // Capture styling settings (exclude IDs and content)
    const { id, order, L1, L2, url, altText, caption, createdAt, updatedAt, ...styling } = selectedBlock as any;
    
    const newPreset: StylePreset = {
      id: `preset-${Date.now()}`,
      name: `Preset ${presets.length + 1} (${selectedBlock.type})`,
      type: selectedBlock.type,
      settings: styling
    };

    addPreset(newPreset);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-card animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Style Presets</h3>
        </div>
        {selectedBlock && (
          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10" onClick={handleCapturePreset}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {!selectedBlock && presets.length === 0 && (
          <div className="text-center py-12 px-6">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-xs text-muted-foreground italic">
              Select a block to capture its style as a reusable preset.
            </p>
          </div>
        )}

        {selectedBlock && (
          <div className="p-4 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5">
             <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-2">Selected Context</span>
             <p className="text-xs text-muted-foreground">You can capture the styling of this {selectedBlock.type} block.</p>
             <Button className="w-full mt-3 h-8 text-xs gap-2" onClick={handleCapturePreset}>
               <Plus className="h-3 w-3" /> Save Current Style
             </Button>
          </div>
        )}

        {presets.length > 0 && (
          <div className="space-y-4">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Global Library</Label>
            <div className="grid grid-cols-1 gap-2">
              {presets.map((preset) => (
                <div 
                  key={preset.id}
                  className="group flex items-center gap-3 p-3 rounded-xl border bg-muted/10 hover:border-primary/50 transition-all cursor-default"
                >
                  <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center border shadow-sm shrink-0">
                    {preset.type === 'text' && <Type className="h-4 w-4 text-muted-foreground" />}
                    {preset.type === 'image' && <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                    {preset.type === 'separator' && <SeparatorHorizontal className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold block truncate">{preset.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{preset.type} style</span>
                  </div>

                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => deletePreset(preset.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {selectedBlock && selectedBlock.type === preset.type && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-primary hover:bg-primary/10"
                        onClick={() => applyPreset(currentPageIndex, selectedBlock.id, preset.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {presets.length > 0 && (
        <div className="p-4 border-t bg-muted/5 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Library Synced</span>
        </div>
      )}
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
