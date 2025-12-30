"use client";

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, BookOpen, ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function SignupPage() {
  const t = useTranslations('Auth');
  const tc = useTranslations('Common');
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('failed'))
      }

      // Redirect to dashboard on success
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || t('errorOccurred'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Back button */}
      <div className="absolute top-6 left-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {tc('backToHome')}
          </Button>
        </Link>
      </div>

      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 flex items-center justify-center">
          <img src="/logo-icon.svg" alt="Synoptic" className="h-12 w-12" />
        </div>
        <span className="text-3xl font-black tracking-tighter uppercase italic">Synoptic</span>
      </div>

      <Card className="w-full max-w-md shadow-xl border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {mode === 'login' ? t('welcomeBack') : t('createAccount')}
          </CardTitle>
          <CardDescription>
            {mode === 'login' 
              ? t('signInDesc') 
              : t('signUpDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={mode === 'signup' ? t('passwordPlaceholderSignup') : t('passwordPlaceholderLogin')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>
            
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm text-center">
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'login' ? t('signingIn') : t('creatingAccount')}
                </>
              ) : (
                mode === 'login' ? t('signIn') : t('createAccount')
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {mode === 'login' ? (
              <>
                {t('noAccount')}{' '}
                <button 
                  onClick={() => { setMode('signup'); setError(''); }}
                  className="text-primary hover:underline font-medium"
                >
                  {t('signup')}
                </button>
              </>
            ) : (
              <>
                {t('hasAccount')}{' '}
                <button 
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-primary hover:underline font-medium"
                >
                  {t('signIn')}
                </button>
              </>
            )}
          </p>
        </CardFooter>
      </Card>

      <p className="mt-8 text-xs text-muted-foreground text-center max-w-md">
        {t('termsPrompt')}
      </p>
    </div>
  )
}
