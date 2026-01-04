// src/components/providers/MotionProvider.tsx
// PURPOSE: Lazily load framer-motion features to reduce bundle size
// ACTION: Wraps children with LazyMotion provider using domAnimation features
// MECHANISM: Code-splits framer-motion so only essential features are loaded on demand

'use client';

import { LazyMotion, domAnimation } from 'framer-motion';
import { ReactNode } from 'react';

interface MotionProviderProps {
  children: ReactNode;
}

/**
 * MotionProvider wraps the app with LazyMotion to enable tree-shaking.
 * 
 * Instead of importing all of framer-motion (~343KB), this loads only
 * the domAnimation features (~150KB) and code-splits animations.
 * 
 * Usage:
 * - Wrap pages/layouts that need animations with this provider
 * - Use `m` components instead of `motion` for auto-code-splitting:
 *   import { m } from 'framer-motion';
 *   <m.div animate={{ opacity: 1 }} />
 */
export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  );
}
