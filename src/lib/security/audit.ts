// src/lib/security/audit.ts
// PURPOSE: Security audit logging for critical operations
// ACTION: Logs authentication, authorization, and security events
// MECHANISM: Structured logging with severity levels and context

export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILURE = 'auth.login.failure',
  LOGOUT = 'auth.logout',
  SIGNUP = 'auth.signup',
  PASSWORD_RESET_REQUEST = 'auth.password_reset.request',
  PASSWORD_RESET_COMPLETE = 'auth.password_reset.complete',
  
  // Authorization events
  ACCESS_DENIED = 'authz.access_denied',
  PERMISSION_ESCALATION = 'authz.escalation_attempt',
  
  // Rate limiting events
  RATE_LIMIT_EXCEEDED = 'security.rate_limit',
  
  // Suspicious activity
  INJECTION_ATTEMPT = 'security.injection_attempt',
  INVALID_TOKEN = 'security.invalid_token',
  CSRF_VIOLATION = 'security.csrf',
  
  // Data access
  DATA_EXPORT = 'data.export',
  DATA_DELETE = 'data.delete',
  PROJECT_ACCESS = 'data.project_access',
  
  // Admin actions
  ADMIN_ACTION = 'admin.action',
  CONFIG_CHANGE = 'admin.config_change',
}

export enum AuditSeverity {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface AuditContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

export interface AuditEvent {
  timestamp: string;
  type: AuditEventType;
  severity: AuditSeverity;
  message: string;
  context: AuditContext;
}

/**
 * Log a security audit event
 * In production, this should be connected to a SIEM or log aggregation service
 */
export function logAuditEvent(
  type: AuditEventType,
  severity: AuditSeverity,
  message: string,
  context: AuditContext = {}
): void {
  const event: AuditEvent = {
    timestamp: new Date().toISOString(),
    type,
    severity,
    message,
    context: {
      ...context,
      // Redact sensitive data
      ...(context.password ? { password: '[REDACTED]' } : {}),
      ...(context.token ? { token: '[REDACTED]' } : {}),
    },
  };
  
  // Format for structured logging
  const logLine = JSON.stringify(event);
  
  // Use appropriate console method based on severity
  switch (severity) {
    case AuditSeverity.CRITICAL:
    case AuditSeverity.ERROR:
      console.error(`[AUDIT] ${logLine}`);
      break;
    case AuditSeverity.WARN:
      console.warn(`[AUDIT] ${logLine}`);
      break;
    default:
      console.log(`[AUDIT] ${logLine}`);
  }
  
  // In production, you would also:
  // - Send to external logging service (DataDog, Splunk, etc.)
  // - Store in database for compliance
  // - Trigger alerts for critical events
}

// =============================================================================
// Pre-built Audit Loggers
// =============================================================================

export const AuditLog = {
  loginSuccess(userId: string, ip: string, userAgent?: string) {
    logAuditEvent(
      AuditEventType.LOGIN_SUCCESS,
      AuditSeverity.INFO,
      `User ${userId} logged in successfully`,
      { userId, ip, userAgent }
    );
  },
  
  loginFailure(email: string, ip: string, reason: string) {
    logAuditEvent(
      AuditEventType.LOGIN_FAILURE,
      AuditSeverity.WARN,
      `Failed login attempt for ${email}: ${reason}`,
      { email, ip, reason }
    );
  },
  
  signup(userId: string, email: string, ip: string) {
    logAuditEvent(
      AuditEventType.SIGNUP,
      AuditSeverity.INFO,
      `New user registered: ${email}`,
      { userId, email, ip }
    );
  },
  
  logout(userId: string) {
    logAuditEvent(
      AuditEventType.LOGOUT,
      AuditSeverity.INFO,
      `User ${userId} logged out`,
      { userId }
    );
  },
  
  accessDenied(userId: string | undefined, resource: string, ip: string) {
    logAuditEvent(
      AuditEventType.ACCESS_DENIED,
      AuditSeverity.WARN,
      `Access denied to ${resource}`,
      { userId, resource, ip }
    );
  },
  
  rateLimitExceeded(identifier: string, ip: string, endpoint: string) {
    logAuditEvent(
      AuditEventType.RATE_LIMIT_EXCEEDED,
      AuditSeverity.WARN,
      `Rate limit exceeded: ${identifier} on ${endpoint}`,
      { identifier, ip, endpoint }
    );
  },
  
  injectionAttempt(ip: string, payload: string, endpoint: string) {
    logAuditEvent(
      AuditEventType.INJECTION_ATTEMPT,
      AuditSeverity.CRITICAL,
      `Possible injection attempt detected`,
      { ip, payload: payload.slice(0, 200), endpoint }
    );
  },
  
  invalidToken(ip: string, reason: string) {
    logAuditEvent(
      AuditEventType.INVALID_TOKEN,
      AuditSeverity.WARN,
      `Invalid token presented: ${reason}`,
      { ip, reason }
    );
  },
  
  dataExport(userId: string, exportType: string, projectId?: string) {
    logAuditEvent(
      AuditEventType.DATA_EXPORT,
      AuditSeverity.INFO,
      `User ${userId} exported data as ${exportType}`,
      { userId, exportType, projectId }
    );
  },
  
  dataDelete(userId: string, resourceType: string, resourceId: string) {
    logAuditEvent(
      AuditEventType.DATA_DELETE,
      AuditSeverity.INFO,
      `User ${userId} deleted ${resourceType} ${resourceId}`,
      { userId, resourceType, resourceId }
    );
  },
  
  passwordResetRequest(email: string, ip: string) {
    logAuditEvent(
      AuditEventType.PASSWORD_RESET_REQUEST,
      AuditSeverity.INFO,
      `Password reset requested for ${email}`,
      { email, ip }
    );
  },
  
  passwordResetComplete(userId: string, ip: string) {
    logAuditEvent(
      AuditEventType.PASSWORD_RESET_COMPLETE,
      AuditSeverity.INFO,
      `Password reset completed for user ${userId}`,
      { userId, ip }
    );
  },
};

/**
 * Helper to extract context from a Next.js request
 */
export function extractRequestContext(request: Request): AuditContext {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor 
    ? forwardedFor.split(',')[0].trim() 
    : request.headers.get('x-real-ip') || 'unknown';
  
  return {
    ip,
    userAgent: request.headers.get('user-agent') || undefined,
    path: new URL(request.url).pathname,
    method: request.method,
  };
}
