// src/components/editor/Sidebar.tsx
'use client';

import { useState } from 'react';
import { useProjectStore } from '@/lib/store/projectStore';
import { cn } from '@/lib/utils';
import { 
  Layout, 
  Type, 
  Image as ImageIcon, 
  SeparatorHorizontal,
  MessageSquare, 
  Languages, 
  Settings2,
  Layers,
  PlusCircle,
  Hash,
  ChevronLeft,
  ChevronRight,
  Palette,
  Printer,
  BookOpen,
  FileText,
  Shield,
  ImageIcon as CoverIcon
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PageManager from './PageManager';
import ThemeInspector from './ThemeInspector';
import StylePresetManager from './StylePresetManager';
import LocaleSwitcher from './LocaleSwitcher';
import ExportManager from './ExportManager';
import StructureManager from './StructureManager';
import GlossaryGuard from './GlossaryGuard';
import CoverArchitect from './CoverArchitect';

export default function Sidebar() {
  const { addBlock, addPage, addQuizBlock, currentPageIndex, meta } = useProjectStore();
  const [activeTab, setActiveTab] = useState<'tools' | 'pages' | 'design' | 'presets' | 'publish' | 'structure' | 'glossary' | 'cover'>('pages');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const t = useTranslations('Blocks');
  const tStudio = useTranslations('Studio');

  const handleAddTextBlock = () => {
    addBlock(currentPageIndex, {
      id: `block-${Date.now()}`,
      type: 'text',
      L1: { 
        content: '...', // Placeholder - user will type their content
        lang: meta?.source_lang || 'en' 
      },
      L2: { 
        content: '...', // Placeholder - user will type their content
        lang: meta?.target_lang || 'en' 
      },
      layout: 'side-by-side',
      lineSpacing: 1.5,
      paragraphSpacing: 20,
    } as any);
  };

  const handleAddSeparator = () => {
    addBlock(currentPageIndex, {
      id: `block-${Date.now()}`,
      type: 'separator',
    } as any);
  };

  const handleAddImageBlock = () => {
    addBlock(currentPageIndex, {
      id: `block-${Date.now()}`,
      type: 'image',
      url: '', 
      altText: '',
      alignment: 'center',
      width: 100,
      borderRadius: 8,
      shadow: true,
      caption: { L1: '', L2: '' },
    } as any);
  };

  const handleAddCallout = () => {
    addBlock(currentPageIndex, {
      id: `block-${Date.now()}`,
      type: 'callout',
      calloutType: 'note',
      title: '',
      content: '',
      headerColor: '#2563eb',
      backgroundColor: '#eff6ff',
      textColor: '#1e40af',
    } as any);
  };

  const handleAddQuizBlock = () => {
    addQuizBlock(currentPageIndex, 'The word for book in French is', 'livre', '.');
  };

  const tGlossary = useTranslations('GlossaryGuard');
  const tCover = useTranslations('CoverArchitect');

  const tools = [
    { id: 'pages', icon: Layout, label: tStudio('pageManager'), onClick: () => { setActiveTab('pages'); setIsCollapsed(false); } },
    { id: 'structure', icon: FileText, label: tStudio('bookStructure') || 'Book Structure', onClick: () => { setActiveTab('structure'); setIsCollapsed(false); } },
    { id: 'design', icon: Palette, label: tStudio('globalDesign'), onClick: () => { setActiveTab('design'); setIsCollapsed(false); } },
    { id: 'glossary', icon: Shield, label: tGlossary('title'), onClick: () => { setActiveTab('glossary'); setIsCollapsed(false); } },
    { id: 'cover', icon: CoverIcon, label: tCover('title'), onClick: () => { setActiveTab('cover'); setIsCollapsed(false); } },
    { id: 'publish', icon: Printer, label: tStudio('publishingPipeline'), onClick: () => { setActiveTab('publish'); setIsCollapsed(false); } },
    { id: 'presets', icon: Layers, label: tStudio('stylePresets'), onClick: () => { setActiveTab('presets'); setIsCollapsed(false); } },
    { id: 'text', icon: Type, label: t('text'), onClick: handleAddTextBlock },
    { id: 'separator', icon: SeparatorHorizontal, label: t('separator'), onClick: handleAddSeparator },
    { id: 'callout', icon: MessageSquare, label: t('callout'), onClick: handleAddCallout },
    { id: 'quiz', icon: BookOpen, label: t('quiz') || 'Quiz Exercise', onClick: handleAddQuizBlock },
    { id: 'media', icon: ImageIcon, label: t('media'), onClick: handleAddImageBlock },
    { id: 'ai', icon: Languages, label: t('ai'), onClick: () => {} },
    { id: 'settings', icon: Settings2, label: t('settings'), onClick: () => {} },
  ];

  return (
    <TooltipProvider>
      <div className={cn(
        "flex h-full bg-card border-r shadow-sm transition-all duration-300 relative",
        isCollapsed ? "w-16" : "w-64 lg:w-72"
      )}>
        {/* Toggle Collapse Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm z-50 hover:bg-muted"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>

        {/* Sidebar Navigation (Always icons) */}
        <div className="w-16 border-r flex flex-col items-center py-4 bg-muted/10 shrink-0">
          <nav className="space-y-4 w-full px-2">
            {tools.map((tool) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      if (['pages', 'structure', 'design', 'presets', 'publish', 'glossary', 'cover'].includes(tool.id)) {
                        setActiveTab(tool.id as any);
                        setIsCollapsed(false);
                      } else {
                        setActiveTab('tools');
                        setIsCollapsed(false);
                        tool.onClick();
                      }
                    }}
                    className={cn(
                      "w-full aspect-square flex items-center justify-center rounded-xl transition-all",
                      (activeTab === tool.id) || (activeTab === 'tools' && !['pages', 'structure', 'design', 'presets', 'settings', 'publish'].includes(tool.id))
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    )}
                    data-tour={
                      tool.id === 'pages' ? 'sidebar-pages' : 
                      tool.id === 'publish' ? 'sidebar-publish' : 
                      tool.id === 'structure' ? 'sidebar-structure' :
                      (['text', 'separator', 'callout', 'quiz', 'media', 'ai'].includes(tool.id)) ? 'sidebar-tools' : undefined
                    }
                  >
                    <tool.icon className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {tool.label}
                </TooltipContent>
              </Tooltip>
            ))}
          </nav>
        </div>

        {/* Dynamic Panel Content (Hidden if collapsed) */}
        {!isCollapsed && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'pages' && <PageManager />}
            {activeTab === 'structure' && <StructureManager />}
            {activeTab === 'design' && <ThemeInspector />}
            {activeTab === 'glossary' && <GlossaryGuard />}
            {activeTab === 'cover' && <CoverArchitect />}
            {activeTab === 'presets' && <StylePresetManager />}
            {activeTab === 'publish' && <ExportManager />}
            {activeTab === 'tools' && (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b bg-muted/20">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{tStudio('editorTools')}</h3>
                </div>
                <div className="flex-1 overflow-auto p-4 space-y-6">
                   <div className="space-y-2">
                     <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{tStudio('canvasActions')}</Label>
                     <Button variant="outline" className="w-full justify-start gap-2" size="sm" onClick={() => addPage(currentPageIndex)}>
                        <PlusCircle className="h-4 w-4" />
                        {t('addBlankPage')}
                     </Button>
                     <Button variant="outline" className="w-full justify-start gap-2" size="sm" onClick={handleAddTextBlock}>
                        <Type className="h-4 w-4" />
                        {t('insertText')}
                     </Button>
                   </div>

                   <div className="space-y-2">
                     <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{tStudio('drafting')}</Label>
                     <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                        <Hash className="h-4 w-4" />
                        {tStudio('chapterStart')}
                     </button>
                   </div>
                </div>
              </div>
            )}
            
            {/* Footer Info (Hidden if collapsed) */}
            <div className="p-4 border-t bg-muted/5 mt-auto flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground italic">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="uppercase tracking-tighter font-bold opacity-60">{tStudio('bilingualEditor')} — Engine v0.4.0</span>
              </div>
              <LocaleSwitcher />
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <span className={cn("block mb-1", className)}>{children}</span>;
}
