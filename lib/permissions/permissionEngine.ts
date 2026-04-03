/**
 * permissionEngine.ts — Rule-Based Permission Evaluator
 *
 * Security decisions:
 * - Every agent action MUST pass through evaluate() before execution
 * - Deny-by-default: unknown actions → deny
 * - Step-up auth generates a redirect URL for the frontend to use
 * - Results are returned as structured objects for audit logging
 */

import { findRule, PermissionDecision, PermissionRule } from './permissionRules';

export interface PermissionResult {
  decision: PermissionDecision;
  rule: PermissionRule;
  reason: string;
  /** Only present for require_step_up_auth decisions */
  stepUpUrl?: string;
}

/**
 * Evaluate whether an action is permitted.
 *
 * @param action - The action name (e.g., 'read_email', 'send_email')
 * @param userId - Auth0 user ID (for step-up URL generation)
 * @returns PermissionResult with decision and audit metadata
 */
export function evaluate(action: string, userId: string): PermissionResult {
  const rule = findRule(action);

  const result: PermissionResult = {
    decision: rule.decision,
    rule,
    reason: rule.reason,
  };

  // For step-up auth decisions, generate the Auth0 re-authentication URL
  if (rule.decision === 'require_step_up_auth') {
    result.stepUpUrl = buildStepUpUrl(userId, action);
  }

  return result;
}

/**
 * Build an Auth0 step-up authentication URL.
 *
 * Uses max_age=0 to force immediate re-authentication regardless of session age.
 * The acr_values parameter can request specific auth factors (e.g., MFA).
 *
 * Security: The 'action' is passed as state so the backend can resume
 * after the user completes step-up auth.
 */
function buildStepUpUrl(userId: string, action: string): string {
  const domain = process.env.AUTH0_DOMAIN!;
  const clientId = process.env.AUTH0_CLIENT_ID!;
  const callbackUrl = process.env.AUTH0_CALLBACK_URL!;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: 'openid profile email',
    max_age: '0',             // Force re-authentication even if session is fresh
    acr_values: 'http://schemas.openid.net/pape/policies/2007/06/multi-factor',
    state: Buffer.from(
      JSON.stringify({ action, userId, type: 'step_up' })
    ).toString('base64url'),
  });

  return `https://${domain}/authorize?${params.toString()}`;
}

/**
 * Utility: check if a decision allows immediate execution
 */
export function isImmediatelyExecutable(decision: PermissionDecision): boolean {
  return decision === 'allow';
}

/**
 * Utility: check if a decision requires queuing for human approval
 */
export function requiresApproval(decision: PermissionDecision): boolean {
  return decision === 'require_approval';
}

/**
 * Get a summary of all permission rules for the /tokens endpoint
 */
export { PERMISSION_RULES } from './permissionRules';
