// src/lib/logger.ts
// PURPOSE: Unified logger that suppresses non-critical logs in production
// ACTION: Provides consistent logging interface with environment awareness
// MECHANISM: Wraps console methods with environment checks

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  module?: string;
  [key: string]: unknown;
}

/**
 * Check if we're in development mode.
 * This is evaluated once at module load for performance.
 */
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Format a log message with optional context.
 */
function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const module = context?.module ? `[${context.module}]` : '';
  return `${timestamp} ${level.toUpperCase()} ${module} ${message}`.trim();
}

/**
 * Unified logger that respects environment settings.
 * 
 * - In development: All log levels are output
 * - In production: Only warn and error are output
 * 
 * This ensures verbose debugging logs don't pollute production logs
 * while still capturing important warnings and errors.
 */
export const logger = {
  /**
   * Debug logs - only shown in development.
   * Use for detailed debugging information.
   */
  debug(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(formatMessage('debug', message, context));
      if (context && Object.keys(context).length > 1) {
        const { module: _module, ...rest } = context;
        if (Object.keys(rest).length > 0) {
          console.log(rest);
        }
      }
    }
  },

  /**
   * Info logs - only shown in development.
   * Use for general informational messages about application state.
   */
  info(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(formatMessage('info', message, context));
      if (context && Object.keys(context).length > 1) {
        const { module: _module, ...rest } = context;
        if (Object.keys(rest).length > 0) {
          console.log(rest);
        }
      }
    }
  },

  /**
   * Warning logs - always shown.
   * Use for potential issues that don't prevent operation.
   */
  warn(message: string, context?: LogContext): void {
    console.warn(formatMessage('warn', message, context));
    if (context && Object.keys(context).length > 1) {
      const { module: _module, ...rest } = context;
      if (Object.keys(rest).length > 0) {
        console.warn(rest);
      }
    }
  },

  /**
   * Error logs - always shown.
   * Use for errors that need attention.
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    console.error(formatMessage('error', message, context));
    if (error) {
      // In development, show full error
      if (isDevelopment) {
        console.error(error);
      } else {
        // In production, only show safe error info
        console.error({
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  },

  /**
   * Database query log - shown only in development.
   * Use for logging database operations.
   */
  query(text: string, duration: number, rowCount: number | null): void {
    if (isDevelopment) {
      console.log('[DB Query]', { 
        text: text.slice(0, 100), 
        duration: `${duration}ms`,
        rows: rowCount 
      });
    }
  },
};

/**
 * Utility to safely extract an error message.
 * Handles the TypeScript 4.0+ `unknown` type in catch blocks.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unknown error occurred';
}

/**
 * Type guard to check if an error has a specific property.
 */
export function isErrorWithCode(error: unknown): error is Error & { code: string } {
  return error instanceof Error && 'code' in error;
}

/**
 * Type guard for database errors with specific error codes.
 */
export function isDatabaseError(error: unknown): error is Error & { code: string; detail?: string } {
  return error instanceof Error && 'code' in error && typeof (error as { code: unknown }).code === 'string';
}
