// src/components/editor/ThemeInspector.tsx
'use client';

import { useProjectStore } from '@/lib/store/projectStore';
import { 
  Palette, 
  Type, 
  Layout, 
  Maximize2,
  Check,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from 'next-intl';

const FONT_OPTIONS = [
  'Quicksand',
  'Crimson Pro',
  'Inter',
  'Inter Tight',
  'EB Garamond',
  'Playfair Display',
  'Lora',
  'Roboto Mono',
  'Outfit',
  'Merriweather',
];

export default function ThemeInspector() {
  const { settings, updateSettings } = useProjectStore();
  const t = useTranslations('Theme');
  const tStudio = useTranslations('Studio');

  const THEME_PALETTES = [
    { id: 'classic', label: 'Classic Noir', primary: '#1a1a1a', accent: '#3b82f6', bg: '#ffffff' },
    { id: 'sepia', label: 'Vintage Sepia', primary: '#433422', accent: '#b45309', bg: '#fdf6e3' },
    { id: 'modern', label: 'Modern Slate', primary: '#0f172a', accent: '#10b981', bg: '#f8fafc' },
    { id: 'midnight', label: 'Midnight Blue', primary: '#d1d5db', accent: '#60a5fa', bg: '#020617' },
  ];

  const handleFontChange = (type: 'heading' | 'body' | 'annotation', value: string) => {
    updateSettings({
      fonts: { ...settings.fonts, [type]: value }
    });
  };

  const handleTypographyChange = (key: string, value: number) => {
    updateSettings({
      typography: { ...settings.typography, [key]: value }
    });
  };

  const handlePaletteSelect = (palette: typeof THEME_PALETTES[0]) => {
    updateSettings({
      colors: {
        ...settings.colors,
        primary: palette.primary,
        accent: palette.accent,
        background: palette.bg,
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-card animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b bg-muted/20 flex items-center gap-2">
        <Palette className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">{t('title')}</h3>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {/* Layout Strategy */}
        <section className="space-y-4">
          <Label className="text-xs font-bold text-muted-foreground uppercase">{t('layout')}</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['side-by-side', 'interlinear', 'alternating'] as const).map((mode) => (
              <Button
                key={mode}
                variant={settings.layout === mode ? 'default' : 'outline'}
                className="justify-start gap-2 h-10 px-3 capitalize text-xs"
                onClick={() => updateSettings({ layout: mode })}
              >
                <Layout className="h-3 w-3 opacity-50" />
                {mode.replace('-', ' ')}
              </Button>
            ))}
          </div>
        </section>

        {/* Fonts */}
        <section className="space-y-4">
          <Label className="text-xs font-bold text-muted-foreground uppercase font-outfit">{t('typography')}</Label>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{t('bodyText')}</span>
              <Select value={settings.fonts.body} onValueChange={(v) => handleFontChange('body', v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map(font => (
                    <SelectItem key={font} value={font} style={{ fontFamily: font }}>{font}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{t('headings')}</span>
              <Select value={settings.fonts.heading} onValueChange={(v) => handleFontChange('heading', v)}>
                <SelectTrigger className="h-9 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map(font => (
                    <SelectItem key={font} value={font} style={{ fontFamily: font }}>{font}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Global Sizes */}
        <section className="space-y-4">
          <Label className="text-xs font-bold text-muted-foreground uppercase">{t('baseScaling')}</Label>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('fontSize')}</span>
                <span className="font-medium font-mono">{settings.typography.baseSize}pt</span>
              </div>
              <Slider 
                value={[settings.typography.baseSize]} 
                max={24} min={8} step={0.5}
                onValueChange={([v]) => handleTypographyChange('baseSize', v)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('lineHeight')}</span>
                <span className="font-medium font-mono">{settings.typography.lineHeight}</span>
              </div>
              <Slider 
                value={[settings.typography.lineHeight]} 
                max={2.5} min={1.0} step={0.05}
                onValueChange={([v]) => handleTypographyChange('lineHeight', v)}
              />
            </div>
          </div>
        </section>

        {/* Color Palettes */}
        <section className="space-y-4">
          <Label className="text-xs font-bold text-muted-foreground uppercase">{t('colorPresets')}</Label>
          <div className="grid grid-cols-1 gap-2">
            {THEME_PALETTES.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePaletteSelect(p)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left group",
                  settings.colors.background === p.bg ? "border-primary bg-primary/5" : "border-transparent bg-muted/30 hover:bg-muted/50"
                )}
              >
                <div className="flex -space-x-2">
                  <div className="h-8 w-8 rounded-full border border-background shadow-sm" style={{ backgroundColor: p.bg }} />
                  <div className="h-8 w-8 rounded-full border border-background shadow-sm" style={{ backgroundColor: p.primary }} />
                  <div className="h-8 w-8 rounded-full border border-background shadow-sm" style={{ backgroundColor: p.accent }} />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold block">{p.label}</span>
                  <span className="text-[10px] text-muted-foreground">{p.id === 'midnight' ? t('darkMode') : t('lightMode')}</span>
                </div>
                {settings.colors.background === p.bg && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="p-4 border-t bg-muted/5 flex gap-2 mt-auto">
        <Button variant="outline" className="flex-1 gap-2 text-xs uppercase font-bold tracking-tighter">
          {tStudio('resetFactory')}
        </Button>
      </div>
    </div>
  );
}
