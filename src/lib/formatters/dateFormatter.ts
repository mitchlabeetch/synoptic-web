// src/lib/formatters/dateFormatter.ts
// PURPOSE: Locale-aware date and number formatting utilities
// ACTION: Uses Intl.DateTimeFormat and Intl.NumberFormat for proper localization
// MECHANISM: Respects user's locale to avoid ambiguous formats (01/02/2023 = US vs UK problem)

/**
 * Format a date according to user's locale.
 * Uses Intl.DateTimeFormat to automatically respect regional date formats.
 * 
 * @example
 * formatDate(new Date(), 'en-US') // "1/2/2023"
 * formatDate(new Date(), 'en-GB') // "2/1/2023"
 * formatDate(new Date(), 'de-DE') // "2.1.2023"
 * formatDate(new Date(), 'ja-JP') // "2023/1/2"
 */
export function formatDate(
  date: Date | string | number,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Default options for a clean, unambiguous date format
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short', // "Jan" instead of "1" to avoid ambiguity
    day: 'numeric',
    ...options,
  };
  
  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch {
    // Fallback to ISO format if locale is invalid
    return dateObj.toISOString().split('T')[0];
  }
}

/**
 * Format a date with time according to user's locale.
 */
export function formatDateTime(
  date: Date | string | number,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  
  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch {
    return dateObj.toISOString();
  }
}

/**
 * Format a relative time (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: string,
  now: Date = new Date()
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const diffMs = dateObj.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);
  const diffWeeks = Math.round(diffDays / 7);
  const diffMonths = Math.round(diffDays / 30);
  const diffYears = Math.round(diffDays / 365);

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    if (Math.abs(diffSeconds) < 60) {
      return rtf.format(diffSeconds, 'second');
    } else if (Math.abs(diffMinutes) < 60) {
      return rtf.format(diffMinutes, 'minute');
    } else if (Math.abs(diffHours) < 24) {
      return rtf.format(diffHours, 'hour');
    } else if (Math.abs(diffDays) < 7) {
      return rtf.format(diffDays, 'day');
    } else if (Math.abs(diffWeeks) < 4) {
      return rtf.format(diffWeeks, 'week');
    } else if (Math.abs(diffMonths) < 12) {
      return rtf.format(diffMonths, 'month');
    } else {
      return rtf.format(diffYears, 'year');
    }
  } catch {
    // Fallback to a simple format
    return formatDate(dateObj, locale);
  }
}

/**
 * Format a number according to user's locale.
 * 
 * @example
 * formatNumber(1234.56, 'en-US') // "1,234.56"
 * formatNumber(1234.56, 'de-DE') // "1.234,56"
 * formatNumber(1234.56, 'fr-FR') // "1 234,56"
 */
export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return String(value);
  }
}

/**
 * Format a percentage according to user's locale.
 */
export function formatPercent(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
      ...options,
    }).format(value);
  } catch {
    return `${(value * 100).toFixed(1)}%`;
  }
}

/**
 * Format currency according to user's locale.
 */
export function formatCurrency(
  value: number,
  locale: string,
  currency: string = 'USD',
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      ...options,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}
