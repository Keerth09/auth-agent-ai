/**
 * permissionRules.ts — Static Permission Rule Definitions
 *
 * Security decision: Rules are code-defined (not DB-driven) to prevent
 * privilege escalation via database tampering. Changes require a deploy.
 *
 * Rule evaluation order: most specific first, wildcard last.
 * The engine returns the decision for the FIRST matching rule.
 */

export type PermissionDecision =
  | 'allow'
  | 'deny'
  | 'require_approval'
  | 'require_step_up_auth';

export interface PermissionRule {
  /** Human-readable rule identifier */
  id: string;
  /** Action name this rule applies to. '*' = wildcard */
  action: string;
  /** Required OAuth scope(s) — ALL must be present */
  requiredScopes?: string[];
  /** Decision returned when this rule matches */
  decision: PermissionDecision;
  /** Human-readable explanation for audit logs and UI */
  reason: string;
  /** Risk classification for UI display */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Master permission rules table.
 * Evaluated in order — first match wins.
 */
export const PERMISSION_RULES: PermissionRule[] = [
  // ── Gmail Read ────────────────────────────────────────────────────────────
  {
    id: 'rule:gmail:read',
    action: 'read_email',
    requiredScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    decision: 'allow',
    reason: 'Reading emails is a low-risk, read-only operation. Automatically allowed.',
    riskLevel: 'low',
  },
  {
    id: 'rule:gmail:summarize',
    action: 'summarize_emails',
    requiredScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    decision: 'allow',
    reason: 'Summarizing emails uses local LLM generation and read-only access.',
    riskLevel: 'low',
  },
  {
    id: 'rule:gmail:list',
    action: 'list_emails',
    requiredScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    decision: 'allow',
    reason: 'Listing email subjects is a low-risk, read-only operation.',
    riskLevel: 'low',
  },
  // ── Gmail Send ────────────────────────────────────────────────────────────
  {
    id: 'rule:gmail:send',
    action: 'send_email',
    requiredScopes: ['https://www.googleapis.com/auth/gmail.send'],
    decision: 'require_approval',
    reason: 'Sending email on behalf of user requires explicit human approval. ' +
            'Prevents agent from being used for spam or phishing.',
    riskLevel: 'medium',
  },
  {
    id: 'rule:gmail:reply',
    action: 'reply_email',
    requiredScopes: ['https://www.googleapis.com/auth/gmail.send'],
    decision: 'require_approval',
    reason: 'Replying to email requires human approval.',
    riskLevel: 'medium',
  },
  // ── Data Deletion ─────────────────────────────────────────────────────────
  {
    id: 'rule:gmail:delete',
    action: 'delete_email',
    requiredScopes: ['https://www.googleapis.com/auth/gmail.modify'],
    decision: 'require_approval',
    reason: 'Deleting email is irreversible. Requires human approval before proceeding.',
    riskLevel: 'high',
  },
  {
    id: 'rule:data:delete',
    action: 'delete_data',
    decision: 'require_approval',
    reason: 'Deleting data is a destructive operation requiring human approval.',
    riskLevel: 'critical',
  },
  {
    id: 'rule:system:reset',
    action: 'reset_system',
    decision: 'require_step_up_auth',
    reason: 'System reset requires admin authentication and confirmation',
    riskLevel: 'critical',
  },
  // ── Token Operations ──────────────────────────────────────────────────────
  {
    id: 'rule:token:revoke',
    action: 'revoke_token',
    decision: 'require_step_up_auth',
    reason: 'Token revocation affects all agent operations. Requires step-up authentication.',
    riskLevel: 'high',
  },
  // ── Explicit Denial ───────────────────────────────────────────────────────
  {
    id: 'rule:deny:exfiltrate',
    action: 'exfiltrate_data',
    decision: 'deny',
    reason: 'Data exfiltration is explicitly prohibited.',
    riskLevel: 'critical',
  },
  // ── Unknown Actions ───────────────────────────────────────────────────────
  {
    id: 'rule:default:unknown',
    action: '*',
    decision: 'deny',
    reason: 'Unknown action type. No explicit allow rule exists. Denying by default. ' +
            'Add a rule to the permission engine to allow this action.',
    riskLevel: 'high',
  },
];

/** Look up the rule for a given action (returns first match) */
export function findRule(action: string): PermissionRule {
  const exact = PERMISSION_RULES.find((r) => r.action === action);
  if (exact) return exact;
  // Fall through to wildcard
  return PERMISSION_RULES.find((r) => r.action === '*')!;
}
