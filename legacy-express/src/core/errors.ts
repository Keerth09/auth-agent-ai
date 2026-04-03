/**
 * errors.ts — Custom Error Hierarchy
 *
 * All errors carry a machine-readable `code` for structured API responses.
 * HTTP status codes are attached at the error level so middleware can surface
 * the right status without additional logic.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** User is not authenticated (no valid session) */
export class UnauthenticatedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHENTICATED');
  }
}

/** Action was denied by permission engine */
export class PermissionDeniedError extends AppError {
  constructor(action: string, reason: string) {
    super(`Permission denied for action '${action}': ${reason}`, 403, 'PERMISSION_DENIED');
  }
}

/** Action requires human approval — not an error, but a flow control signal */
export class ApprovalRequiredError extends AppError {
  public readonly pendingActionId: string;
  constructor(action: string, pendingActionId: string) {
    super(`Action '${action}' requires human approval`, 202, 'APPROVAL_REQUIRED');
    this.pendingActionId = pendingActionId;
  }
}

/** Action requires step-up authentication */
export class StepUpAuthRequired extends AppError {
  public readonly stepUpUrl: string;
  constructor(action: string, stepUpUrl: string) {
    super(`Action '${action}' requires step-up authentication`, 403, 'STEP_UP_AUTH_REQUIRED');
    this.stepUpUrl = stepUpUrl;
  }
}

/** Auth0 Token Vault returned an error (e.g., token revoked, no connection) */
export class TokenVaultError extends AppError {
  constructor(message: string, statusCode = 502) {
    super(`Token Vault error: ${message}`, statusCode, 'TOKEN_VAULT_ERROR');
  }
}

/** Auth0 Management API returned an error */
export class ManagementApiError extends AppError {
  constructor(message: string) {
    super(`Auth0 Management API error: ${message}`, 502, 'MANAGEMENT_API_ERROR');
  }
}

/** Agent orchestration failed */
export class AgentError extends AppError {
  constructor(message: string) {
    super(`Agent error: ${message}`, 500, 'AGENT_ERROR');
  }
}

/** Generic not found */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/** Validation/request body error */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}
