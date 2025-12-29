import { useState, useEffect } from 'react';
import { useProjectStore } from '@/lib/store/projectStore';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  FileDown, 
  Printer, 
  Book, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function ExportManager() {
  const { meta } = useProjectStore();
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<{ type: string; url: string } | null>(null);
  const [tier, setTier] = useState<string>('free');
  
  const t = useTranslations('Export');
  const tCommon = useTranslations('Common');
  const tStudio = useTranslations('Studio');

  useEffect(() => {
    async function fetchTier() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .single();
      
      if (profile?.tier) setTier(profile.tier);
    }
    fetchTier();
  }, []);

  const handleExportPdf = async () => {
    if (!meta?.id || isExporting) return;
    setIsExporting('pdf');
    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: meta.id,
          options: {
            includeBleed: true,
            colorMode: 'sRGB',
          },
        }),
      });

      if (!response.ok) throw new Error('PDF Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${meta.title || 'project'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setLastExport({ type: 'pdf', url });
    } catch (error) {
      console.error(error);
      alert('Export failed. Please check your connection to the print engine.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportEpub = async () => {
    if (!meta?.id || isExporting) return;
    setIsExporting('epub');
    try {
      const response = await fetch('/api/export/epub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: meta.id,
        }),
      });

      if (!response.ok) throw new Error('EPUB Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${meta.title || 'project'}.epub`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('EPUB generation failed.');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-card animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
          <Printer className="h-4 w-4 text-primary" />
          {t('publishingPipeline')}
        </h3>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {tier === 'free' && (
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:rotate-12 transition-transform">
               <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5" />
              {t('upgradeToPro')}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
              {t('watermarkPolicy')}
            </p>
            <Link href="/pricing" className="block">
              <Button size="sm" className="w-full h-8 text-[10px] font-bold rounded-xl gap-2">
                {t('viewPlans')} <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        )}

        {/* PDF SECTION */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-md bg-red-500/10 flex items-center justify-center">
              <FileDown className="h-4 w-4 text-red-600" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('pdfManuscript')}</h4>
          </div>
          
          <div className="p-4 rounded-xl border bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20 space-y-4">
             <div className="space-y-1">
               <p className="text-[11px] text-muted-foreground leading-relaxed">
                 {isExporting === 'pdf' ? t('generating') : t('pdfDesc')}
               </p>
               {tier === 'free' && (
                 <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                   <AlertTriangle className="h-3 w-3" /> {t('freeWarning')}
                 </p>
               )}
             </div>
             
             <div className="grid grid-cols-2 gap-2">
               <div className="space-y-1">
                 <span className="text-[9px] uppercase font-bold text-muted-foreground/60 px-1">{t('quality')}</span>
                 <Select defaultValue="300">
                    <SelectTrigger className="h-8 text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300">300 DPI ({t('qualityPrint')})</SelectItem>
                      <SelectItem value="150">150 DPI ({t('qualityWeb')})</SelectItem>
                      <SelectItem value="72">72 DPI ({t('qualityDraft')})</SelectItem>
                    </SelectContent>
                 </Select>
               </div>
               <div className="space-y-1">
                 <span className="text-[9px] uppercase font-bold text-muted-foreground/60 px-1">{t('bleed')}</span>
                 <Select defaultValue="on">
                    <SelectTrigger className="h-8 text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on">3.175mm ({tCommon('on')})</SelectItem>
                      <SelectItem value="off">{tCommon('off')}</SelectItem>
                    </SelectContent>
                 </Select>
               </div>
             </div>

             <Button 
               className="w-full gap-2 font-bold shadow-lg shadow-red-500/10" 
               onClick={handleExportPdf}
               disabled={isExporting !== null}
             >
               {isExporting === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
               {t('generate')} PDF
             </Button>
          </div>
        </section>

        {/* EPUB SECTION */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
             <div className="h-6 w-6 rounded-md bg-blue-500/10 flex items-center justify-center">
               <Book className="h-4 w-4 text-blue-600" />
             </div>
             <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('epubEbook')}</h4>
          </div>
          <div className="p-4 rounded-xl border bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 space-y-4">
             <p className="text-[11px] text-muted-foreground leading-relaxed">
               {isExporting === 'epub' ? t('generating') : t('epubDesc')}
             </p>
             <Button 
               variant="outline" 
               className="w-full gap-2 text-xs font-bold" 
               onClick={handleExportEpub}
               disabled={isExporting !== null}
             >
               {isExporting === 'epub' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Book className="h-3 w-3" />}
               {t('generate')} EPUB
             </Button>
          </div>
        </section>

        {/* PRE-FLIGHT CHECK */}
        <section className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            {t('preFlightTitle')}
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="text-[10px] font-medium">{t('symmetryCheck')}</span>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
            </div>
          </div>
        </section>
      </div>

      <div className="p-4 border-t bg-muted/5">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground italic leading-tight">
          <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
          <span>{t('largeDocWarning')}</span>
        </div>
      </div>
    </div>
  );
}
