// src/components/settings/DeleteAccountDialog.tsx
// PURPOSE: GDPR-compliant account deletion dialog
// ACTION: Provides a secure confirmation flow for users to delete their accounts
// MECHANISM: Requires user to type confirmation phrase before deletion

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertTriangle, Loader2, Trash2, ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/Toast';

interface DeleteAccountDialogProps {
  userEmail?: string;
  className?: string;
}

const CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';

export function DeleteAccountDialog({ userEmail, className }: DeleteAccountDialogProps) {
  const t = useTranslations('Settings');
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isConfirmValid = confirmText === CONFIRMATION_PHRASE;
  
  const handleDelete = async () => {
    if (!isConfirmValid) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmPhrase: CONFIRMATION_PHRASE,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }
      
      // Show success message
      toast.success('Account deleted', {
        description: 'Your account and all data have been permanently removed.',
      });
      
      // Redirect to home page
      router.push('/');
      router.refresh();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error('Failed to delete account', { description: errorMessage });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleClose = () => {
    setIsOpen(false);
    setConfirmText('');
    setError(null);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => open ? setIsOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button 
          variant="destructive" 
          className={className}
          aria-label="Delete account"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {t('deleteAccount')}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            {t('deleteAccountTitle')}
          </DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm text-destructive-foreground/90">
                <p className="font-semibold">This action is permanent and irreversible.</p>
                <p className="mt-1 opacity-80">
                  All your projects, settings, and data will be permanently deleted.
                  This cannot be undone.
                </p>
              </div>
            </div>
            
            {userEmail && (
              <p className="text-sm">
                You are about to delete the account for: <strong>{userEmail}</strong>
              </p>
            )}
            
            <div className="space-y-2">
              <p className="text-sm font-medium">
                What will be deleted:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>All your bilingual book projects</li>
                <li>All saved glossary entries</li>
                <li>Your user profile and preferences</li>
                <li>All session data</li>
              </ul>
            </div>
            
            <div className="pt-2 space-y-2">
              <label htmlFor="confirm-delete" className="text-sm font-medium">
                Type <code className="px-1.5 py-0.5 bg-muted rounded text-destructive font-mono text-xs">DELETE MY ACCOUNT</code> to confirm:
              </label>
              <Input
                id="confirm-delete"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type the confirmation phrase..."
                className="font-mono"
                autoComplete="off"
                aria-describedby="confirm-hint"
              />
              <p id="confirm-hint" className="text-xs text-muted-foreground">
                Case-sensitive. Type exactly as shown above.
              </p>
            </div>
            
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmValid || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Permanently Delete Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteAccountDialog;
