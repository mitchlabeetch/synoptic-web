// src/components/dashboard/ProjectWizard.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '@/data/languages';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  Sparkles,
  Plus,
} from 'lucide-react';

type WizardStep = 'metadata' | 'languages' | 'format' | 'template';

interface WizardData {
  title: string;
  author: string;
  description: string;
  sourceLang: string;
  targetLang: string;
  pageSize: string;
  customWidth?: number;
  customHeight?: number;
  template: string;
}

const PAGE_SIZES = [
  {
    id: '6x9',
    label: '6" × 9"',
    description: 'US Trade Paper',
    width: 152,
    height: 229,
  },
  {
    id: '5.5x8.5',
    label: '5.5" × 8.5"',
    description: 'Digest',
    width: 140,
    height: 216,
  },
  {
    id: 'A4',
    label: 'A4',
    description: 'International Standard',
    width: 210,
    height: 297,
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Define your own',
    width: 0,
    height: 0,
  },
];

const TEMPLATES = [
  {
    id: 'blank',
    label: 'Start Blank',
    description: 'Zero content, clean slate',
    icon: FileText,
  },
  {
    id: 'classic',
    label: 'Classic Side-by-Side',
    description: 'Balanced columns, serif fonts',
    icon: BookOpen,
  },
  {
    id: 'poetry',
    label: 'Poetry / Verses',
    description: 'Numbered lines, centered focus',
    icon: Sparkles,
  },
];

export default function ProjectWizard() {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>('metadata');
  const [isCreating, setIsCreating] = useState(false);

  const [data, setData] = useState<WizardData>({
    title: '',
    author: '',
    description: '',
    sourceLang: 'fr',
    targetLang: 'en',
    pageSize: '6x9',
    template: 'blank',
  });

  const steps: WizardStep[] = ['metadata', 'languages', 'format', 'template'];
  const currentStepIndex = steps.indexOf(step);

  const canProceed = () => {
    switch (step) {
      case 'metadata':
        return data.title.trim().length > 0;
      case 'languages':
        return data.sourceLang !== data.targetLang;
      case 'format':
        return data.pageSize !== 'custom' || (data.customWidth && data.customHeight);
      case 'template':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1]);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const pageSize = PAGE_SIZES.find((p) => p.id === data.pageSize);

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: data.title,
          author: data.author,
          description: data.description,
          source_lang: data.sourceLang,
          target_lang: data.targetLang,
          page_size: data.pageSize,
          page_width_mm: data.customWidth || pageSize?.width,
          page_height_mm: data.customHeight || pageSize?.height,
          settings: {
            template: data.template,
            fonts: {
              heading: getLanguageByCode(data.sourceLang)?.suggestedFonts[0] || 'Crimson Pro',
              body: getLanguageByCode(data.sourceLang)?.suggestedFonts[0] || 'Crimson Pro',
              annotation: 'Inter',
            },
            layout: data.template === 'interlinear' ? 'interlinear' : 'side-by-side',
          },
          content: {
            pages: [
              {
                id: `page-${Date.now()}`,
                number: 1,
                blocks: [],
                isBlankPage: false,
                isChapterStart: true,
              },
            ],
            wordGroups: [],
            arrows: [],
            stamps: [],
          },
        })
        .select()
        .single();

      if (error) throw error;

      setOpen(false);
      router.push(`/editor/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="shadow-lg hover:shadow-xl transition-all gap-2">
          <Plus className="h-5 w-5" />
          Create New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Masterpiece</DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8 mt-2 px-12">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                  i <= currentStepIndex
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'w-16 h-1 mx-2 rounded-full transition-all',
                    i < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[350px] py-4">
          {step === 'metadata' && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-base">Project Title *</Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => setData({ ...data, title: e.target.value })}
                  placeholder="e.g. Twenty Thousand Leagues Under the Sea"
                  className="mt-2 h-12 text-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={data.author}
                    onChange={(e) => setData({ ...data, author: e.target.value })}
                    placeholder="Your name or Original Author"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Category / Tag</Label>
                  <Input
                    id="description"
                    value={data.description}
                    onChange={(e) => setData({ ...data, description: e.target.value })}
                    placeholder="e.g. Fiction, Education"
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 'languages' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <Label className="text-base">Source Language (L1)</Label>
                  <Select
                    value={data.sourceLang}
                    onValueChange={(v) => setData({ ...data, sourceLang: v })}
                  >
                    <SelectTrigger className="mt-2 h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <span className="flex items-center gap-2">
                            <span className="font-semibold">{lang.label}</span>
                            <span className="text-muted-foreground text-xs italic">
                              ({lang.labelEn})
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-base">Target Language (L2)</Label>
                  <Select
                    value={data.targetLang}
                    onValueChange={(v) => setData({ ...data, targetLang: v })}
                  >
                    <SelectTrigger className="mt-2 h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <span className="flex items-center gap-2">
                            <span className="font-semibold">{lang.label}</span>
                            <span className="text-muted-foreground text-xs italic">
                              ({lang.labelEn})
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {data.sourceLang === data.targetLang && (
                <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded flex items-center gap-3">
                  <span className="text-destructive font-medium">Warning:</span>
                  <p className="text-sm text-destructive-foreground">
                    Source and target languages must be different for a bilingual project.
                  </p>
                </div>
              )}
              
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-sm text-muted-foreground italic">
                  Tip: Most users choose their native language as the target and the language they are learning as the source.
                </p>
              </div>
            </div>
          )}

          {step === 'format' && (
            <div className="space-y-6">
              <Label className="text-base">Physical Dimensons (mm)</Label>
              <RadioGroup
                value={data.pageSize}
                onValueChange={(v: string) => setData({ ...data, pageSize: v })}
                className="grid grid-cols-2 gap-4"
              >
                {PAGE_SIZES.map((size) => (
                  <div key={size.id}>
                    <RadioGroupItem
                      value={size.id}
                      id={size.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={size.id}
                      className={cn(
                        'flex flex-col items-start p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md h-full',
                        'hover:bg-accent hover:text-accent-foreground',
                        'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:shadow-inner'
                      )}
                    >
                      <span className="font-bold">{size.label}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {size.description}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {data.pageSize === 'custom' && (
                <div className="grid grid-cols-2 gap-6 p-6 bg-muted/30 rounded-2xl border border-dashed border-muted-foreground/20 mt-4">
                  <div>
                    <Label htmlFor="customWidth">Width (mm)</Label>
                    <Input
                      id="customWidth"
                      type="number"
                      value={data.customWidth || ''}
                      onChange={(e) => setData({ ...data, customWidth: parseInt(e.target.value) || undefined })}
                      placeholder="140"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customHeight">Height (mm)</Label>
                    <Input
                      id="customHeight"
                      type="number"
                      value={data.customHeight || ''}
                      onChange={(e) => setData({ ...data, customHeight: parseInt(e.target.value) || undefined })}
                      placeholder="216"
                      className="mt-2"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'template' && (
            <div className="space-y-4">
              <Label className="text-base">Layout Style</Label>
              <RadioGroup
                value={data.template}
                onValueChange={(v: string) => setData({ ...data, template: v })}
                className="space-y-3"
              >
                {TEMPLATES.map((template) => (
                  <div key={template.id}>
                    <RadioGroupItem
                      value={template.id}
                      id={template.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={template.id}
                      className={cn(
                        'flex items-center gap-5 p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md',
                        'hover:bg-accent hover:text-accent-foreground',
                        'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5'
                      )}
                    >
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <template.icon className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-lg">{template.label}</span>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex gap-3">
            {currentStepIndex < steps.length - 1 ? (
              <Button 
                onClick={handleNext} 
                disabled={!canProceed()}
                className="w-32 font-bold"
              >
                Next Step
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={isCreating || !canProceed()}
                className="w-48 font-bold animate-pulse hover:animate-none"
              >
                {isCreating ? 'Forging Studio...' : 'Launch Studio'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
