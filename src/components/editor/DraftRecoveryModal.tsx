// src/components/editor/DraftRecoveryModal.tsx
// PURPOSE: Prompt user to recover unsaved work from offline storage
// ACTION: Shows when local draft is newer than server data
// MECHANISM: Presents options to recover or discard local changes

'use client';

import { useState } from 'react';
import { useDraftRecoveryPrompt } from '@/lib/hooks/useOfflineDraft';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Cloud, HardDrive, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

interface DraftRecoveryModalProps {
  projectId: string | null;
}

/**
 * Format a timestamp relative to now (e.g., "5 minutes ago")
 */
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
  if (diffHours > 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  if (diffMinutes > 0) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }
  return 'just now';
}

export function DraftRecoveryModal({ projectId }: DraftRecoveryModalProps) {
  const {
    showPrompt,
    draftTimestamp,
    handleRecover,
    handleDiscard,
  } = useDraftRecoveryPrompt(projectId);
  
  const [isRecovering, setIsRecovering] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  
  const formattedTime = draftTimestamp ? formatTimeAgo(draftTimestamp) : '';
  
  const onRecover = async () => {
    setIsRecovering(true);
    try {
      await handleRecover();
    } finally {
      setIsRecovering(false);
    }
  };
  
  const onDiscard = async () => {
    setIsDiscarding(true);
    try {
      await handleDiscard();
    } finally {
      setIsDiscarding(false);
    }
  };
  
  if (!showPrompt) return null;
  
  return (
    <Dialog open={showPrompt} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[450px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            Unsaved Changes Found
          </DialogTitle>
          <DialogDescription className="text-left pt-2 space-y-3">
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  We found a local backup of your work!
                </p>
                <p className="mt-1 text-amber-700 dark:text-amber-400/80">
                  It looks like you have unsaved changes from a previous session.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last saved locally: <strong>{formattedTime}</strong></span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg border bg-background">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                  <HardDrive className="h-3 w-3" />
                  LOCAL BACKUP
                </div>
                <p className="text-sm">Your unsaved work from {formattedTime}</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                  <Cloud className="h-3 w-3" />
                  CLOUD VERSION
                </div>
                <p className="text-sm">Last synced version from server</p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onDiscard}
            disabled={isRecovering || isDiscarding}
            className="w-full sm:w-auto"
          >
            {isDiscarding ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Cloud className="h-4 w-4 mr-2" />
            )}
            Use Cloud Version
          </Button>
          <Button
            onClick={onRecover}
            disabled={isRecovering || isDiscarding}
            className="w-full sm:w-auto"
          >
            {isRecovering ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <HardDrive className="h-4 w-4 mr-2" />
            )}
            Recover Local Backup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DraftRecoveryModal;
