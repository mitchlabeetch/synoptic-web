# Synoptic Security Implementation

This document outlines the security measures implemented in the Synoptic application.

## 🔐 Authentication Security

### JWT Token Management

- **No Hardcoded Secrets**: JWT_SECRET environment variable is required; app crashes if not set
- **Secure Token Configuration**: HS256 algorithm, 7-day expiry, issuer/audience verification
- **HttpOnly Cookies**: Auth tokens stored in httpOnly, secure (production), sameSite cookies

### Login Protection

- **Rate Limiting**: 5 attempts per 15 minutes per IP address
- **Timing Attack Prevention**: Constant-time password comparison even for non-existent users
- **Audit Logging**: All login attempts (success/failure) are logged with IP and timestamp
- **Zod Validation**: Strict email format and password length validation

### Password Security

- **Strong Requirements**: Min 8 chars, requires uppercase, lowercase, and number
- **Max Length**: 128 character limit to prevent bcrypt DoS attacks
- **Secure Hashing**: bcrypt with cost factor 12

### Signup Protection

- **Rate Limiting**: 3 registrations per hour per IP address
- **No Email Enumeration**: Generic error messages don't reveal if email exists
- **Audit Logging**: All signups logged with user ID, email, and IP

## 🛡️ HTTP Security Headers

All responses include:

- **X-Frame-Options: DENY** - Prevents clickjacking
- **X-Content-Type-Options: nosniff** - Prevents MIME sniffing
- **X-XSS-Protection: 1; mode=block** - XSS filter for older browsers
- **Referrer-Policy: strict-origin-when-cross-origin** - Controls referrer leakage
- **Strict-Transport-Security** (production only) - Forces HTTPS
- **Permissions-Policy** - Disables camera, microphone, geolocation, FLoC
- **Content-Security-Policy** - Comprehensive CSP preventing XSS

## 🗄️ Database Security

### SQL Injection Prevention

- **Table Whitelists**: Only explicitly allowed table names can be used
- **Column Whitelists**: Per-table column whitelists prevent injection via object keys
- **Identifier Escaping**: PostgreSQL double-quote escaping for all identifiers
- **Parameterized Queries**: All values passed as query parameters

### SSL/TLS

- **CA Certificate Support**: `DATABASE_CA_CERT_PATH` for proper SSL verification
- **Production Enforcement**: App fails if CA cert is missing in production
- **Development Warning**: Logs warnings when using `rejectUnauthorized: false`

### Transaction Support

- **Atomic Operations**: `transaction()` helper with BEGIN/COMMIT/ROLLBACK
- **Row-Level Locking**: `FOR UPDATE` used to prevent race conditions

## 🤖 AI Endpoint Security

### Credit Management

- **Check-and-Reserve Pattern**: Credits reserved before AI call, refunded on failure
- **Row-Level Locking**: Prevents concurrent requests from draining credits
- **Cost Calculation**: Dynamic cost based on text length

### Rate Limiting

- **Per-User Limits**: 30 AI calls per minute per user
- **Export Limits**: 10 exports per hour per user

### Input Validation

- **Zod Schemas**: All inputs validated with strict schemas
- **Length Limits**: Maximum text lengths enforced
- **Sanitized Errors**: Internal errors never exposed to clients

## 📊 Audit Logging

### Logged Events

- Authentication: login success/failure, signup, logout
- Authorization: access denied, permission escalation attempts
- Security: rate limit exceeded, injection attempts, invalid tokens
- Data: exports, deletions, project access

### Log Format

Structured JSON logs with:

- Timestamp (ISO 8601)
- Event type
- Severity level
- User context (ID, IP, user agent)
- Request context (path, method)

## 🔧 Environment Validation

### Required Variables (Production)

- `JWT_SECRET` - Min 32 characters, random
- `DATABASE_URL` - PostgreSQL connection string
- `DATABASE_CA_CERT_PATH` - Path to CA certificate
- `NEXT_PUBLIC_APP_URL` - Must use HTTPS

### Validation

- Startup checks all required variables
- Production fails fast if security requirements not met
- Development logs warnings but allows startup

## 🖼️ Image Security

### Next.js Image Optimization

- **Device Sizes**: Limited to max 1920px width
- **Image Sizes**: Small icons/thumbnails only (max 384px)
- **Cache TTL**: 60 second minimum to prevent abuse
- **Domain Whitelist**: Only approved remote image sources

## 📁 Files Created/Modified

### New Security Modules

- `src/lib/security/headers.ts` - Security header configuration
- `src/lib/security/rate-limit.ts` - Rate limiting utilities
- `src/lib/security/validation.ts` - Zod schemas
- `src/lib/security/audit.ts` - Audit logging
- `src/lib/security/env-check.ts` - Environment validation
- `src/lib/security/index.ts` - Module exports

### Modified Files

- `middleware.ts` - Added security headers, removed JWT fallback
- `src/lib/auth/jwt.ts` - Removed secret fallback
- `src/lib/db/client.ts` - Added SQL injection protection, SSL improvements
- `src/lib/db/server.ts` - Added column whitelists
- `src/app/api/auth/login/route.ts` - Added rate limiting, audit logging
- `src/app/api/auth/signup/route.ts` - Added rate limiting, strong password validation
- `src/app/api/ai/*/route.ts` - Added transaction atomicity, sanitized errors
- `next.config.ts` - Added image size limits

## 🚀 Deployment Checklist

1. Set `JWT_SECRET` to a random 32+ character string
2. Download DigitalOcean CA certificate
3. Set `DATABASE_CA_CERT_PATH` to certificate path
4. Set `NEXT_PUBLIC_APP_URL` to production HTTPS URL
5. Ensure `NODE_ENV=production`
6. Review CSP directives for your specific needs
7. Monitor audit logs for suspicious activity
