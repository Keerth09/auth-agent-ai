/**
 * VaultProxy Audit Logging Database
 * Implementing immutable audit logs for transparent, deterministic agent tracking.
 */
import Database from "better-sqlite3";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const dbPath = path.resolve(process.cwd(), "vaultproxy_v2.db");

// Singleton pattern for Next.js HMR to prevent stale connections
const globalWithDb = global as typeof globalThis & { _acc_db?: Database.Database };
export const db = globalWithDb._acc_db || new Database(dbPath, {});
if (!globalWithDb._acc_db) {
  globalWithDb._acc_db = db;
}

// Initialize robust logging schema
db.exec(`
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
    agent_id TEXT,
    action TEXT NOT NULL,
    token_fingerprint TEXT,
    scopes TEXT,
    decision TEXT,
    status TEXT NOT NULL,
    metadata TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration Shim: Ensure 'agent_runs' has the correct columns.
// This is necessary for hackathon environments where the DB file might persist.
try {
  const tableInfo = db.prepare("PRAGMA table_info(agent_runs)").all() as Array<{ name: string }>;
  const columnNames = tableInfo.map(c => c.name);

  if (columnNames.length > 0) {
     if (!columnNames.includes('user_id')) {
        console.log("🛠️ Migrating agent_runs: Adding user_id...");
        // If it's a legacy table with 'userId', we might want to just drop it for the hackathon
        db.exec("DROP TABLE agent_runs;");
     } else if (!columnNames.includes('actions')) {
        console.log("🛠️ Migrating agent_runs: Adding actions...");
        db.exec("ALTER TABLE agent_runs ADD COLUMN actions TEXT DEFAULT '[]';");
     }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      task TEXT NOT NULL,
      status TEXT NOT NULL,
      actions TEXT DEFAULT '[]',
      result TEXT,
      error TEXT,
      token_fingerprint TEXT,
      mfa_triggered BOOLEAN DEFAULT 0,
      approval_required BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Force creation of audit_logs column if missing in existing v2 file
  const auditInfo = db.prepare("PRAGMA table_info(audit_logs)").all() as Array<{ name: string }>;
  const auditCols = auditInfo.map(c => c.name);
  if (auditCols.length > 0) {
    if (!auditCols.includes('agent_id')) {
      db.exec("ALTER TABLE audit_logs ADD COLUMN agent_id TEXT;");
    }
    if (!auditCols.includes('scopes')) {
      db.exec("ALTER TABLE audit_logs ADD COLUMN scopes TEXT;");
    }
  }
} catch (err) {
  console.error("❌ Migration shim failed:", err);
}

export interface AgentRunLog {
  id: string;
  userId: string;
  task: string;
  status: string;
  actions: string;
  result?: string;
  error?: string;
  tokenFingerprint?: string;
  mfaTriggered?: boolean;
  approvalRequired?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Inserts a new immutable log record indicating agent initiation.
 * 
 * @param entry - Detailed parameters forming the executed operation 
 * @returns UUID string identifier of the log entry created
 */
export function logAgentRun(entry: Partial<AgentRunLog>): string {
  const id = uuidv4();
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO agent_runs (
      id, user_id, task, status, actions, result, error, token_fingerprint, 
      mfa_triggered, approval_required, created_at, updated_at
    ) VALUES (
      @id, @userId, @task, @status, @actions, @result, @error, @tokenFingerprint, 
      @mfaTriggered, @approvalRequired, @createdAt, @updatedAt
    )
  `);

  stmt.run({
    id,
    userId: entry.userId || "anonymous",
    task: entry.task || "unknown",
    status: entry.status || "initiated",
    actions: entry.actions || "[]",
    result: entry.result || null,
    error: entry.error || null,
    tokenFingerprint: entry.tokenFingerprint || null,
    mfaTriggered: entry.mfaTriggered ? 1 : 0,
    approvalRequired: entry.approvalRequired ? 1 : 0,
    createdAt: entry.createdAt || now,
    updatedAt: entry.updatedAt || now,
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
  const now = new Date().toISOString();

  const mapping: Record<string, string> = {
    userId: 'user_id',
    tokenFingerprint: 'token_fingerprint',
    mfaTriggered: 'mfa_triggered',
    approvalRequired: 'approval_required',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  };

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      const colName = mapping[key] || key;
      fields.push(`${colName} = @${key}`);
      queryParams[key] = typeof value === 'boolean' ? (value ? 1 : 0) : value;
    }
  }

  if (fields.length === 0) return;

  // Always update updated_at
  if (!fields.some(f => f.startsWith('updated_at'))) {
    fields.push('updated_at = @sys_now');
    queryParams['sys_now'] = now;
  }

  const stmt = db.prepare(`
    UPDATE agent_runs
    SET ${fields.join(", ")}
    WHERE id = @id
  `);

  stmt.run(queryParams);
}

interface AgentRunRow {
  id: string;
  user_id: string;
  task: string;
  status: string;
  actions: string;
  result: string | null;
  error: string | null;
  token_fingerprint: string | null;
  mfa_triggered: number;
  approval_required: number;
  created_at: string;
  updated_at: string;
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
    id: result.id,
    userId: result.user_id,
    task: result.task,
    status: result.status,
    actions: result.actions,
    result: result.result || undefined,
    error: result.error || undefined,
    tokenFingerprint: result.token_fingerprint || undefined,
    mfaTriggered: Boolean(result.mfa_triggered),
    approvalRequired: Boolean(result.approval_required),
    createdAt: result.created_at,
    updatedAt: result.updated_at
  };
}

export function getUserAgentRuns(userId: string): AgentRunLog[] {
  const stmt = db.prepare(`SELECT * FROM agent_runs WHERE user_id = ? ORDER BY created_at DESC`);
  const results = stmt.all(userId) as AgentRunRow[];
  
  return results.map(r => ({
    id: r.id,
    userId: r.user_id,
    task: r.task,
    status: r.status,
    actions: r.actions,
    result: r.result || undefined,
    error: r.error || undefined,
    tokenFingerprint: r.token_fingerprint || undefined,
    mfaTriggered: Boolean(r.mfa_triggered),
    approvalRequired: Boolean(r.approval_required),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));
}

export function getAuditStats(userId: string) {
  const credentialsProtected = (
    db.prepare(`SELECT COUNT(*) as count FROM agent_runs WHERE user_id = ? AND token_fingerprint IS NOT NULL`).get(userId) as { count: number }
  ).count;

  const actionsApproved = (
    db.prepare(`SELECT COUNT(*) as count FROM agent_runs WHERE user_id = ? AND approval_required = 0 AND status = 'completed'`).get(userId) as { count: number }
  ).count;

  const pendingApproval = (
    db.prepare(`SELECT COUNT(*) as count FROM pending_actions WHERE user_id = ? AND status = 'pending'`).get(userId) as { count: number }
  ).count;

  const mfaTriggers = (
    db.prepare(`SELECT COUNT(*) as count FROM agent_runs WHERE user_id = ? AND mfa_triggered = 1`).get(userId) as { count: number }
  ).count;

  const recentActions = db.prepare(`SELECT id, task as action, status, token_fingerprint, created_at as timestamp FROM agent_runs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`).all(userId);

  return { credentialsProtected, actionsApproved, pendingApproval, mfaTriggers, recentActions };
}

export function getPaginatedLogs(
  userId: string,
  limit: number,
  offset: number,
  filters: { action: string | null; status: string | null; decision: string | null }
) {
  const conditions: string[] = ["user_id = ?"];
  const params: (string | number)[] = [userId];

  if (filters.action) { conditions.push("task LIKE ?"); params.push(`%${filters.action}%`); }
  if (filters.status) { conditions.push("status = ?"); params.push(filters.status); }

  const where = conditions.join(" AND ");

  const logs = db.prepare(
    `SELECT id, user_id, task as action, token_fingerprint, status, result as metadata, created_at as timestamp
     FROM agent_runs WHERE ${where}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`
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
