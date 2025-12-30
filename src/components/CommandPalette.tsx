// src/components/CommandPalette.tsx
'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/store/projectStore';
import {
  FileText,
  Download,
  Search,
  Undo2,
  Redo2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('CommandPalette');
  
  const { 
    addBlock, 
    undo, 
    redo, 
    currentPageIndex,
    meta,
    selectedBlockId,
    deleteBlock
  } = useProjectStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const actions = [
    {
      id: 'add-text',
      label: t('addText'),
      icon: FileText,
      shortcut: 'T',
      action: () => addBlock(currentPageIndex, { 
        id: `block-${Date.now()}`, 
        type: 'text', 
        L1: { content: '', lang: meta?.source_lang || 'fr' },
        L2: { content: '', lang: meta?.target_lang || 'en' },
        layout: 'side-by-side'
      } as any),
    },
    {
      id: 'undo',
      label: t('undo'),
      icon: Undo2,
      shortcut: '⌘Z',
      action: () => undo(),
    },
    {
      id: 'redo',
      label: t('redo'),
      icon: Redo2,
      shortcut: '⌘⇧Z',
      action: () => redo(),
    },
    {
      id: 'delete-block',
      label: t('deleteBlock'),
      icon: Trash2,
      shortcut: '⌫',
      disabled: !selectedBlockId,
      action: () => selectedBlockId && deleteBlock(currentPageIndex, selectedBlockId),
    },
    {
      id: 'export-pdf',
      label: t('exportPdf'),
      icon: Download,
      action: () => {
        document.querySelector<HTMLElement>('[data-tour="sidebar-publish"]')?.click();
      },
    }
  ];

  return (
    <Command.Dialog 
      open={open} 
      onOpenChange={setOpen} 
      label={t('commandMenu')}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-background/50 backdrop-blur-sm px-4"
    >
      <div className="w-full max-w-[600px] bg-card border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Command.Input 
            placeholder={t('placeholder')} 
            className="flex-1 h-14 bg-transparent border-none outline-none text-sm px-4 focus:ring-0"
          />
          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded border bg-muted text-[10px] font-medium text-muted-foreground uppercase">
             {t('esc')}
          </div>
        </div>
        
        <Command.List className="max-h-[350px] overflow-auto p-2">
          <Command.Empty className="p-8 text-center text-sm text-muted-foreground">
            {t('noResults')}
          </Command.Empty>
          
          <Command.Group heading={t('actions')} className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            {actions.map((action) => (
              <Command.Item
                key={action.id}
                onSelect={() => {
                  action.action();
                  setOpen(false);
                }}
                disabled={action.disabled}
                className={cn(
                  "flex items-center justify-between px-3 py-3 rounded-xl cursor-default select-none outline-none transition-colors",
                  "aria-selected:bg-primary aria-selected:text-primary-foreground",
                  action.disabled && "opacity-40 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-3">
                  <action.icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">{action.label}</span>
                </div>
                {action.shortcut && (
                  <kbd className="hidden md:block text-[10px] font-sans font-bold opacity-60 uppercase">
                    {action.shortcut}
                  </kbd>
                )}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
        
        <div className="bg-muted/30 p-3 border-t flex justify-between items-center px-6">
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-1">
               <span className="text-[10px] lowercase text-muted-foreground font-medium">{t('select')}</span>
               <div className="px-1.5 py-0.5 rounded border bg-background text-[9px] font-black tracking-tighter shadow-sm text-muted-foreground">↵</div>
             </div>
             <div className="flex items-center gap-1">
               <span className="text-[10px] lowercase text-muted-foreground font-medium">{t('navigate')}</span>
               <div className="px-1.5 py-0.5 rounded border bg-background text-[9px] font-black tracking-tighter shadow-sm text-muted-foreground">↑↓</div>
             </div>
           </div>
           
           <div className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
             {t('paletteTitle')}
           </div>
        </div>
      </div>
    </Command.Dialog>
  );
}
