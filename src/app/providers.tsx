"use client";

// src/app/providers.tsx
// PURPOSE: Provide global context providers with optimized rendering
// ACTION: Wraps the application with necessary providers
// MECHANISM: Uses memo-ized components to prevent unnecessary re-renders

import { ReactNode, memo } from "react";
import { ToastProvider } from "@/components/ui/Toast";

// Memoize the toast provider since it never needs to re-render based on props
const MemoizedToastProvider = memo(ToastProvider);
MemoizedToastProvider.displayName = 'MemoizedToastProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      {/* Global toast notification system - memoized to prevent re-renders */}
      <MemoizedToastProvider />
    </>
  );
}
