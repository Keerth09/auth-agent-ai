/**
 * agentTask.types.ts — Agent Domain Type Definitions
 *
 * These types represent the core domain model for the agent system.
 * All agent state is structured, typed, and serializable to JSON for DB storage.
 */

import { PermissionDecision, PermissionRule } from '../permissions/permissionRules';

/** High-level task submitted by the user */
export interface AgentTask {
  id: string;
  userId: string;
  /** Natural language or structured task description */
  task: string;
  status: AgentRunStatus;
  actions: AgentAction[];
  result?: AgentResult;
  error?: string;
  tokenFingerprint?: string;
  createdAt: string;
  updatedAt: string;
}

/** Represents a single discrete action the agent wants to take */
export interface AgentAction {
  id: string;
  /** Logical action name — used by permission engine and connectors */
  name: ActionName;
  /** Action-specific parameters */
  params: Record<string, unknown>;
  /** Permission evaluation result */
  permissionDecision?: PermissionDecision;
  permissionReason?: string;
  /** Execution status of this action */
  status: ActionStatus;
  result?: unknown;
  error?: string;
}

/** Known action names — extend as more connectors are added */
export type ActionName =
  | 'read_email'
  | 'summarize_emails'
  | 'list_emails'
  | 'send_email'
  | 'reply_email'
  | 'delete_email'
  | 'delete_data'
  | 'revoke_token'
  | 'exfiltrate_data'
  | string; // Allow arbitrary actions (will hit deny-by-default)

export type AgentRunStatus =
  | 'pending'
  | 'running'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'partially_completed'
  | 'step_up_required';

export type ActionStatus =
  | 'pending'
  | 'allowed'
  | 'denied'
  | 'requires_approval'
  | 'requires_step_up'
  | 'running'
  | 'completed'
  | 'failed';

/** Final result payload after agent completes */
export interface AgentResult {
  summary: string;
  data?: any[];
  actionsCompleted: number;
  actionsFailed: number;
  actionsPending: number;
}

/** Pending action awaiting human approval */
export interface PendingAction {
  id: string;
  runId: string;
  userId: string;
  actionName: ActionName;
  actionData: Record<string, unknown>;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  resolvedAt?: string;
}

/** Structured audit log entry */
export interface AuditLogEntry {
  id: string;
  userId: string;
  agentId?: string;
  action: string;
  tokenFingerprint?: string;
  scopes?: string;
  decision: PermissionDecision | 'info' | 'error';
  status: 'success' | 'failed' | 'pending' | 'revoked' | 'approved' | 'denied';
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

/** Task decomposition result from the orchestrator */
export interface TaskDecomposition {
  actions: Array<{
    name: ActionName;
    params: Record<string, unknown>;
  }>;
  connection: string;
  summary: string;
}

/** Permission evaluation detail per action */
export interface ActionPermissionDetail {
  action: AgentAction;
  rule: PermissionRule;
  decision: PermissionDecision;
}
