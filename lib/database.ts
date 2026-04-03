/**
 * VaultProxy Audit Logging Database
 * Implementing immutable audit logs for transparent, deterministic agent tracking.
 */
import Database from "better-sqlite3";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const dbPath = path.resolve(process.cwd(), "vaultproxy.db");
const db = new Database(dbPath, {});

// Initialize robust logging schema
db.exec(`
  CREATE TABLE IF NOT EXISTS agent_runs (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    task TEXT NOT NULL,
    service TEXT NOT NULL,
    action TEXT NOT NULL,
    risk TEXT NOT NULL,
    status TEXT NOT NULL,
    result TEXT,
    tokenFingerprint TEXT,
    durationMs INTEGER,
    mfaTriggered BOOLEAN DEFAULT 0,
    approvalRequired BOOLEAN DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pending_actions (
    id TEXT PRIMARY KEY,
    run_id TEXT,
    user_id TEXT NOT NULL,
    action_name TEXT NOT NULL,
    action_data TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    token_fingerprint TEXT,
    decision TEXT,
    status TEXT NOT NULL,
    metadata TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export interface AgentRunLog {
  id: string;
  userId: string;
  task: string;
  service: string;
  action: string;
  risk: string;
  status: string;
  result?: string;
  tokenFingerprint?: string;
  durationMs?: number;
  mfaTriggered?: boolean;
  approvalRequired?: boolean;
  createdAt: string;
}

/**
 * Inserts a new immutable log record indicating agent initiation.
 * 
 * @param entry - Detailed parameters forming the executed operation 
 * @returns UUID string identifier of the log entry created
 */
export function logAgentRun(entry: Partial<AgentRunLog>): string {
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO agent_runs (
      id, userId, task, service, action, risk, status, result, tokenFingerprint, 
      durationMs, mfaTriggered, approvalRequired
    ) VALUES (
      @id, @userId, @task, @service, @action, @risk, @status, @result, @tokenFingerprint, 
      @durationMs, @mfaTriggered, @approvalRequired
    )
  `);

  stmt.run({
    id,
    userId: entry.userId || "anonymous",
    task: entry.task || "unknown",
    service: entry.service || "unknown",
    action: entry.action || "unknown",
    risk: entry.risk || "UNKNOWN",
    status: entry.status || "initiated",
    result: entry.result || null,
    tokenFingerprint: entry.tokenFingerprint || null,
    durationMs: entry.durationMs || 0,
    mfaTriggered: entry.mfaTriggered ? 1 : 0,
    approvalRequired: entry.approvalRequired ? 1 : 0,
  });

  return id;
}

/**
 * Updates a previously established agent log entry. 
 * Allows tracking lifecycle from "pending_approval" to "completed".
 * 
 * @param id - UUID of the log
 * @param updates - A dictionary of column attributes to modify
 */
export function updateAgentRun(id: string, updates: Partial<AgentRunLog>): void {
  const fields = [];
  const queryParams: Record<string, string | number | boolean> = { id };

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = @${key}`);
      queryParams[key] = typeof value === 'boolean' ? (value ? 1 : 0) : value;
    }
  }

  if (fields.length === 0) return;

  const stmt = db.prepare(`
    UPDATE agent_runs
    SET ${fields.join(", ")}
    WHERE id = @id
  `);

  stmt.run(queryParams);
}

interface AgentRunRow extends Omit<AgentRunLog, "mfaTriggered" | "approvalRequired"> {
  mfaTriggered: number;
  approvalRequired: number;
}

/**
 * Looks up an exact agent log tracing.
 * 
 * @param id - UUID string
 * @returns Populated log if found, otherwise null
 */
export function getAgentRun(id: string): AgentRunLog | null {
  const stmt = db.prepare(`SELECT * FROM agent_runs WHERE id = ?`);
  const result = stmt.get(id) as AgentRunRow | undefined;
  if (!result) return null;
  
  return {
    ...result,
    mfaTriggered: Boolean(result.mfaTriggered),
    approvalRequired: Boolean(result.approvalRequired),
  };
}

export function getUserAgentRuns(userId: string): AgentRunLog[] {
  const stmt = db.prepare(`SELECT * FROM agent_runs WHERE userId = ? ORDER BY createdAt DESC`);
  const results = stmt.all(userId) as AgentRunRow[];
  
  return results.map(r => ({
    ...r,
    mfaTriggered: Boolean(r.mfaTriggered),
    approvalRequired: Boolean(r.approvalRequired),
  }));
}

export function getAuditStats(userId: string) {
  const credentialsProtected = (
    db.prepare(`SELECT COUNT(*) as count FROM agent_runs WHERE userId = ? AND tokenFingerprint IS NOT NULL`).get(userId) as { count: number }
  ).count;

  const actionsApproved = (
    db.prepare(`SELECT COUNT(*) as count FROM agent_runs WHERE userId = ? AND approvalRequired = 0 AND status = 'completed'`).get(userId) as { count: number }
  ).count;

  const pendingApproval = (
    db.prepare(`SELECT COUNT(*) as count FROM pending_actions WHERE user_id = ? AND status = 'pending'`).get(userId) as { count: number }
  ).count;

  const mfaTriggers = (
    db.prepare(`SELECT COUNT(*) as count FROM agent_runs WHERE userId = ? AND mfaTriggered = 1`).get(userId) as { count: number }
  ).count;

  const recentActions = db.prepare(`SELECT id, action, risk as decision, status, tokenFingerprint as token_fingerprint, createdAt as timestamp FROM agent_runs WHERE userId = ? ORDER BY createdAt DESC LIMIT 10`).all(userId);

  return { credentialsProtected, actionsApproved, pendingApproval, mfaTriggers, recentActions };
}

export function getPaginatedLogs(
  userId: string,
  limit: number,
  offset: number,
  filters: { action: string | null; status: string | null; decision: string | null }
) {
  const conditions: string[] = ["userId = ?"];
  const params: (string | number)[] = [userId];

  if (filters.action) { conditions.push("action LIKE ?"); params.push(`%${filters.action}%`); }
  if (filters.status) { conditions.push("status = ?"); params.push(filters.status); }
  if (filters.decision) { conditions.push("risk = ?"); params.push(filters.decision); } // mapped decision to risk!

  const where = conditions.join(" AND ");

  const logs = db.prepare(
    `SELECT id, userId as user_id, action, tokenFingerprint as token_fingerprint, service as scopes, risk as decision, status, result as metadata, createdAt as timestamp
     FROM agent_runs WHERE ${where}
     ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  const total = (
    db.prepare(`SELECT COUNT(*) as count FROM agent_runs WHERE ${where}`)
      .get(...params) as { count: number }
  ).count;

  return { logs, total };
}

/* ── pending_actions helpers ─────────────────────────────────── */

export interface PendingAction {
  id: string;
  run_id: string | null;
  user_id: string;
  action_name: string;
  action_data: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export function createPendingAction(entry: {
  id?: string;
  run_id?: string;
  user_id: string;
  action_name: string;
  action_data?: string;
}): string {
  const id = entry.id ?? uuidv4();
  db.prepare(
    `INSERT INTO pending_actions (id, run_id, user_id, action_name, action_data)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    id,
    entry.run_id ?? null,
    entry.user_id,
    entry.action_name,
    entry.action_data ?? null
  );
  return id;
}

export function getPendingActions(userId: string): PendingAction[] {
  return db.prepare(
    `SELECT id, run_id, user_id, action_name, action_data, status, created_at
     FROM pending_actions WHERE user_id = ? AND status = 'pending'
     ORDER BY created_at DESC`
  ).all(userId) as PendingAction[];
}

export function getPendingActionById(id: string, userId: string): PendingAction | null {
  return (db.prepare(
    `SELECT * FROM pending_actions WHERE id = ? AND user_id = ? AND status = 'pending'`
  ).get(id, userId) as PendingAction | undefined) ?? null;
}

export function resolvePendingAction(id: string, resolution: "approved" | "denied"): void {
  db.prepare(
    `UPDATE pending_actions SET status = ?, resolved_at = ? WHERE id = ?`
  ).run(resolution, new Date().toISOString(), id);
}

/* ── audit_logs helpers ──────────────────────────────────────── */

export interface AuditLogRow {
  id: string;
  user_id: string;
  action: string;
  token_fingerprint?: string;
  decision?: string;
  status: string;
  metadata?: string;
  timestamp: string;
}

export function writeAuditLog(entry: Omit<AuditLogRow, "id" | "timestamp"> & { id?: string }): string {
  const id = entry.id ?? uuidv4();
  db.prepare(
    `INSERT INTO audit_logs (id, user_id, action, token_fingerprint, decision, status, metadata, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    entry.user_id,
    entry.action,
    entry.token_fingerprint ?? null,
    entry.decision ?? null,
    entry.status,
    entry.metadata ?? null,
    new Date().toISOString()
  );
  return id;
}

export function getAuditLogById(id: string): AuditLogRow | null {
  return (db.prepare(
    `SELECT id, user_id, action, decision, status, token_fingerprint, metadata, timestamp
     FROM audit_logs WHERE id = ?`
  ).get(id) as AuditLogRow | undefined) ?? null;
}
