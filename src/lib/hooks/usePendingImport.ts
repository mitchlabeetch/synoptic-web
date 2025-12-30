// src/lib/hooks/usePendingImport.ts
// PURPOSE: Manage pending library imports for auth flow
// ACTION: Store/retrieve/clear pending imports from localStorage
// MECHANISM: Persists import config across auth redirects

'use client';

import { useCallback, useEffect, useState } from 'react';
import { WizardConfig } from '@/services/library/types';

const STORAGE_KEY = 'synoptic_pending_import';
const EXPIRY_HOURS = 2; // Pending imports expire after 2 hours

export interface PendingImport {
  tileId: string;
  sourceId: string;
  config: WizardConfig;
  timestamp: number;
  returnUrl?: string;
}

interface UsePendingImportResult {
  pendingImport: PendingImport | null;
  hasPendingImport: boolean;
  setPendingImport: (data: Omit<PendingImport, 'timestamp'>) => void;
  clearPendingImport: () => void;
  isExpired: boolean;
}

export function usePendingImport(): UsePendingImportResult {
  const [pendingImport, setPendingImportState] = useState<PendingImport | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PendingImport;
        setPendingImportState(parsed);
      }
    } catch {
      // Ignore parse errors
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Check if expired
  const isExpired = pendingImport
    ? Date.now() - pendingImport.timestamp > EXPIRY_HOURS * 60 * 60 * 1000
    : false;

  // Auto-clear expired imports
  useEffect(() => {
    if (isExpired && pendingImport) {
      localStorage.removeItem(STORAGE_KEY);
      setPendingImportState(null);
    }
  }, [isExpired, pendingImport]);

  // Set a new pending import
  const setPendingImport = useCallback((data: Omit<PendingImport, 'timestamp'>) => {
    const newImport: PendingImport = {
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newImport));
    setPendingImportState(newImport);
  }, []);

  // Clear pending import
  const clearPendingImport = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPendingImportState(null);
  }, []);

  return {
    pendingImport: isExpired ? null : pendingImport,
    hasPendingImport: !isExpired && pendingImport !== null,
    setPendingImport,
    clearPendingImport,
    isExpired,
  };
}

// Utility to check on server-side (reading from cookie if needed)
export function getPendingImportUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored) as PendingImport;
    const isExpired = Date.now() - parsed.timestamp > EXPIRY_HOURS * 60 * 60 * 1000;
    
    if (isExpired) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    // Return the wizard URL with import params
    return `/dashboard/new?source=${parsed.sourceId}&tileId=${parsed.tileId}`;
  } catch {
    return null;
  }
}
