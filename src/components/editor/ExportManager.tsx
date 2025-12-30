import { useState, useEffect } from 'react';
import { useProjectStore } from '@/lib/store/projectStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileDown, 
  Printer, 
  Book, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Lock,
  Grid,
  Activity,
  FileSpreadsheet,
  Headphones,
  Volume2,
  Instagram,
  Image
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
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getVoicesForLang, VoiceOption } from '@/data/voices';
import { exportAsImage, SocialFormat } from '@/services/socialExport';
import { Switch } from '@/components/ui/switch';

export default function ExportManager() {
  const { meta, content, settings } = useProjectStore();
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<{ type: string; url: string } | null>(null);
  const [tier, setTier] = useState<string>('free');
  
  // Audio Engine State
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioChapter, setAudioChapter] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  
  // Social Share State
  const [socialFormat, setSocialFormat] = useState<SocialFormat>('square');
  const [socialBranding, setSocialBranding] = useState(true);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  
  // Dynamic logic to make the status "Real"
  const hasContent = content?.pages && content.pages.length > 0 && 
    content.pages.some(page => page.blocks && page.blocks.length > 0);
  
  const t = useTranslations('Export');
  const tCommon = useTranslations('Common');
  const tStudio = useTranslations('Studio');

  useEffect(() => {
    async function fetchTier() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) return;
        
        const data = await response.json();
        if (data.user?.tier) setTier(data.user.tier);
      } catch (err) {
        console.error('Failed to fetch user tier:', err);
      }
    }
    fetchTier();
  }, []);

  // Initialize default voice when target language is available
  useEffect(() => {
    if (meta?.target_lang && !selectedVoice) {
      const voices = getVoicesForLang(meta.target_lang);
      if (voices[0]) {
        setSelectedVoice(voices[0].id);
      }
    }
  }, [meta?.target_lang, selectedVoice]);

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

      if (!response.ok) throw new Error(t('pdfError'));

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
      alert(t('pdfErrorDesc'));
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

      if (!response.ok) throw new Error(t('epubError'));

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
      alert(t('epubErrorDesc'));
    } finally {
      setIsExporting(null);
    }
  };

  // ═══════════════════════════════════════════
  // AUDIOBOOK EXPORT HANDLER
  // ═══════════════════════════════════════════
  const handleAudiobookExport = async () => {
    if (!selectedVoice || isExporting) return;
    setIsExporting('audio');
    setAudioProgress(0);
    setAudioChapter(0);

    try {
      const zip = new JSZip();
      const folder = zip.folder(`Audiobook - ${meta?.title || 'Untitled'}`);
      
      // Build task list: concatenate text by chapter for natural audiobook flow
      const tasks: { filename: string; text: string; chapter: number }[] = [];
      let chapterNum = 0;
      let chapterTextBuffer = '';
      let lastPageIdx = -1;

      content?.pages.forEach((page, pIdx) => {
        // Check if this is a new chapter
        if (page.isChapterStart || pIdx === 0) {
          // Save previous chapter if it has content
          if (chapterTextBuffer.trim() && chapterNum > 0) {
            tasks.push({
              filename: `Chapter_${String(chapterNum).padStart(2, '0')}.mp3`,
              text: chapterTextBuffer.trim(),
              chapter: chapterNum
            });
          }
          chapterNum++;
          chapterTextBuffer = '';
        }
        
        // Collect text from blocks
        page.blocks.forEach((block) => {
          if (block.type === 'text') {
            const textBlock = block as { L2?: { content?: string } };
            if (textBlock.L2?.content) {
              // Strip HTML tags and add natural pauses
              const plainText = textBlock.L2.content
                .replace(/<[^>]*>/g, '')
                .trim();
              if (plainText) {
                chapterTextBuffer += plainText + '. ';
              }
            }
          }
        });
        
        lastPageIdx = pIdx;
      });

      // Don't forget the last chapter
      if (chapterTextBuffer.trim()) {
        tasks.push({
          filename: `Chapter_${String(chapterNum).padStart(2, '0')}.mp3`,
          text: chapterTextBuffer.trim(),
          chapter: chapterNum
        });
      }

      if (tasks.length === 0) {
        alert(t('noAudioContent'));
        setIsExporting(null);
        return;
      }

      // Process Queue with progress updates
      const total = tasks.length;
      for (let i = 0; i < total; i++) {
        const task = tasks[i];
        setAudioChapter(task.chapter);
        
        try {
          // Split long texts into chunks (Edge TTS limit ~10000 chars)
          const maxChunkSize = 8000;
          const textChunks: string[] = [];
          let remainingText = task.text;
          
          while (remainingText.length > 0) {
            if (remainingText.length <= maxChunkSize) {
              textChunks.push(remainingText);
              break;
            }
            // Find a natural break point (sentence end)
            let breakPoint = remainingText.lastIndexOf('. ', maxChunkSize);
            if (breakPoint === -1) breakPoint = maxChunkSize;
            textChunks.push(remainingText.substring(0, breakPoint + 1));
            remainingText = remainingText.substring(breakPoint + 1).trim();
          }

          // Generate audio for each chunk and combine
          const audioChunks: Blob[] = [];
          for (const chunk of textChunks) {
            const res = await fetch('/api/export/audio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                text: chunk, 
                voiceId: selectedVoice 
              })
            });

            if (res.ok) {
              const blob = await res.blob();
              audioChunks.push(blob);
            }
          }

          // Combine chunks into single file
          if (audioChunks.length > 0) {
            const combinedBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
            folder?.file(task.filename, combinedBlob);
          }
        } catch (e) {
          console.error(`Failed to generate ${task.filename}:`, e);
        }
        
        // Update Progress
        setAudioProgress(Math.round(((i + 1) / total) * 100));
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${meta?.title || 'Audiobook'}_Neural_Audio.zip`);
      
    } catch (error) {
      console.error('Audiobook export failed:', error);
      alert(t('audioExportError'));
    } finally {
      setIsExporting(null);
      setAudioProgress(0);
      setAudioChapter(0);
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
               {t('generate')} {tCommon('pdf')}
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
               {t('generate')} {tCommon('epub')}
             </Button>
          </div>
        </section>

        {/* AUDIOBOOK ENGINE SECTION */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-md bg-violet-500/10 flex items-center justify-center">
              <Headphones className="h-4 w-4 text-violet-600" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('audiobookEngine')}
            </h4>
          </div>
          
          <div className="p-4 rounded-xl border bg-gradient-to-br from-violet-50/50 to-transparent dark:from-violet-950/20 space-y-4">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t('audiobookDesc')}
            </p>
            
            {/* Voice Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide">
                {t('voicePersona')}
              </label>
              <Select 
                value={selectedVoice} 
                onValueChange={setSelectedVoice} 
                disabled={isExporting === 'audio'}
              >
                <SelectTrigger className="h-8 text-xs bg-white/50 dark:bg-background/50">
                  <SelectValue placeholder={t('selectVoice')} />
                </SelectTrigger>
                <SelectContent>
                  {getVoicesForLang(meta?.target_lang || 'en').map((v: VoiceOption) => (
                    <SelectItem key={v.id} value={v.id} className="text-xs">
                      <span className="flex items-center gap-2">
                        <Volume2 className="h-3 w-3 text-muted-foreground" />
                        {v.name} 
                        <span className="text-muted-foreground">({v.gender})</span>
                        {v.region && (
                          <span className="text-[9px] text-muted-foreground/70">• {v.region}</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Progress Indicator */}
            {isExporting === 'audio' && (
              <div className="space-y-2 pt-2">
                <Progress value={audioProgress} className="h-1.5" />
                <p className="text-[10px] text-violet-600 dark:text-violet-400 text-center font-medium animate-pulse">
                  {t('renderingChapter', { chapter: audioChapter })}
                </p>
              </div>
            )}

            {/* Export Button */}
            <Button 
              className="w-full gap-2 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 transition-all" 
              onClick={handleAudiobookExport}
              disabled={isExporting !== null || !selectedVoice}
            >
              {isExporting === 'audio' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Headphones className="h-3 w-3" />
              )}
              {t('exportAudioZip')}
            </Button>
            
            {/* Neural Engine Badge */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <div className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                {t('neuralEngine')}
              </span>
            </div>
          </div>
        </section>

        {/* SOCIAL SHARE SECTION */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-md bg-pink-500/10 flex items-center justify-center">
              <Instagram className="h-4 w-4 text-pink-600" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('socialShare')}
            </h4>
          </div>
          
          <div className="p-4 rounded-xl border bg-gradient-to-br from-pink-50/50 to-transparent dark:from-pink-950/20 space-y-4">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t('socialShareDesc')}
            </p>
            
            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide">
                {t('socialFormat')}
              </label>
              <Select 
                value={socialFormat} 
                onValueChange={(v) => setSocialFormat(v as SocialFormat)}
              >
                <SelectTrigger className="h-8 text-xs bg-white/50 dark:bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square" className="text-xs">
                    <span className="flex items-center gap-2">
                      <Grid className="h-3 w-3" />
                      {t('squareFormat')}
                    </span>
                  </SelectItem>
                  <SelectItem value="story" className="text-xs">
                    <span className="flex items-center gap-2">
                      <Image className="h-3 w-3" />
                      {t('storyFormat')}
                    </span>
                  </SelectItem>
                  <SelectItem value="twitter" className="text-xs">
                    <span className="flex items-center gap-2">
                      <Grid className="h-3 w-3" />
                      {t('twitterFormat')}
                    </span>
                  </SelectItem>
                  <SelectItem value="pinterest" className="text-xs">
                    <span className="flex items-center gap-2">
                      <Image className="h-3 w-3" />
                      {t('pinterestFormat')}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Branding Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-medium text-muted-foreground">
                {t('includeBranding')}
              </label>
              <Switch 
                checked={socialBranding} 
                onCheckedChange={setSocialBranding}
              />
            </div>

            {/* Export Button */}
            <Button 
              className="w-full gap-2 text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-500/20" 
              onClick={async () => {
                // Get first text block with content
                const allBlocks = content?.pages.flatMap(p => p.blocks) || [];
                const firstBlock = allBlocks.find(b => {
                  if (b.type !== 'text') return false;
                  const textBlock = b as { L2?: { content?: string } };
                  return !!textBlock.L2?.content;
                });
                  
                if (!firstBlock) {
                  alert(t('selectBlock'));
                  return;
                }
                
                const textBlock = firstBlock as { L1?: { content?: string }; L2?: { content?: string } };
                
                await exportAsImage({
                  source: textBlock.L1?.content || '',
                  target: textBlock.L2?.content || '',
                  sourceLang: meta?.source_lang?.toUpperCase() || 'EN',
                  targetLang: meta?.target_lang?.toUpperCase() || 'FR'
                }, {
                  format: socialFormat,
                  showBranding: socialBranding,
                  theme: 'light'
                });
              }}
              disabled={isExporting !== null}
            >
              <Instagram className="h-3 w-3" />
              {t('exportImage')}
            </Button>
            
            {/* Viral Badge */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                Instagram • Twitter • Pinterest
              </span>
            </div>
          </div>
        </section>

        {/* STUDY DECK SECTION */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
             <div className="h-6 w-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
               <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
             </div>
             <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
               {t('studyDeck')}
             </h4>
          </div>
          <div className="p-4 rounded-xl border bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 space-y-4">
             <p className="text-[11px] text-muted-foreground leading-relaxed">
               {t('deckDesc')}
             </p>
             <Button 
               variant="outline" 
               className="w-full gap-2 text-xs font-bold hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200" 
               onClick={() => {
                 // Extract flashcards from callout blocks and export as CSV
                 if (!content?.pages) {
                   alert(t('noCardsFound'));
                   return;
                 }
                 const cards: string[] = [];
                 content.pages.forEach(page => {
                   page.blocks.forEach((block: any) => {
                     if (block.type === 'callout') {
                       const front = block.L2?.content || block.content || '...';
                       const back = `${block.L1?.content || ''} <br/> <small>[${block.calloutType || 'note'}]</small>`;
                       const tag = `Synoptic::${block.calloutType || 'note'}`;
                       cards.push(`"${front.replace(/"/g, '""')}","${back.replace(/"/g, '""')}","${tag}"`);
                     }
                   });
                 });
                 if (cards.length === 0) {
                   alert(t('noCardsFound'));
                   return;
                 }
                 const csvContent = `#separator:Comma\n#html:true\n${cards.join('\n')}`;
                 const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                 const url = URL.createObjectURL(blob);
                 const a = document.createElement('a');
                 a.href = url;
                 a.download = `${meta?.title || 'deck'}_anki.csv`;
                 document.body.appendChild(a);
                 a.click();
                 window.URL.revokeObjectURL(url);
               }}
             >
               <FileSpreadsheet className="h-3 w-3" />
               {t('generate')} CSV / Anki
             </Button>
          </div>
        </section>

        {/* SYSTEM STATUS SECTION */}
        <section className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-primary" />
            {t('systemStatus')}
          </h4>
          
          <div className="space-y-2">
            {/* Grid-Lock Engine Status */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20">
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <Grid className="h-3 w-3 text-emerald-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    {t('gridLock')}
                  </span>
                  <span className="text-[9px] text-emerald-600/70 font-medium">
                    {hasContent ? t('engineActive') : t('waitingContent')}
                  </span>
                </div>
              </div>
              <Lock className="h-3 w-3 text-emerald-500/50" />
            </div>

            {/* Mirror Gutter Logic Status */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/20">
              <div className="flex items-center gap-2.5">
                 <div className="h-5 w-5 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Book className="h-3 w-3 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">
                    {t('mirrorGutter')}
                  </span>
                  <span className="text-[9px] text-blue-600/70 font-medium">
                    {settings?.pageSize || 'Standard'} {t('profileLoaded')}
                  </span>
                </div>
              </div>
              <CheckCircle2 className="h-3 w-3 text-blue-500/50" />
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
