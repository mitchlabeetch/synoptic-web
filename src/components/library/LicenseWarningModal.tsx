// src/components/library/LicenseWarningModal.tsx
// PURPOSE: Warning modal for restricted content (🔴 Red Light)
// ACTION: Requires user acknowledgment before importing personal-only content
// MECHANISM: Displays license restrictions and gets user consent

'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldX, AlertTriangle, Info } from 'lucide-react';
import { LicenseInfo, LibraryTile } from '@/services/library/types';
import { cn } from '@/lib/utils';

interface LicenseWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tile: LibraryTile | null;
}

export function LicenseWarningModal({
  isOpen,
  onClose,
  onConfirm,
  tile,
}: LicenseWarningModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!tile) return null;

  const handleConfirm = () => {
    if (acknowledged) {
      setAcknowledged(false); // Reset for next time
      onConfirm();
    }
  };

  const handleCancel = () => {
    setAcknowledged(false);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleCancel}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <ShieldX className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg">
                Restricted Content License
              </AlertDialogTitle>
              <p className="text-sm text-muted-foreground">{tile.title}</p>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogDescription asChild>
          <div className="space-y-4">
            {/* Warning Box */}
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-800 dark:text-red-200 text-sm mb-1">
                    Personal Use Only
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {tile.license.warningText || 
                      'This content source is restricted to personal study and educational use only. You cannot sell, publish, or commercially distribute books or materials created with this content.'}
                  </p>
                </div>
              </div>
            </div>

            {/* License Details */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Why is this restricted?
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                {tile.sourceName.toLowerCase().includes('pokemon') && (
                  <>
                    <li>• Pokémon is a registered trademark of Nintendo.</li>
                    <li>• Commercial use requires explicit licensing from The Pokémon Company.</li>
                    <li>• Fan translations are tolerated for personal use only.</li>
                  </>
                )}
                {tile.sourceName.toLowerCase().includes('xkcd') && (
                  <>
                    <li>• xkcd comics are licensed under Creative Commons BY-NC.</li>
                    <li>• The NC (Non-Commercial) clause prohibits selling.</li>
                    <li>• You may study and share for free, but not monetize.</li>
                  </>
                )}
                {!tile.sourceName.toLowerCase().includes('pokemon') && 
                 !tile.sourceName.toLowerCase().includes('xkcd') && (
                  <li>• This source has copyright or trademark restrictions that prevent commercial use.</li>
                )}
              </ul>
            </div>

            {/* What you CAN do */}
            <div className="rounded-lg p-3 border border-dashed">
              <p className="text-sm font-medium mb-2">You CAN use this for:</p>
              <ul className="text-sm text-muted-foreground grid grid-cols-2 gap-1">
                <li>✅ Personal study</li>
                <li>✅ Language practice</li>
                <li>✅ Teaching materials</li>
                <li>✅ Academic research</li>
              </ul>
            </div>

            {/* What you CANNOT do */}
            <div className="rounded-lg p-3 border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
              <p className="text-sm font-medium mb-2 text-red-800 dark:text-red-200">
                You CANNOT:
              </p>
              <ul className="text-sm text-red-700 dark:text-red-300 grid grid-cols-2 gap-1">
                <li>❌ Sell translations</li>
                <li>❌ Publish as ebook</li>
                <li>❌ Commercial distribution</li>
                <li>❌ Monetize on social</li>
              </ul>
            </div>

            {/* Acknowledgment Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="acknowledge"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked === true)}
              />
              <label 
                htmlFor="acknowledge" 
                className="text-sm cursor-pointer select-none"
              >
                I understand this content is for <strong>personal study only</strong> and
                I will not commercially publish or sell any work created from it.
              </label>
            </div>
          </div>
        </AlertDialogDescription>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel onClick={handleCancel}>
            Choose Another Source
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!acknowledged}
            className={cn(
              'bg-red-600 hover:bg-red-700',
              !acknowledged && 'opacity-50 cursor-not-allowed'
            )}
          >
            I Understand, Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
