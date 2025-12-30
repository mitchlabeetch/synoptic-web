// src/components/auth/AuthCallback.tsx
// PURPOSE: Handle post-auth redirects and pending imports
// ACTION: Checks for pending library imports after login and redirects
// MECHANISM: Reads from localStorage, redirects to wizard if pending

'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPendingImportUrl } from '@/lib/hooks/usePendingImport';

interface AuthCallbackProps {
  defaultRedirect?: string;
}

export function AuthCallback({ defaultRedirect = '/dashboard' }: AuthCallbackProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check URL params first (they take priority)
    const returnTo = searchParams.get('returnTo');
    const source = searchParams.get('source');
    const tileId = searchParams.get('tileId');

    // If URL has source params, go directly to wizard
    if (source && tileId) {
      router.replace(`/dashboard/new?source=${source}&tileId=${tileId}`);
      return;
    }

    // If returnTo specified, go there
    if (returnTo) {
      router.replace(returnTo);
      return;
    }

    // Check for pending import in localStorage
    const pendingUrl = getPendingImportUrl();
    if (pendingUrl) {
      router.replace(pendingUrl);
      return;
    }

    // Default redirect
    router.replace(defaultRedirect);
  }, [router, searchParams, defaultRedirect]);

  return null;
}

// Hook version for use in auth pages
export function useAuthRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSuccessfulAuth = () => {
    // Check URL params first
    const returnTo = searchParams.get('returnTo');
    const source = searchParams.get('source');
    const tileId = searchParams.get('tileId');

    if (source && tileId) {
      router.replace(`/dashboard/new?source=${source}&tileId=${tileId}`);
      return;
    }

    if (returnTo) {
      router.replace(returnTo);
      return;
    }

    // Check localStorage
    const pendingUrl = getPendingImportUrl();
    if (pendingUrl) {
      // Clear the pending import after use
      localStorage.removeItem('synoptic_pending_import');
      router.replace(pendingUrl);
      return;
    }

    router.replace('/dashboard');
  };

  return { handleSuccessfulAuth };
}
