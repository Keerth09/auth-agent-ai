/**
 * agentRunner.ts — Agent State Machine & Persistence Layer
 *
 * Manages the lifecycle of agent runs in the database.
 * Acts as the repository layer for agent tasks and pending approvals.
 */

import { db } from '../core/database';
import { v4 as uuidv4 } from 'uuid';
import {
  AgentTask,
  AgentAction,
  AgentRunStatus,
  PendingAction,
  AgentResult,
} from './agentTask.types';

// ── Agent Run CRUD ──────────────────────────────────────────────────────────

/** Create a new agent run record */
export function createAgentRun(userId: string, task: string): AgentTask {
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO agent_runs (id, user_id, task, status, actions, created_at, updated_at)
    VALUES (?, ?, ?, 'pending', '[]', ?, ?)
  `).run(id, userId, task, now, now);

  return getAgentRun(id)!;
}

/** Fetch an agent run by ID */
export function getAgentRun(runId: string): AgentTask | undefined {
  const row = db.prepare('SELECT * FROM agent_runs WHERE id = ?').get(runId) as
    | {
        id: string;
        user_id: string;
        task: string;
        status: AgentRunStatus;
        actions: string;
        result: string | null;
        error: string | null;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  if (!row) return undefined;

  return {
    id: row.id,
    userId: row.user_id,
    task: row.task,
    status: row.status,
    actions: JSON.parse(row.actions) as AgentAction[],
    result: row.result ? (JSON.parse(row.result) as AgentResult) : undefined,
    error: row.error || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Update agent run status */
export function updateAgentStatus(
  runId: string,
  status: AgentRunStatus,
  extras?: { result?: AgentResult; error?: string; actions?: AgentAction[] }
): void {
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE agent_runs
    SET status = ?,
        result = COALESCE(?, result),
        error = COALESCE(?, error),
        actions = COALESCE(?, actions),
        updated_at = ?
    WHERE id = ?
  `).run(
    status,
    extras?.result ? JSON.stringify(extras.result) : null,
    extras?.error ?? null,
    extras?.actions ? JSON.stringify(extras.actions) : null,
    now,
    runId
  );
}

/** Update the actions array for an agent run */
export function updateAgentActions(runId: string, actions: AgentAction[]): void {
  const now = new Date().toISOString();
  db.prepare('UPDATE agent_runs SET actions = ?, updated_at = ? WHERE id = ?')
    .run(JSON.stringify(actions), now, runId);
}

/** List recent agent runs for a user */
export function listAgentRuns(userId: string, limit = 20): AgentTask[] {
  const rows = db.prepare(`
    SELECT * FROM agent_runs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
  `).all(userId, limit) as Array<{
    id: string;
    user_id: string;
    task: string;
    status: AgentRunStatus;
    actions: string;
    result: string | null;
    error: string | null;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    task: row.task,
    status: row.status,
    actions: JSON.parse(row.actions) as AgentAction[],
    result: row.result ? (JSON.parse(row.result) as AgentResult) : undefined,
    error: row.error || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

// ── Pending Actions (Human-in-the-Loop) ─────────────────────────────────────

/** Create a pending action awaiting human approval */
export function createPendingAction(
  runId: string,
  userId: string,
  actionName: string,
  actionData: Record<string, unknown>
): PendingAction {
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO pending_actions (id, run_id, user_id, action_name, action_data, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).run(id, runId, userId, actionName, JSON.stringify(actionData), now);

  return getPendingAction(id)!;
}

/** Fetch a pending action by ID */
export function getPendingAction(actionId: string): PendingAction | undefined {
  const row = db.prepare('SELECT * FROM pending_actions WHERE id = ?').get(actionId) as
    | {
        id: string;
        run_id: string;
        user_id: string;
        action_name: string;
        action_data: string;
        status: 'pending' | 'approved' | 'denied';
        created_at: string;
        resolved_at: string | null;
      }
    | undefined;

  if (!row) return undefined;

  return {
    id: row.id,
    runId: row.run_id,
    userId: row.user_id,
    actionName: row.action_name,
    actionData: JSON.parse(row.action_data) as Record<string, unknown>,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at || undefined,
  };
}

/** Resolve a pending action (approve or deny) */
export function resolvePendingAction(
  actionId: string,
  resolution: 'approved' | 'denied'
): PendingAction | undefined {
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE pending_actions
    SET status = ?, resolved_at = ?
    WHERE id = ? AND status = 'pending'
  `).run(resolution, now, actionId);

  return getPendingAction(actionId);
}

/** List all pending actions for a user */
export function listPendingActions(userId: string): PendingAction[] {
  const rows = db.prepare(`
    SELECT * FROM pending_actions
    WHERE user_id = ? AND status = 'pending'
    ORDER BY created_at DESC
  `).all(userId) as Array<{
    id: string;
    run_id: string;
    user_id: string;
    action_name: string;
    action_data: string;
    status: 'pending' | 'approved' | 'denied';
    created_at: string;
    resolved_at: string | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    runId: row.run_id,
    userId: row.user_id,
    actionName: row.action_name,
    actionData: JSON.parse(row.action_data) as Record<string, unknown>,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at || undefined,
  }));
}
