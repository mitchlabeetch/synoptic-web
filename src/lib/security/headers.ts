// src/lib/security/headers.ts
// PURPOSE: Security headers configuration for Next.js middleware
// ACTION: Provides CSP, CORS, and other security headers
// MECHANISM: Returns headers object to be added to responses

/**
 * Content Security Policy directives
 * Prevents XSS, clickjacking, and other injection attacks
 */
export function getSecurityHeaders(): Record<string, string> {
  const isDev = process.env.NODE_ENV === 'development';
  
  return {
    // Prevents clickjacking by disallowing iframe embedding
    'X-Frame-Options': 'DENY',
    
    // Prevents MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enables XSS filtering in older browsers
    'X-XSS-Protection': '1; mode=block',
    
    // Controls referrer information sent with requests
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Prevents the browser from loading mixed content
    'Strict-Transport-Security': isDev 
      ? '' 
      : 'max-age=31536000; includeSubDomains; preload',
    
    // Restricts browser features and APIs
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()', // Blocks FLoC tracking
    ].join(', '),
    
    // Content Security Policy
    'Content-Security-Policy': buildCSP(isDev),
  };
}

/**
 * Build Content Security Policy string
 */
function buildCSP(isDev: boolean): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      // Allow inline scripts in dev for hot reload
      ...(isDev ? ["'unsafe-eval'", "'unsafe-inline'"] : []),
      // Analytics (if used)
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for styled-components, emotion, etc.
      'https://fonts.googleapis.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      // Allowed image domains (should match next.config.ts)
      'https://images.metmuseum.org',
      'https://www.artic.edu',
      'https://lh3.ggpht.com',
      'https://collectionapi.metmuseum.org',
      'https://apod.nasa.gov',
      'https://www.themealdb.com',
      'https://upload.wikimedia.org',
      'https://en.wikipedia.org',
      'https://chroniclingamerica.loc.gov',
      'https://tile.loc.gov',
      'https://imgs.xkcd.com',
      'https://raw.githubusercontent.com',
      'https://images.unsplash.com',
      'https://source.unsplash.com',
      'https://covers.openlibrary.org',
      'https://standardebooks.org',
    ],
    'connect-src': [
      "'self'",
      // API endpoints
      'https://api.languagetool.org',
      'https://libretranslate.com',
      'https://api.dictionaryapi.dev',
      'https://*.wiktionary.org',
      // Analytics
      'https://www.google-analytics.com',
      // DigitalOcean endpoints (for AI)
      'https://*.digitaloceanspaces.com',
      'https://api.openai.com',
      // Dev server
      ...(isDev ? ['ws://localhost:*', 'http://localhost:*'] : []),
    ],
    'media-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': [],
  };
  
  // In dev, don't upgrade insecure requests
  if (isDev) {
    delete directives['upgrade-insecure-requests'];
  }
  
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`.trim())
    .join('; ');
}

/**
 * CORS headers for API routes
 */
export function getCORSHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'https://synoptic.studio',
    'https://www.synoptic.studio',
  ].filter(Boolean) as string[];
  
  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
  }
  
  // Check if origin is allowed
  const isAllowed = origin && allowedOrigins.some(allowed => 
    origin === allowed || origin.endsWith('.synoptic.studio')
  );
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin! : '',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}
