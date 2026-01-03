// src/components/dashboard/EmailVerificationBanner.tsx
// PURPOSE: Show a banner prompting users to verify their email
// ACTION: Displays prominent warning with resend option
// MECHANISM: Client component that checks email_verified status

'use client';

import { useState } from 'react';
import { AlertTriangle, Mail, Loader2, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailVerificationBannerProps {
  email: string;
  emailVerified: boolean;
}

export function EmailVerificationBanner({ email, emailVerified }: EmailVerificationBannerProps) {
  const t = useTranslations('Auth');
  const [dismissed, setDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Don't show if verified or dismissed
  if (emailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);
    setResendStatus('idle');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend');
      }

      setResendStatus('success');
    } catch {
      setResendStatus('error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6 relative"
      >
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">
              {t('verifyEmail')}
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              {t('checkEmailDesc')}
            </p>
            
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                className="gap-2 border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-800/50"
                onClick={handleResend}
                disabled={isResending || resendStatus === 'success'}
              >
                {isResending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : resendStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {resendStatus === 'success' 
                  ? t('verificationEmailSent') 
                  : t('resendVerification')
                }
              </Button>
              
              <span className="text-xs text-amber-600 dark:text-amber-400">
                {email}
              </span>
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 text-amber-400 hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-300 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
