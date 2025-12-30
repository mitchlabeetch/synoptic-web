// src/components/editor/BlockInspector.tsx
'use client';

import { useProjectStore } from '@/lib/store/projectStore';
import { 
  Type, 
  Trash2,
  Copy,
  Image as ImageIcon,
  AlignCenter,
  AlignLeft,
  AlignRight,
  SeparatorHorizontal,
  Palette,
  FileText,
  MessageSquare,
  Eye,
  Hash,
  Maximize2,
  Sparkles,
  BookOpen,
  Globe,
  Languages
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
import { Switch } from "@/components/ui/switch"
import { useTranslations } from 'next-intl';

export default function BlockInspector() {
  const { 
    content, 
    currentPageIndex, 
    selectedBlockId, 
    updateBlock, 
    deleteBlock,
    updatePage
  } = useProjectStore();
  
  const t = useTranslations('Inspector');
  const tBlocks = useTranslations('Blocks');
  const tCommon = useTranslations('Common');
  const tStudio = useTranslations('Studio');


  const currentPage = content.pages[currentPageIndex];
  const selectedBlock = currentPage?.blocks.find(
    (b) => b.id === selectedBlockId
  );

  // IF NO BLOCK SELECTED: Show Page Inspector
  if (!selectedBlock) {
    if (!currentPage) return null;

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-card animate-in fade-in duration-300">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {tStudio('pageSettings', { number: currentPage.number })}
          </h3>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-8">
          <section className="space-y-4">
            <Label className="text-xs font-bold text-muted-foreground uppercase">{t('visibility')}</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/10">
                <div className="flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{t('header')}</span>
                </div>
                <Switch 
                  checked={currentPage.showHeader !== false} 
                  onCheckedChange={(val) => updatePage(currentPageIndex, { showHeader: val })}
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/10">
                <div className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{t('pageNumber')}</span>
                </div>
                <Switch 
                  checked={currentPage.showPageNumber !== false} 
                  onCheckedChange={(val) => updatePage(currentPageIndex, { showPageNumber: val })}
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/10">
                <div className="flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{t('footer')}</span>
                </div>
                <Switch 
                  checked={currentPage.showFooter !== false} 
                  onCheckedChange={(val) => updatePage(currentPageIndex, { showFooter: val })}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <Label className="text-xs font-bold text-muted-foreground uppercase">{t('content')}</Label>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="header-text" className="text-[10px] text-muted-foreground">{t('headerOverlay')}</Label>
                <Input 
                  id="header-text"
                  placeholder="..."
                  value={currentPage.headerText || ''}
                  onChange={(e) => updatePage(currentPageIndex, { headerText: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer-text" className="text-[10px] text-muted-foreground">{t('footerOverlay')}</Label>
                <Input 
                  id="footer-text"
                  placeholder="..."
                  value={currentPage.footerText || ''}
                  onChange={(e) => updatePage(currentPageIndex, { footerText: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <Label className="text-xs font-bold text-muted-foreground uppercase">{t('printingFlow')}</Label>
            <div className="space-y-2">
               <Button 
                variant={currentPage.isChapterStart ? 'default' : 'outline'} 
                className="w-full justify-start gap-2 h-10 text-xs"
                onClick={() => updatePage(currentPageIndex, { isChapterStart: !currentPage.isChapterStart })}
               >
                 <Hash className="h-4 w-4" />
                 {t('markChapterStart')}
               </Button>
               <Button 
                variant={currentPage.isBlankPage ? 'default' : 'outline'} 
                className="w-full justify-start gap-2 h-10 text-xs"
                onClick={() => updatePage(currentPageIndex, { isBlankPage: !currentPage.isBlankPage })}
               >
                 <Maximize2 className="h-4 w-4" />
                 {t('forceBlank')}
               </Button>
            </div>
          </section>
        </div>

        <div className="p-4 border-t bg-muted/5 text-[10px] text-muted-foreground italic text-center">
          {t('pageLocalOnly')}
        </div>
      </div>
    );
  }

  const isText = selectedBlock.type === 'text';
  const isImage = selectedBlock.type === 'image';
  const isSeparator = selectedBlock.type === 'separator';
  const isCallout = selectedBlock.type === 'callout';

  const blockNotes = content.notes.filter(n => n.blockId === selectedBlockId);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-card">
      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
          {isText && <Type className="h-4 w-4 text-primary" />}
          {isImage && <ImageIcon className="h-4 w-4 text-primary" />}
          {isSeparator && <SeparatorHorizontal className="h-4 w-4 text-primary" />}
          {isCallout && <MessageSquare className="h-4 w-4 text-primary" />}
          {t('inspectorTitle', { type: tBlocks(selectedBlock.type) })}
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
            {/* AI INSIGHTS SECTION */}
            {blockNotes.length > 0 && (
              <section className="space-y-4">
                <Label className="text-xs font-bold text-primary uppercase flex items-center gap-2">
                  <Sparkles className="h-3 w-3 animate-pulse" />
                  {t('aiInsights')}
                </Label>
                <div className="space-y-3">
                  {blockNotes.map((note) => (
                    <div 
                      key={note.id} 
                      className="p-3 rounded-lg border bg-gradient-to-br from-primary/5 to-accent/5 space-y-2 group hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        {note.type === 'grammar' && <BookOpen className="h-3 w-3 text-blue-500" />}
                        {note.type === 'culture' && <Globe className="h-3 w-3 text-green-500" />}
                        {note.type === 'vocabulary' && <Languages className="h-3 w-3 text-orange-500" />}
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">{note.type}</span>
                      </div>
                      <h4 className="text-xs font-bold leading-tight">{note.title}</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{note.content}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase">{t('layout')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {['side-by-side', 'interlinear', 'stacked'].map((layout) => (
                  <Button
                    key={layout}
                    variant={selectedBlock.layout === layout ? 'default' : 'outline'}
                    className="justify-start gap-2 h-10 px-3 capitalize text-xs"
                    onClick={() => updateBlock(currentPageIndex, selectedBlock.id, { layout: layout as any })}
                  >
                    <div className="w-2 h-2 rounded-full bg-current opacity-50" />
                    {t(layout === 'side-by-side' ? 'sideBySide' : layout === 'interlinear' ? 'interlinear' : 'stacked')}
                  </Button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase">{t('typography')}</Label>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('lineHeight')}</span>
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
                    <span>{t('paraSpacing')}</span>
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
              <Label className="text-xs font-bold text-muted-foreground uppercase">{t('dimensions')} & {t('alignment')}</Label>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('width')}</span>
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
              <Label className="text-xs font-bold text-muted-foreground uppercase">{t('styleEffects')}</Label>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t('shadow')}</span>
                  <Button 
                    variant={(selectedBlock as any).shadow ? 'default' : 'outline'} 
                    size="sm" 
                    className="h-7 w-12"
                    onClick={() => updateBlock(currentPageIndex, selectedBlock.id, { shadow: !(selectedBlock as any).shadow } as any)}
                  >
                    {(selectedBlock as any).shadow ? tCommon('on') : tCommon('off')}
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('borderRadius')}</span>
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
              <Label className="text-xs font-bold text-muted-foreground uppercase">{t('stylePattern')}</Label>
              <Select 
                value={(selectedBlock as any).style || 'line'}
                onValueChange={(val) => updateBlock(currentPageIndex, selectedBlock.id, { style: val } as any)}
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder={t('stylePattern')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">{t('solidLine')}</SelectItem>
                  <SelectItem value="double-line">{t('doubleLine')}</SelectItem>
                  <SelectItem value="dashed">{t('dashedLine')}</SelectItem>
                  <SelectItem value="dotted">{t('dottedLine')}</SelectItem>
                  <SelectItem value="gradient">{t('gradientFade')}</SelectItem>
                  <SelectItem value="ornament-fleuron">{t('ornament')}</SelectItem>
                </SelectContent>
              </Select>
            </section>

            <section className="space-y-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase">{t('dimensions')}</Label>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('width')}</span>
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
                    <span>{t('thickness')}</span>
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

        {/* CALLOUT SPECIFIC CONTROLS */}
        {isCallout && (
          <>
            <section className="space-y-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase">{t('contextType')}</Label>
              <Select 
                value={(selectedBlock as any).calloutType || 'note'}
                onValueChange={(val) => updateBlock(currentPageIndex, selectedBlock.id, { calloutType: val } as any)}
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">{tBlocks('note')}</SelectItem>
                  <SelectItem value="tip">{tBlocks('tip')}</SelectItem>
                  <SelectItem value="warning">{tBlocks('warning')}</SelectItem>
                  <SelectItem value="grammar">{tBlocks('grammar')}</SelectItem>
                  <SelectItem value="vocabulary">{tBlocks('vocabulary')}</SelectItem>
                  <SelectItem value="culture">{tBlocks('culture')}</SelectItem>
                  <SelectItem value="pronunciation">{tBlocks('pronunciation')}</SelectItem>
                </SelectContent>
              </Select>
            </section>

            <section className="space-y-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase">{t('brandingColor')}</Label>
              <div className="grid grid-cols-5 gap-2">
                {['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#64748b', '#000000'].map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "h-8 rounded-md border shadow-sm transition-all hover:scale-110",
                      (selectedBlock as any).headerColor === color ? "ring-2 ring-primary ring-offset-2" : ""
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => updateBlock(currentPageIndex, selectedBlock.id, { headerColor: color } as any)}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <div className="p-4 border-t bg-muted/5 flex gap-2 mt-auto">
        <Button variant="outline" className="flex-1 gap-2 text-xs" onClick={() => {}}>
          <Copy className="h-3 w-3" />
          {tCommon('duplicate')}
        </Button>
        <Button variant="outline" className="flex-1 gap-2 text-xs" onClick={() => {}}>
          <Palette className="h-3 w-3" />
          {t('stylePreset')}
        </Button>
      </div>
    </div>
  );
}
