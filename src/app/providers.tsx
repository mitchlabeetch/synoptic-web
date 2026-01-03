"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      {/* Global toast notification system */}
      <ToastProvider />
    </>
  );
}
