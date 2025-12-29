// src/lib/sanitize.ts
// PURPOSE: Provide secure HTML sanitization for user-generated content
// ACTION: Uses DOMPurify to strip dangerous HTML while preserving formatting
// MECHANISM: Whitelists safe tags (p, span, strong, em, br, etc.) and removes XSS vectors

import DOMPurify from 'dompurify';

/**
 * Default allowed tags for rich text content
 */
const ALLOWED_TAGS = [
  'p', 'br', 'span', 'div',
  'strong', 'b', 'em', 'i', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'sup', 'sub', 'mark',
] as const;

/**
 * Default allowed attributes
 */
const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'target', 'rel',
  'class', 'id', 'style',
  'dir', 'lang',
  'colspan', 'rowspan',
  'data-word-id', 'data-annotation-id',
] as const;

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - Raw HTML string to sanitize
 * @param options - Optional configuration for DOMPurify
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(
  html: string,
  options?: {
    allowedTags?: readonly string[];
    allowedAttributes?: readonly string[];
    allowDataAttributes?: boolean;
  }
): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Use type assertion to bypass strict type checking with the library
  const config = {
    ALLOWED_TAGS: [...(options?.allowedTags || ALLOWED_TAGS)],
    ALLOWED_ATTR: [...(options?.allowedAttributes || ALLOWED_ATTR)],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: options?.allowDataAttributes ?? true,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus'],
  };

  return DOMPurify.sanitize(html, config as Parameters<typeof DOMPurify.sanitize>[1]);
}

/**
 * Strict sanitization - only allows basic text formatting
 * Useful for export contexts where security is paramount
 */
export function sanitizeHTMLStrict(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  const config = {
    ALLOWED_TAGS: ['p', 'br', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'sup', 'sub'],
    ALLOWED_ATTR: ['class', 'style', 'dir', 'lang'],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
  };
  
  return DOMPurify.sanitize(html, config as Parameters<typeof DOMPurify.sanitize>[1]);
}

/**
 * Strip all HTML tags, returning plain text
 * @param html - HTML string to strip
 * @returns Plain text content
 */
export function stripHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  const config = {
    ALLOWED_TAGS: [] as string[],
    KEEP_CONTENT: true,
  };
  
  return DOMPurify.sanitize(html, config as Parameters<typeof DOMPurify.sanitize>[1]);
}

/**
 * Escape special HTML characters for safe display
 * @param text - Plain text to escape
 * @returns Escaped HTML string
 */
export function escapeHTML(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (char) => escapeMap[char]);
}

/**
 * Sanitize for EPUB/XML contexts
 * Ensures XML-valid content
 */
export function sanitizeForXML(html: string): string {
  // First sanitize with strict settings
  const sanitized = sanitizeHTMLStrict(html);
  
  // Then ensure XML-valid entities
  return sanitized
    .replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
}
