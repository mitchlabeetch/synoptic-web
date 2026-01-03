// src/lib/security/validation.ts
// PURPOSE: Input validation schemas and helpers for security-critical operations
// ACTION: Provides Zod schemas for auth, user input sanitization
// MECHANISM: Strict validation with type safety and error messages

import { z } from 'zod';

// =============================================================================
// Email Validation
// =============================================================================

/**
 * Strict email validation that also normalizes to lowercase
 */
export const EmailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(254, 'Email address is too long')
  .transform(email => email.toLowerCase().trim());

// =============================================================================
// Password Validation
// =============================================================================

/**
 * Password requirements:
 * - Minimum 8 characters
 * - Maximum 128 characters (prevent DoS via long password hashing)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Simple password schema for login (no strength requirements)
 * We still limit length to prevent DoS via bcrypt
 */
export const LoginPasswordSchema = z
  .string()
  .min(1, 'Password is required')
  .max(128, 'Password is too long');

// =============================================================================
// User Input Schemas
// =============================================================================

/**
 * Display name validation
 */
export const DisplayNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')
  .regex(
    /^[a-zA-Z0-9\s\-'\.]+$/,
    'Name contains invalid characters'
  )
  .transform(name => name.trim());

/**
 * Project title validation
 */
export const ProjectTitleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(200, 'Title is too long')
  .transform(title => title.trim());

/**
 * Language code validation (ISO 639-1)
 */
export const LanguageCodeSchema = z
  .string()
  .min(2, 'Invalid language code')
  .max(10, 'Invalid language code')
  .regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Invalid language code format');

// =============================================================================
// Auth Request Schemas
// =============================================================================

/**
 * Login request validation
 */
export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: LoginPasswordSchema,
});

/**
 * Signup request validation with strong password requirements
 */
export const SignupRequestSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: DisplayNameSchema.optional(),
});

/**
 * Password reset request validation
 */
export const PasswordResetRequestSchema = z.object({
  email: EmailSchema,
});

/**
 * Password reset confirmation validation
 */
export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: PasswordSchema,
});

// =============================================================================
// Project Schemas
// =============================================================================

/**
 * Create project request
 */
export const CreateProjectSchema = z.object({
  title: ProjectTitleSchema,
  source_lang: LanguageCodeSchema,
  target_lang: LanguageCodeSchema,
});

/**
 * Update project request
 */
export const UpdateProjectSchema = z.object({
  title: ProjectTitleSchema.optional(),
  content: z.any().optional(), // Content is validated separately
  settings: z.any().optional(), // Settings are validated separately
});

// =============================================================================
// Security Helpers
// =============================================================================

/**
 * Sanitize a string for safe display (removes HTML, scripts)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Check if a string looks like it might contain injection attempts
 */
export function hasInjectionPatterns(input: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i, // onclick=, onerror=, etc.
    /data:/i,
    /vbscript:/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /expression\(/i, // CSS expression
    /url\(/i, // CSS url injection
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate and sanitize a UUID
 */
export const UUIDSchema = z
  .string()
  .uuid('Invalid identifier format');

/**
 * Validate pagination parameters
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// =============================================================================
// Type Exports
// =============================================================================

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type CreateProjectRequest = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectRequest = z.infer<typeof UpdateProjectSchema>;
