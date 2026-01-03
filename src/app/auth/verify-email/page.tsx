"use client";

// src/app/auth/verify-email/page.tsx
// PURPOSE: Email verification status page
// ACTION: Shows verification success, error states, and resend functionality
// MECHANISM: Reads URL params for status, provides clear UI feedback

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Mail, 
  ArrowLeft,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

export default function VerifyEmailPage() {
  const t = useTranslations('Auth');
  const tc = useTranslations('Common');
  const searchParams = useSearchParams();
  
  const success = searchParams.get('success') === 'true';
  const error = searchParams.get('error');
  
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isResending || cooldown > 0) return;

    setIsResending(true);
    setResendStatus('idle');
    setResendMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('errorOccurred'));
      }

      if (data.alreadyVerified) {
        setResendStatus('success');
        setResendMessage(t('emailAlreadyVerified'));
      } else {
        setResendStatus('success');
        setResendMessage(data.message || t('verificationEmailSent'));
        setCooldown(60); // 60 second cooldown
      }
    } catch (err: unknown) {
      setResendStatus('error');
      setResendMessage(err instanceof Error ? err.message : t('errorOccurred'));
    } finally {
      setIsResending(false);
    }
  };

  // Error messages mapping
  const getErrorMessage = (errorCode: string | null): string => {
    switch (errorCode) {
      case 'missing_token':
        return t('verifyMissingToken');
      case 'invalid_or_expired':
        return t('verifyTokenExpired');
      case 'server_error':
        return t('verifyServerError');
      default:
        return t('verifyUnknownError');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/30">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(48,184,200,0.1),transparent_60%)] blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(249,114,110,0.06),transparent_60%)] blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card rounded-2xl shadow-xl border p-8 relative z-10"
      >
        {/* Back button */}
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          {t('backToLogin')}
        </Link>

        {/* SUCCESS STATE */}
        {success && (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-outfit mb-2">{t('emailVerified')}</h1>
              <p className="text-muted-foreground">{t('emailVerifiedDesc')}</p>
            </div>
            <Link href="/auth/login">
              <Button className="w-full h-12 font-bold">
                {t('signIn')}
              </Button>
            </Link>
          </div>
        )}

        {/* ERROR STATE */}
        {error && !success && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold font-outfit mb-2">{t('verificationFailed')}</h1>
              <p className="text-muted-foreground">{getErrorMessage(error)}</p>
            </div>

            {/* Token expired - show resend form */}
            {error === 'invalid_or_expired' && (
              <div className="pt-4 border-t">
                <p className="text-sm text-center text-muted-foreground mb-4">
                  {t('resendVerificationPrompt')}
                </p>
                <form onSubmit={handleResend} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-11"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 gap-2"
                    disabled={isResending || cooldown > 0}
                  >
                    {isResending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : cooldown > 0 ? (
                      <>
                        <Clock className="h-4 w-4" />
                        {t('resendIn', { seconds: cooldown })}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        {t('resendVerification')}
                      </>
                    )}
                  </Button>
                </form>

                {/* Resend status messages */}
                {resendStatus === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {resendMessage}
                  </motion.div>
                )}

                {resendStatus === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {resendMessage}
                  </motion.div>
                )}
              </div>
            )}

            <div className="text-center">
              <Link href="/auth/login" className="text-sm text-[#30b8c8] hover:underline">
                {t('backToLogin')}
              </Link>
            </div>
          </div>
        )}

        {/* DEFAULT STATE - Waiting for verification */}
        {!success && !error && (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-outfit mb-2">{t('checkYourEmail')}</h1>
              <p className="text-muted-foreground">{t('checkEmailDesc')}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                {t('verificationLinkExpires')}
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-4">{t('didntReceiveEmail')}</p>
              <form onSubmit={handleResend} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11"
                  />
                </div>
                <Button 
                  type="submit" 
                  variant="outline"
                  className="w-full h-11 gap-2"
                  disabled={isResending || cooldown > 0}
                >
                  {isResending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : cooldown > 0 ? (
                    <>
                      <Clock className="h-4 w-4" />
                      {t('resendIn', { seconds: cooldown })}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      {t('resendVerification')}
                    </>
                  )}
                </Button>
              </form>

              {resendStatus === 'success' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm"
                >
                  {resendMessage}
                </motion.div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
