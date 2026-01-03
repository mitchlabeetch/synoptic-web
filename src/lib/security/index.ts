// src/lib/security/index.ts
// PURPOSE: Security module exports
// ACTION: Provides a single entry point for all security utilities
// MECHANISM: Re-exports all security modules

// Security Headers
export { getSecurityHeaders, getCORSHeaders } from './headers';

// Rate Limiting
export {
  checkRateLimit,
  RateLimiters,
  getClientIP,
  getRateLimitHeaders,
  type RateLimitConfig,
  type RateLimitResult,
} from './rate-limit';

// Audit Logging
export {
  logAuditEvent,
  AuditLog,
  AuditEventType,
  AuditSeverity,
  extractRequestContext,
  type AuditContext,
  type AuditEvent,
} from './audit';

// Input Validation
export {
  // Schemas
  EmailSchema,
  PasswordSchema,
  LoginPasswordSchema,
  DisplayNameSchema,
  ProjectTitleSchema,
  LanguageCodeSchema,
  LoginRequestSchema,
  SignupRequestSchema,
  PasswordResetRequestSchema,
  PasswordResetConfirmSchema,
  CreateProjectSchema,
  UpdateProjectSchema,
  UUIDSchema,
  PaginationSchema,
  // Helpers
  sanitizeString,
  hasInjectionPatterns,
  // Types
  type LoginRequest,
  type SignupRequest,
  type CreateProjectRequest,
  type UpdateProjectRequest,
} from './validation';

// Environment Validation
export {
  validateEnvironment,
  enforceEnvironmentSecurity,
  getMaskedEnvSummary,
  type EnvRequirement,
  type EnvCheckResult,
} from './env-check';
