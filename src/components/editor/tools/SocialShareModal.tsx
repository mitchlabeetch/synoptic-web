// src/components/editor/tools/SocialShareModal.tsx
// PURPOSE: Interactive modal for exporting bilingual text blocks as social media images
// ACTION: Provides format/theme selection with live preview, then triggers html2canvas export
// MECHANISM: Renders a staged "card" with social styling and uses generateSocialImage() service

'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, Share2, Loader2, Layout, Smartphone, Monitor, LayoutGrid } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useTranslations } from 'next-intl';
// NOTE: html2canvas is dynamically imported when needed to avoid 194KB upfront bundle cost

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

export type SocialFormat = 'square' | 'story' | 'landscape';
export type SocialTheme = 'clean' | 'midnight' | 'synoptic';

interface SocialShareModalProps {
  triggerContent: React.ReactNode;
  // The text content to export (bilingual pair)
  sourceText: string;
  targetText: string;
  sourceLang: string;
  targetLang: string;
}

// ═══════════════════════════════════════════════════
// THEME & FORMAT CONFIGURATIONS
// ═══════════════════════════════════════════════════

const DIMENSIONS: Record<SocialFormat, { w: number; h: number; label: string }> = {
  square: { w: 1080, h: 1080, label: '1:1' },
  story: { w: 1080, h: 1920, label: '9:16' },
  landscape: { w: 1200, h: 630, label: '1.9:1' }
};

const THEMES: Record<SocialTheme, { 
  background: string; 
  cardBg: string; 
  text: string; 
  accent: string;
  label: string;
}> = {
  clean: {
    background: 'linear-gradient(135deg, #fdfbf7 0%, #ffffff 100%)',
    cardBg: 'rgba(255,255,255,0.8)',
    text: '#1a1a1a',
    accent: '#059669',
    label: 'Clean'
  },
  midnight: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    cardBg: 'rgba(255,255,255,0.1)',
    text: '#ffffff',
    accent: '#4ade80',
    label: 'Midnight'
  },
  synoptic: {
    background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
    cardBg: 'rgba(255,255,255,0.9)',
    text: '#1a1a1a',
    accent: '#30b8c8',
    label: 'Synoptic'
  }
};

// ═══════════════════════════════════════════════════
// UTILITY: Strip HTML tags for clean export
// ═══════════════════════════════════════════════════

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════

export function SocialShareModal({ 
  triggerContent, 
  sourceText, 
  targetText, 
  sourceLang, 
  targetLang 
}: SocialShareModalProps) {
  const [format, setFormat] = useState<SocialFormat>('square');
  const [theme, setTheme] = useState<SocialTheme>('clean');
  const [includeBranding, setIncludeBranding] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const stageRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('Export');

  // Clean text for display
  const cleanSource = stripHtml(sourceText);
  const cleanTarget = stripHtml(targetText);

  // Get computed styles for current theme/format
  const themeConfig = THEMES[theme];
  const dim = DIMENSIONS[format];

  // ═══════════════════════════════════════════════════
  // EXPORT HANDLER
  // ═══════════════════════════════════════════════════

  const handleDownload = async () => {
    if (!stageRef.current) return;
    setIsGenerating(true);

    try {
      // Create off-screen staging container
      const container = document.createElement('div');
      container.id = `social-stage-${Date.now()}`;
      
      // Apply exact dimensions and styling
      Object.assign(container.style, {
        position: 'fixed',
        left: '-9999px',
        top: '0',
        width: `${dim.w}px`,
        height: `${dim.h}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px',
        fontFamily: '"Crimson Pro", "Inter", system-ui, sans-serif',
        boxSizing: 'border-box',
        zIndex: '99999',
        background: themeConfig.background,
        color: themeConfig.text
      });

      // Card body (glassmorphic container)
      const cardBody = document.createElement('div');
      Object.assign(cardBody.style, {
        background: themeConfig.cardBg,
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '60px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '900px',
        border: '1px solid rgba(255,255,255,0.2)',
        textAlign: 'center'
      });

      // Source text (smaller, italic)
      const sourceBlock = document.createElement('div');
      Object.assign(sourceBlock.style, {
        fontSize: format === 'story' ? '28px' : '32px',
        lineHeight: '1.6',
        fontStyle: 'italic',
        opacity: '0.75',
        marginBottom: '28px'
      });
      sourceBlock.textContent = `"${cleanSource}"`;
      cardBody.appendChild(sourceBlock);

      // Divider with language labels
      const divider = document.createElement('div');
      Object.assign(divider.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        marginBottom: '28px',
        fontSize: '14px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: themeConfig.accent
      });
      divider.textContent = `${sourceLang.toUpperCase()} → ${targetLang.toUpperCase()}`;
      cardBody.appendChild(divider);

      // Target text (larger, prominent)
      const targetBlock = document.createElement('div');
      Object.assign(targetBlock.style, {
        fontSize: format === 'story' ? '34px' : '38px',
        lineHeight: '1.5',
        fontWeight: '500'
      });
      targetBlock.textContent = `"${cleanTarget}"`;
      cardBody.appendChild(targetBlock);

      container.appendChild(cardBody);

      // Branding footer
      if (includeBranding) {
        const footer = document.createElement('div');
        Object.assign(footer.style, {
          position: 'absolute',
          bottom: '50px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          opacity: '0.6',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontWeight: '600',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontVariant: 'small-caps'
        });
        footer.innerHTML = `
          <span style="color: ${themeConfig.accent}; font-size: 24px;">●</span>
          <span>synoptic</span>
          <span style="opacity: 0.5">•</span>
          <span style="opacity: 0.7; font-weight: 400">getsynoptic.com</span>
        `;
        container.appendChild(footer);
      }

      // Mount & Render
      document.body.appendChild(container);

      // Dynamically import html2canvas only when needed (saves ~194KB from initial bundle)
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(container, {
        scale: 2, // Retina quality
        useCORS: true,
        backgroundColor: null,
        logging: false
      });

      // Trigger download
      const link = document.createElement('a');
      link.download = `synoptic-${format}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      // Cleanup
      document.body.removeChild(container);

    } catch (e) {
      console.error("Social export failed:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerContent}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Share2 className="w-5 h-5 text-pink-500" />
            {t('socialShare')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* ═══════════════════════════════════════════ */}
          {/* LEFT: Controls */}
          {/* ═══════════════════════════════════════════ */}
          <div className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                {t('socialFormat')}
              </label>
              <Tabs value={format} onValueChange={(v: string) => setFormat(v as SocialFormat)}>
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="square" className="gap-1.5 text-xs">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Square</span>
                  </TabsTrigger>
                  <TabsTrigger value="story" className="gap-1.5 text-xs">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Story</span>
                  </TabsTrigger>
                  <TabsTrigger value="landscape" className="gap-1.5 text-xs">
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Wide</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Theme Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                Visual Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(THEMES) as SocialTheme[]).map((th) => (
                  <button
                    key={th}
                    onClick={() => setTheme(th)}
                    className={`h-14 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                      theme === th 
                        ? 'border-primary ring-2 ring-primary/20 scale-105' 
                        : 'border-transparent hover:border-border hover:scale-102'
                    }`}
                    style={{
                      background: THEMES[th].background
                    }}
                  >
                    <span 
                      className="text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: THEMES[th].text }}
                    >
                      {THEMES[th].label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Branding Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
              <label className="text-xs font-medium text-muted-foreground">
                {t('includeBranding')}
              </label>
              <Switch 
                checked={includeBranding} 
                onCheckedChange={setIncludeBranding}
              />
            </div>

            {/* Download Button */}
            <div className="pt-4">
              <Button 
                onClick={handleDownload} 
                disabled={isGenerating || !cleanSource || !cleanTarget} 
                className="w-full h-12 text-base font-bold gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-500/25"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {t('exportImage')}
              </Button>
            </div>

            {/* Platform Badges */}
            <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
              <span className="px-2 py-1 rounded-full bg-pink-500/10 text-pink-600 font-medium">
                Instagram
              </span>
              <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 font-medium">
                Twitter
              </span>
              <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-600 font-medium">
                Pinterest
              </span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* RIGHT: Live Preview */}
          {/* ═══════════════════════════════════════════ */}
          <div className="relative">
            <div 
              ref={stageRef}
              className="rounded-xl border-2 border-dashed overflow-hidden transition-all duration-300"
              style={{
                aspectRatio: format === 'story' ? '9/16' : format === 'landscape' ? '1.9/1' : '1/1',
                maxHeight: '400px',
                background: themeConfig.background,
                color: themeConfig.text
              }}
            >
              {/* Preview Card */}
              <div className="h-full flex flex-col items-center justify-center p-4">
                <div 
                  className="rounded-xl p-4 max-w-[90%] text-center transition-all duration-300"
                  style={{
                    background: themeConfig.cardBg,
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  {/* Source (smaller) */}
                  <p 
                    className="text-[11px] leading-relaxed italic mb-2 opacity-70 line-clamp-2"
                  >
                    "{cleanSource || 'Source text...'}"
                  </p>
                  
                  {/* Language arrow */}
                  <p 
                    className="text-[9px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: themeConfig.accent }}
                  >
                    {sourceLang.toUpperCase()} → {targetLang.toUpperCase()}
                  </p>
                  
                  {/* Target (larger) */}
                  <p 
                    className="text-[13px] font-medium leading-relaxed line-clamp-3"
                  >
                    "{cleanTarget || 'Target text...'}"
                  </p>
                </div>

                {/* Branding preview */}
                {includeBranding && (
                  <div 
                    className="absolute bottom-3 flex items-center gap-1.5 opacity-50"
                    style={{ fontSize: '9px', fontVariant: 'small-caps' }}
                  >
                    <span style={{ color: themeConfig.accent }}>●</span>
                    <span className="font-semibold tracking-wider">synoptic</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dimension Label */}
            <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/50 text-white text-[10px] font-mono">
              {dim.w}×{dim.h}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
