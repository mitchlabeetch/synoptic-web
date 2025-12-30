"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Mail, Lock, Eye, EyeOff, Shield, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const t = useTranslations('Auth');
  const tc = useTranslations('Common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('failed'));
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('errorOccurred');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      // Redirect to Google OAuth endpoint
      window.location.href = '/api/auth/google';
    } catch {
      setError(t('errorOccurred'));
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#22687a] via-[#2a7d8f] to-[#30b8c8] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo-icon.svg" alt="Synoptic" className="h-12 w-12 group-hover:rotate-6 transition-transform" />
            <span className="text-2xl font-bold tracking-tighter font-quicksand lowercase">synoptic</span>
          </Link>
          
          {/* Welcome Message */}
          <div className="space-y-8 max-w-md">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl font-black font-outfit leading-tight mb-4">
                Welcome back to your studio
              </h1>
              <p className="text-white/80 text-lg font-medium">
                Pick up where you left off. Your projects are waiting.
              </p>
            </motion.div>
            
            {/* Quick Stats Mock */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-5 w-5 text-amber-300" />
                <span className="font-semibold">Recent Activity</span>
              </div>
              <div className="space-y-3 text-sm text-white/80">
                <div className="flex justify-between">
                  <span>Last session</span>
                  <span className="font-medium text-white">Saved securely</span>
                </div>
                <div className="flex justify-between">
                  <span>Cloud sync</span>
                  <span className="font-medium text-emerald-300">Active</span>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Security Badge */}
          <div className="flex items-center gap-3 text-white/60 text-sm">
            <Shield className="h-4 w-4" />
            <span>Secure session • Auto-logout after inactivity</span>
          </div>
        </div>
      </div>
      
      {/* Right Panel: Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12 bg-background relative overflow-hidden">
        {/* Beautiful gradient background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-30%] right-[-20%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(48,184,200,0.12),transparent_60%)] blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(249,114,110,0.08),transparent_60%)] blur-3xl" />
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(147,112,219,0.06),transparent_70%)] blur-3xl" />
        </div>
        
        {/* Mobile: Back Button */}
        <div className="absolute top-6 left-6 lg:hidden z-10">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {tc('backToHome')}
            </Button>
          </Link>
        </div>
        
        {/* Mobile: Logo */}
        <div className="lg:hidden mb-8 flex items-center gap-3 z-10">
          <img src="/logo-icon.svg" alt="Synoptic" className="h-10 w-10" />
          <span className="text-2xl font-bold tracking-tighter text-[#30b8c8] font-quicksand lowercase">synoptic</span>
        </div>
        
        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight font-outfit">{t('welcomeBack')}</h2>
            <p className="text-muted-foreground mt-2">{t('signInDesc')}</p>
          </div>
          
          {/* Google OAuth Button */}
          <Button 
            type="button"
            variant="outline" 
            className="w-full h-12 gap-3 font-semibold border-2 hover:bg-muted/50 transition-all"
            onClick={handleGoogleAuth}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </Button>
          
          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground font-medium">or continue with email</span>
            </div>
          </div>
          
          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">{t('email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="pl-10 h-12"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold">{t('password')}</Label>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-xs text-muted-foreground hover:text-[#30b8c8] transition-colors"
                >
                  {t('forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('passwordPlaceholderLogin')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pl-10 pr-10 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-destructive" />
                {error}
              </motion.div>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-12 font-bold text-base bg-[#22687a] hover:bg-[#1a5160] transition-all shadow-lg" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('signingIn')}
                </>
              ) : (
                t('signIn')
              )}
            </Button>
          </form>
          
          {/* Signup Link */}
          <p className="text-center text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <Link href="/auth/signup" className="text-[#30b8c8] hover:underline font-semibold">
              {t('signup')}
            </Link>
          </p>
          
          {/* Terms */}
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            {t('termsPrompt')}
          </p>
        </div>
      </div>
    </div>
  );
}
