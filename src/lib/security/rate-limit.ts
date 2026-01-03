// src/lib/security/rate-limit.ts
// PURPOSE: In-memory rate limiting for API endpoints
// ACTION: Prevents brute-force attacks and API abuse
// MECHANISM: Uses sliding window algorithm with configurable limits

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (use Redis for production multi-instance deployments)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Identifier for this rate limit (e.g., 'login', 'api') */
  identifier: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

/**
 * Check if a request is allowed under rate limiting rules
 * @param key - Unique identifier for the requester (e.g., IP address, user ID)
 * @param config - Rate limiting configuration
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const storeKey = `${config.identifier}:${key}`;
  
  let entry = rateLimitStore.get(storeKey);
  
  // Create new entry if none exists or window has expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(storeKey, entry);
  
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const retryAfterMs = allowed ? 0 : entry.resetAt - now;
  
  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
    retryAfterMs,
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const RateLimiters = {
  /**
   * Login attempts - very strict to prevent brute force
   * 5 attempts per 15 minutes per IP
   */
  login: (ip: string) => checkRateLimit(ip, {
    identifier: 'login',
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }),
  
  /**
   * Account creation - prevent mass account creation
   * 3 signups per hour per IP
   */
  signup: (ip: string) => checkRateLimit(ip, {
    identifier: 'signup',
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  }),
  
  /**
   * Password reset - prevent enumeration attacks
   * 3 attempts per 15 minutes per IP
   */
  passwordReset: (ip: string) => checkRateLimit(ip, {
    identifier: 'password-reset',
    maxRequests: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }),
  
  /**
   * AI API calls - per user, more lenient
   * 30 calls per minute per user
   */
  aiApi: (userId: string) => checkRateLimit(userId, {
    identifier: 'ai-api',
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
  }),
  
  /**
   * General API - per IP
   * 100 calls per minute
   */
  api: (ip: string) => checkRateLimit(ip, {
    identifier: 'api',
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  }),
  
  /**
   * Export operations - expensive, limit heavily
   * 10 exports per hour per user
   */
  export: (userId: string) => checkRateLimit(userId, {
    identifier: 'export',
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  }),
};

/**
 * Helper to get client IP from Next.js request
 */
export function getClientIP(request: Request): string {
  // Check standard headers in order of preference
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }
  
  // Fallback - this might not work in all environments
  return 'unknown';
}

/**
 * Rate limiting headers to include in response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.remaining + (result.allowed ? 0 : 1)),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    ...(result.retryAfterMs > 0 ? {
      'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)),
    } : {}),
  };
}
