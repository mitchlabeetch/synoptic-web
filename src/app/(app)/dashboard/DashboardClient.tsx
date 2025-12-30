// src/app/(app)/dashboard/DashboardClient.tsx
// PURPOSE: Client-side dashboard components
// ACTION: Handles library imports from URL params
// MECHANISM: Wraps LibraryImportHandler for client-side rendering

'use client';

import { Suspense } from 'react';
import { LibraryImportHandler } from '@/components/dashboard/LibraryImportHandler';
import { SavedTemplates } from '@/components/dashboard/SavedTemplates';

export function DashboardClient() {
  return (
    <Suspense fallback={null}>
      <LibraryImportHandler />
    </Suspense>
  );
}

export function SavedTemplatesWrapper() {
  return <SavedTemplates />;
}
