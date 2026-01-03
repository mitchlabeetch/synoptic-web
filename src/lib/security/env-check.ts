// src/lib/security/env-check.ts
// PURPOSE: Validate critical environment variables at startup
// ACTION: Fails fast if required security variables are missing
// MECHANISM: Checks environment and logs warnings/errors

export interface EnvRequirement {
  name: string;
  required: boolean;
  description: string;
  minLength?: number;
  pattern?: RegExp;
}

/**
 * Critical environment variables that must be set for security
 */
const SECURITY_ENV_VARS: EnvRequirement[] = [
  {
    name: 'JWT_SECRET',
    required: true,
    description: 'Secret key for JWT signing. Must be random and at least 32 characters.',
    minLength: 32,
  },
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string',
    pattern: /^postgres(ql)?:\/\//,
  },
  {
    name: 'DATABASE_CA_CERT_PATH',
    required: false, // Required in production, optional in dev
    description: 'Path to DigitalOcean CA certificate for secure database connections',
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: true,
    description: 'Public URL of the application (for CORS and redirects)',
    pattern: /^https?:\/\//,
  },
];

/**
 * Additional production-only requirements
 */
const PRODUCTION_ENV_VARS: EnvRequirement[] = [
  {
    name: 'DATABASE_CA_CERT_PATH',
    required: true,
    description: 'CA certificate is required in production for secure database connections',
  },
];

export interface EnvCheckResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate all required environment variables
 * Call this during application startup
 */
export function validateEnvironment(): EnvCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Check standard security variables
  for (const envVar of SECURITY_ENV_VARS) {
    const value = process.env[envVar.name];
    
    if (!value) {
      if (envVar.required) {
        errors.push(`Missing required env var: ${envVar.name} - ${envVar.description}`);
      } else {
        warnings.push(`Missing optional env var: ${envVar.name} - ${envVar.description}`);
      }
      continue;
    }
    
    // Check minimum length
    if (envVar.minLength && value.length < envVar.minLength) {
      errors.push(
        `Env var ${envVar.name} is too short. Minimum ${envVar.minLength} characters required.`
      );
    }
    
    // Check pattern
    if (envVar.pattern && !envVar.pattern.test(value)) {
      errors.push(`Env var ${envVar.name} has invalid format.`);
    }
  }
  
  // Check production-only requirements
  if (isProduction) {
    for (const envVar of PRODUCTION_ENV_VARS) {
      const value = process.env[envVar.name];
      
      if (!value && envVar.required) {
        errors.push(`Missing production-required env var: ${envVar.name} - ${envVar.description}`);
      }
    }
    
    // Production-specific checks
    if (process.env.JWT_SECRET?.includes('dev') || 
        process.env.JWT_SECRET?.includes('test') ||
        process.env.JWT_SECRET?.includes('example')) {
      errors.push('JWT_SECRET appears to be a development/example value. Use a secure random secret.');
    }
    
    // Check HTTPS in production
    if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.startsWith('https://')) {
      errors.push('NEXT_PUBLIC_APP_URL must use HTTPS in production.');
    }
  }
  
  // Development warnings
  if (!isProduction) {
    if (!process.env.DATABASE_CA_CERT_PATH) {
      warnings.push(
        'DATABASE_CA_CERT_PATH not set. Database connections are vulnerable to MITM attacks.'
      );
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Run environment check and log results
 * Throws in production if critical variables are missing
 */
export function enforceEnvironmentSecurity(): void {
  const result = validateEnvironment();
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log warnings
  for (const warning of result.warnings) {
    console.warn(`[ENV WARNING] ${warning}`);
  }
  
  // Log errors
  for (const error of result.errors) {
    console.error(`[ENV ERROR] ${error}`);
  }
  
  // In production, fail fast on errors
  if (!result.valid && isProduction) {
    console.error('[FATAL] Environment validation failed. Application cannot start safely.');
    process.exit(1);
  }
  
  // In development, just warn but allow startup
  if (!result.valid && !isProduction) {
    console.warn(
      '[ENV WARNING] Environment validation failed but allowing startup in development mode.'
    );
  }
  
  if (result.valid && result.warnings.length === 0) {
    console.log('[ENV] Environment validation passed.');
  }
}

/**
 * Get a masked version of sensitive env vars for logging
 */
export function getMaskedEnvSummary(): Record<string, string> {
  const summary: Record<string, string> = {};
  
  for (const envVar of SECURITY_ENV_VARS) {
    const value = process.env[envVar.name];
    
    if (!value) {
      summary[envVar.name] = '(not set)';
    } else if (envVar.name.includes('SECRET') || envVar.name.includes('PASSWORD')) {
      // Mask sensitive values
      summary[envVar.name] = value.slice(0, 4) + '****' + value.slice(-4);
    } else if (envVar.name.includes('URL')) {
      // Show URL without credentials
      try {
        const url = new URL(value);
        summary[envVar.name] = `${url.protocol}//${url.host}${url.pathname}`;
      } catch {
        summary[envVar.name] = '(invalid URL)';
      }
    } else {
      summary[envVar.name] = value.slice(0, 20) + (value.length > 20 ? '...' : '');
    }
  }
  
  return summary;
}
