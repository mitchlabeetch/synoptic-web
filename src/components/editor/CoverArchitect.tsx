// src/components/editor/CoverArchitect.tsx
// PURPOSE: KDP-Compliant Cover Generator with Live Spine Calculation
// ACTION: Calculates spine width based on page count and paper stock, renders safe zones
// MECHANISM: Uses Amazon KDP specifications for accurate cover dimensions

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useProjectStore } from '@/lib/store/projectStore';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  BookOpen,
  Ruler,
  Download,
  AlertTriangle,
  CheckCircle2,
  Info,
  Image as ImageIcon,
  Type,
  Layers,
  RefreshCw,
  Maximize,
  FileImage
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  PaperStock,
  CoverConfig,
  CoverDimensions,
  KDP_TRIM_SIZES,
  calculateCoverDimensions,
  generateCoverSpecs,
  MINIMUM_SPINE_PAGES,
} from '@/types/coverArchitect';

interface CoverArchitectProps {
  className?: string;
}

export default function CoverArchitect({ className }: CoverArchitectProps) {
  const { meta, content, settings } = useProjectStore();
  const t = useTranslations('CoverArchitect');
  
  // Calculate actual page count from content
  const pageCount = useMemo(() => {
    const bodyPages = content?.pages?.length || 0;
    const frontMatterPages = content?.frontMatter?.length || 0;
    const backMatterPages = content?.backMatter?.length || 0;
    return bodyPages + frontMatterPages + backMatterPages;
  }, [content]);

  // Cover configuration state
  const [config, setConfig] = useState<CoverConfig>({
    trimSize: '6x9',
    paperStock: 'cream',
    pageCount: pageCount || 150,
    includeBarcode: true,
  });

  // Update page count when content changes
  useEffect(() => {
    if (pageCount > 0) {
      setConfig(prev => ({ ...prev, pageCount }));
    }
  }, [pageCount]);

  // Calculate dimensions
  const dimensions = useMemo(() => {
    return calculateCoverDimensions(config);
  }, [config]);

  // Specs text
  const specsText = useMemo(() => {
    return generateCoverSpecs(config);
  }, [config]);

  // Validation status
  const validationStatus = useMemo(() => {
    const issues: string[] = [];
    const warnings: string[] = [];

    if (config.pageCount < MINIMUM_SPINE_PAGES) {
      warnings.push(t('spineHiddenWarning', { min: MINIMUM_SPINE_PAGES }));
    }

    if (config.pageCount < 24) {
      issues.push(t('minPagesError'));
    }

    if (config.pageCount > 828) {
      issues.push(t('maxPagesError'));
    }

    return { issues, warnings, isValid: issues.length === 0 };
  }, [config, t]);

  // Handle export
  const handleExportTemplate = async () => {
    // Generate a downloadable template with guidelines
    const templateSvg = generateTemplateSVG(dimensions, config);
    const blob = new Blob([templateSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meta?.title || 'cover'}_template_${config.trimSize}.svg`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <div className={`flex flex-col h-full bg-card ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-orange-500/10 flex items-center justify-center">
            <Layers className="h-4 w-4 text-orange-600" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
            {t('title')}
          </h3>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          {validationStatus.isValid ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-600">{t('kdpReady')}</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <span className="text-amber-600">{t('needsAttention')}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Configuration Panel */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide">
              {t('configuration')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Trim Size */}
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground uppercase">{t('trimSize')}</label>
              <Select 
                value={config.trimSize} 
                onValueChange={(v) => setConfig(prev => ({ ...prev, trimSize: v }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(KDP_TRIM_SIZES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Paper Stock */}
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground uppercase">{t('paperStock')}</label>
              <Select 
                value={config.paperStock} 
                onValueChange={(v) => setConfig(prev => ({ ...prev, paperStock: v as PaperStock }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cream" className="text-xs">
                    {t('creamPaper')} (0.002252"/page)
                  </SelectItem>
                  <SelectItem value="white" className="text-xs">
                    {t('whitePaper')} (0.002016"/page)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Page Count */}
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground uppercase">{t('pageCount')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={config.pageCount}
                  onChange={(e) => setConfig(prev => ({ ...prev, pageCount: parseInt(e.target.value) || 1 }))}
                  min={24}
                  max={828}
                  className="h-8 w-full rounded-md border bg-background px-3 text-xs"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => setConfig(prev => ({ ...prev, pageCount }))}
                  title={t('syncFromProject')}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Barcode Toggle */}
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground uppercase">{t('barcode')}</label>
              <div className="flex items-center justify-between h-8 px-3 rounded-md border bg-background">
                <span className="text-xs text-muted-foreground">{t('includeBarcode')}</span>
                <Switch 
                  checked={config.includeBarcode}
                  onCheckedChange={(v) => setConfig(prev => ({ ...prev, includeBarcode: v }))}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Live Spine Calculator */}
        <section className="p-4 rounded-xl border bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-orange-600" />
              <span className="text-[10px] font-bold uppercase text-orange-700 dark:text-orange-400">
                {t('spineCalculator')}
              </span>
            </div>
            <div className={`px-2 py-0.5 rounded text-[9px] font-bold ${
              dimensions.spineAllowsText 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
            }`}>
              {dimensions.spineAllowsText ? t('textAllowed') : t('noTextOnSpine')}
            </div>
          </div>

          {/* Spine Width Display */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-orange-600 dark:text-orange-400">
                {dimensions.spineWidth.toFixed(4)}"
              </div>
              <div className="text-sm text-muted-foreground">
                ({(dimensions.spineWidth * 25.4).toFixed(2)} mm)
              </div>
            </div>
          </div>

          {/* Visual Spine Preview */}
          <div className="flex items-center justify-center gap-1 py-3">
            <div className="h-16 bg-muted/50 rounded-l border-y border-l flex items-center justify-center" style={{ width: '60px' }}>
              <span className="text-[8px] text-muted-foreground">{t('backCover')}</span>
            </div>
            <div 
              className="h-16 bg-orange-500/20 border border-orange-500/50 flex items-center justify-center"
              style={{ width: `${Math.max(dimensions.spineWidth * 200, 4)}px` }}
            >
              {dimensions.spineAllowsText && (
                <span className="text-[8px] text-orange-600 [writing-mode:vertical-lr] rotate-180">
                  SPINE
                </span>
              )}
            </div>
            <div className="h-16 bg-muted/50 rounded-r border-y border-r flex items-center justify-center" style={{ width: '60px' }}>
              <span className="text-[8px] text-muted-foreground">{t('frontCover')}</span>
            </div>
          </div>
        </section>

        {/* Dimensions Summary */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Maximize className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide">
              {t('dimensions')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-muted/30 flex justify-between">
              <span className="text-muted-foreground">{t('totalWidth')}</span>
              <span className="font-mono font-medium">{dimensions.totalWidth.toFixed(3)}"</span>
            </div>
            <div className="p-2 rounded-lg bg-muted/30 flex justify-between">
              <span className="text-muted-foreground">{t('totalHeight')}</span>
              <span className="font-mono font-medium">{dimensions.totalHeight.toFixed(3)}"</span>
            </div>
            <div className="p-2 rounded-lg bg-muted/30 flex justify-between">
              <span className="text-muted-foreground">{t('pixelWidth')}</span>
              <span className="font-mono font-medium">{dimensions.pixelWidth} px</span>
            </div>
            <div className="p-2 rounded-lg bg-muted/30 flex justify-between">
              <span className="text-muted-foreground">{t('pixelHeight')}</span>
              <span className="font-mono font-medium">{dimensions.pixelHeight} px</span>
            </div>
          </div>
        </section>

        {/* Validation Messages */}
        {(validationStatus.issues.length > 0 || validationStatus.warnings.length > 0) && (
          <section className="space-y-2">
            {validationStatus.issues.map((issue, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                <span className="text-[10px]">{issue}</span>
              </div>
            ))}
            {validationStatus.warnings.map((warning, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                <span className="text-[10px]">{warning}</span>
              </div>
            ))}
          </section>
        )}

        {/* Export Button */}
        <Button 
          className="w-full gap-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20"
          onClick={handleExportTemplate}
          disabled={!validationStatus.isValid}
        >
          <Download className="h-3 w-3" />
          {t('downloadTemplate')}
        </Button>
      </div>

      {/* Info Footer */}
      <div className="p-3 border-t bg-muted/5">
        <div className="flex items-start gap-2">
          <Info className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-[9px] text-muted-foreground leading-relaxed">
            {t('kdpNote')}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Generates an SVG template with KDP-compliant guidelines.
 */
function generateTemplateSVG(dimensions: CoverDimensions, config: CoverConfig): string {
  const { totalWidth, totalHeight, spineWidth, frontCoverWidth, backCoverWidth, dpi } = dimensions;
  const pixelWidth = Math.ceil(totalWidth * dpi);
  const pixelHeight = Math.ceil(totalHeight * dpi);
  
  // Convert inches to pixels
  const bleedPx = 0.125 * dpi;
  const safePx = 0.25 * dpi;
  const spinePx = spineWidth * dpi;
  const frontWidthPx = frontCoverWidth * dpi;
  const backWidthPx = backCoverWidth * dpi;
  
  // Calculate positions
  const spineStartX = bleedPx + backWidthPx;
  const frontStartX = spineStartX + spinePx;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${pixelWidth}" 
     height="${pixelHeight}" 
     viewBox="0 0 ${pixelWidth} ${pixelHeight}">
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="#ffffff"/>
  
  <!-- Bleed Zone (will be trimmed) -->
  <rect x="0" y="0" width="${pixelWidth}" height="${bleedPx}" fill="#ffcccc" opacity="0.3"/>
  <rect x="0" y="${pixelHeight - bleedPx}" width="${pixelWidth}" height="${bleedPx}" fill="#ffcccc" opacity="0.3"/>
  <rect x="0" y="0" width="${bleedPx}" height="${pixelHeight}" fill="#ffcccc" opacity="0.3"/>
  <rect x="${pixelWidth - bleedPx}" y="0" width="${bleedPx}" height="${pixelHeight}" fill="#ffcccc" opacity="0.3"/>
  
  <!-- Spine Zone -->
  <rect x="${spineStartX}" y="0" width="${spinePx}" height="${pixelHeight}" fill="#ffe4c4" opacity="0.5"/>
  
  <!-- Safe Zones (keep content inside) -->
  <rect x="${bleedPx + safePx}" y="${bleedPx + safePx}" 
        width="${backWidthPx - safePx * 2}" height="${pixelHeight - bleedPx * 2 - safePx * 2}" 
        fill="none" stroke="#00cc00" stroke-width="2" stroke-dasharray="10,5"/>
  <rect x="${frontStartX + safePx}" y="${bleedPx + safePx}" 
        width="${frontWidthPx - safePx * 2}" height="${pixelHeight - bleedPx * 2 - safePx * 2}" 
        fill="none" stroke="#00cc00" stroke-width="2" stroke-dasharray="10,5"/>
  
  <!-- Trim Lines -->
  <rect x="${bleedPx}" y="${bleedPx}" 
        width="${pixelWidth - bleedPx * 2}" height="${pixelHeight - bleedPx * 2}" 
        fill="none" stroke="#ff0000" stroke-width="1"/>
  
  <!-- Labels -->
  <text x="${bleedPx + backWidthPx / 2}" y="${pixelHeight / 2}" 
        font-family="Arial" font-size="48" fill="#666" text-anchor="middle">BACK COVER</text>
  <text x="${spineStartX + spinePx / 2}" y="${pixelHeight / 2}" 
        font-family="Arial" font-size="24" fill="#666" text-anchor="middle" 
        transform="rotate(-90, ${spineStartX + spinePx / 2}, ${pixelHeight / 2})">SPINE</text>
  <text x="${frontStartX + frontWidthPx / 2}" y="${pixelHeight / 2}" 
        font-family="Arial" font-size="48" fill="#666" text-anchor="middle">FRONT COVER</text>
  
  ${config.includeBarcode ? `
  <!-- Barcode Area (2" x 1.2") -->
  <rect x="${bleedPx + safePx}" y="${pixelHeight - bleedPx - safePx - 1.2 * dpi}" 
        width="${2 * dpi}" height="${1.2 * dpi}" 
        fill="none" stroke="#0066cc" stroke-width="2"/>
  <text x="${bleedPx + safePx + dpi}" y="${pixelHeight - bleedPx - safePx - 0.6 * dpi}" 
        font-family="Arial" font-size="24" fill="#0066cc" text-anchor="middle">BARCODE AREA</text>
  ` : ''}
  
  <!-- Specs -->
  <text x="20" y="40" font-family="monospace" font-size="16" fill="#333">
    Trim: ${config.trimSize} | Pages: ${config.pageCount} | Spine: ${spineWidth.toFixed(4)}" | ${pixelWidth}x${pixelHeight}px @ 300 DPI
  </text>
</svg>`;
}
