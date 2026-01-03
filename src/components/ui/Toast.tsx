// src/components/ui/Toast.tsx
// PURPOSE: Global toast notification system
// ACTION: Shows non-intrusive notifications for actions and errors
// MECHANISM: Uses sonner library with Synoptic-themed styling

'use client';

import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';

/**
 * Toast provider component - add to root layout
 */
export function ToastProvider() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: 'group rounded-xl border bg-background text-foreground shadow-lg',
          title: 'font-semibold text-sm',
          description: 'text-sm text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-md font-medium',
          cancelButton: 'bg-muted text-muted-foreground text-xs px-3 py-1.5 rounded-md',
          success: 'border-green-500/20 bg-green-50 dark:bg-green-950/30',
          error: 'border-destructive/20 bg-destructive/5',
          warning: 'border-yellow-500/20 bg-yellow-50 dark:bg-yellow-950/30',
          info: 'border-syn-secondary/20 bg-syn-secondary/5',
        },
      }}
      expand={false}
      richColors
      closeButton
    />
  );
}

/**
 * Toast utility functions with Synoptic-themed variants
 */
export const toast = {
  /**
   * Success notification (e.g., "Saved successfully")
   */
  success: (message: string, options?: { description?: string }) => {
    sonnerToast.success(message, {
      description: options?.description,
      icon: '✓',
    });
  },

  /**
   * Error notification (e.g., "Save failed")
   */
  error: (message: string, options?: { description?: string }) => {
    sonnerToast.error(message, {
      description: options?.description,
      icon: '✗',
    });
  },

  /**
   * Info notification (e.g., "Credits used: 2")
   */
  info: (message: string, options?: { description?: string }) => {
    sonnerToast.info(message, {
      description: options?.description,
    });
  },

  /**
   * Warning notification
   */
  warning: (message: string, options?: { description?: string }) => {
    sonnerToast.warning(message, {
      description: options?.description,
    });
  },

  /**
   * AI credit usage notification
   */
  credits: (creditsUsed: number, remaining?: number) => {
    sonnerToast.info(`Credits used: ${creditsUsed}`, {
      description: remaining !== undefined ? `${remaining} credits remaining` : undefined,
      icon: '🧠',
    });
  },

  /**
   * Loading toast with promise resolution
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },

  /**
   * Dismissible action toast
   */
  action: (
    message: string,
    options: {
      description?: string;
      action: { label: string; onClick: () => void };
      cancel?: { label: string; onClick: () => void };
    }
  ) => {
    const toastOptions: Parameters<typeof sonnerToast>[1] = {
      description: options.description,
      action: {
        label: options.action.label,
        onClick: options.action.onClick,
      },
    };
    
    if (options.cancel) {
      toastOptions.cancel = {
        label: options.cancel.label,
        onClick: options.cancel.onClick,
      };
    }
    
    sonnerToast(message, toastOptions);
  },

  /**
   * Dismiss all toasts
   */
  dismiss: () => {
    sonnerToast.dismiss();
  },
};
