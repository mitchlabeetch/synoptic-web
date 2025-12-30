// src/components/library/PreviewModal.tsx
// PURPOSE: Tile details modal with preview and import wizard
// ACTION: Shows full tile info, preview content, and launches import
// MECHANISM: Dialog with multi-step wizard state

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowRight, 
  Loader2, 
  ExternalLink, 
  Book,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { 
  LibraryTile, 
  IngestedContent, 
  WizardConfig,
  WizardStep 
} from '@/services/library/types';
import { LicenseBadge } from './LicenseBadge';
import { LicenseWarningModal } from './LicenseWarningModal';
import { SourceWizard } from './SourceWizard';
import { cn } from '@/lib/utils';
import { getAdapter } from '@/services/library/adapters';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tile: LibraryTile | null;
  onImport: (tile: LibraryTile, content: IngestedContent) => void;
}

export function PreviewModal({ 
  isOpen, 
  onClose, 
  tile,
  onImport,
}: PreviewModalProps) {
  const [step, setStep] = useState<WizardStep>('preview');
  const [wizardConfig, setWizardConfig] = useState<WizardConfig>({});
  const [previewContent, setPreviewContent] = useState<Partial<IngestedContent> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLicenseWarning, setShowLicenseWarning] = useState(false);

  // Reset state when tile changes
  useEffect(() => {
    if (tile) {
      setStep('preview');
      setWizardConfig({});
      setPreviewContent(null);
      setError(null);
    }
  }, [tile?.id]);

  // Handle starting the wizard
  const handleStart = useCallback(() => {
    if (!tile) return;

    // Check if we need to show license warning for personal-only
    if (tile.license.type === 'personal-only') {
      setShowLicenseWarning(true);
    } else {
      setStep('configure');
    }
  }, [tile]);

  // Handle license warning confirmation
  const handleLicenseConfirm = useCallback(() => {
    setShowLicenseWarning(false);
    setStep('configure');
  }, []);

  // Fetch preview when in preview step
  const fetchPreview = useCallback(async () => {
    if (!tile) return;

    const adapter = getAdapter(tile.sourceId);
    if (!adapter?.preview) return;

    setLoading(true);
    setError(null);

    try {
      const preview = await adapter.preview(wizardConfig);
      setPreviewContent(preview);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [tile, wizardConfig]);

  // Handle full import
  const handleImport = useCallback(async () => {
    if (!tile) return;

    const adapter = getAdapter(tile.sourceId);
    if (!adapter) {
      setError('Adapter not available');
      return;
    }

    setStep('loading');
    setError(null);

    try {
      const content = await adapter.fetch(wizardConfig);
      setStep('confirm');
      
      // Pass to parent
      onImport(tile, content);
    } catch (e) {
      setError((e as Error).message);
      setStep('configure');
    }
  }, [tile, wizardConfig, onImport]);

  if (!tile) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-start gap-4">
              {/* Tile Badge */}
              <div className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center text-2xl',
                tile.tileColor
              )}>
                📚
              </div>
              <div className="flex-grow">
                <DialogTitle className="text-xl">{tile.title}</DialogTitle>
                <DialogDescription className="mt-1">
                  {tile.subtitle}
                </DialogDescription>
              </div>
              <LicenseBadge license={tile.license} showLabel />
            </div>
          </DialogHeader>

          {/* Content based on step */}
          <div className="flex-grow overflow-y-auto py-4">
            {step === 'preview' && (
              <div className="space-y-6">
                {/* Description */}
                {tile.description && (
                  <p className="text-muted-foreground">{tile.description}</p>
                )}

                {/* Features */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Book className="w-4 h-4" />
                      Layout
                    </h4>
                    <p className="text-sm text-muted-foreground capitalize">
                      {tile.layout.replace('-', ' ')}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Utilities
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {tile.enabledUtilities.join(', ') || 'None'}
                    </p>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    What you can do
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {tile.capabilities.supportsSearch && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Search content
                      </div>
                    )}
                    {tile.capabilities.supportsReference && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Pick by reference
                      </div>
                    )}
                    {tile.capabilities.supportsRandom && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Random selection
                      </div>
                    )}
                    {tile.capabilities.hasVisuals && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Images included
                      </div>
                    )}
                    {tile.capabilities.hasAudio && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Audio included
                      </div>
                    )}
                  </div>
                </div>

                {/* Source info */}
                {tile.sourceUrl && (
                  <a
                    href={tile.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Source: {tile.sourceName}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {step === 'configure' && (
              <SourceWizard
                tile={tile}
                config={wizardConfig}
                onConfigChange={setWizardConfig}
                onPreview={fetchPreview}
                previewContent={previewContent}
                previewLoading={loading}
              />
            )}

            {step === 'loading' && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Fetching content...</p>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            
            <div className="flex gap-2">
              {step === 'preview' && (
                <Button onClick={handleStart} className="gap-2">
                  Start
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              
              {step === 'configure' && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('preview')}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleImport} 
                    className="gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Import Content
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* License Warning Modal for Red Light sources */}
      <LicenseWarningModal
        isOpen={showLicenseWarning}
        onClose={() => setShowLicenseWarning(false)}
        onConfirm={handleLicenseConfirm}
        tile={tile}
      />
    </>
  );
}
