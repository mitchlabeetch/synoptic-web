"use client";

import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  // Add providers here (e.g., QueryClientProvider, AuthProvider, etc.)
  return <>{children}</>;
}
