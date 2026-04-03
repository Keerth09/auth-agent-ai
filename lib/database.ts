/**
 * database.ts — Core SQLite Infrastructure
 *
 * Security decision: Using better-sqlite3 (synchronous, no async footguns).
 * All sensitive data (tokens) is NEVER stored — only masked fingerprints.
 * Schema is versioned via user_version pragma for future migrations.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || './main.db';

// Ensure data directory exists for file-based DB
if (DB_PATH !== ':memory:') {
  const dir = path.dirname(path.resolve(DB_PATH));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export const db: InstanceType<typeof Database> = new Database(DB_PATH);

// Enable WAL mode for better concurrency (no-op for :memory:)
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Initialize all tables. Called once at startup.
 * Using IF NOT EXISTS — idempotent and safe to re-run.
 */
export function initDatabase(): void {
  db.exec(`
    -- ── Agent Runs ──────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS agent_runs (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      task        TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
        -- pending | running | waiting_approval | completed | failed
      actions     TEXT NOT NULL DEFAULT '[]', -- JSON array of AgentAction
      result      TEXT,                        -- JSON result payload
      error       TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ── Pending Actions (Human-in-the-Loop) ─────────────────────
    CREATE TABLE IF NOT EXISTS pending_actions (
      id          TEXT PRIMARY KEY,
      run_id      TEXT NOT NULL REFERENCES agent_runs(id),
      user_id     TEXT NOT NULL,
      action_name TEXT NOT NULL,
      action_data TEXT NOT NULL DEFAULT '{}', -- JSON
      status      TEXT NOT NULL DEFAULT 'pending',
        -- pending | approved | denied
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT
    );

    -- ── Audit Logs ───────────────────────────────────────────────
    -- SECURITY: token_fingerprint stores only first/last 4 chars of token
    -- so tokens are never persisted in plaintext.
    CREATE TABLE IF NOT EXISTS audit_logs (
      id               TEXT PRIMARY KEY,
      user_id          TEXT NOT NULL,
      agent_id         TEXT,
      action           TEXT NOT NULL,
      token_fingerprint TEXT,               -- e.g. "ya29...XXXX"
      scopes           TEXT,               -- space-separated
      decision         TEXT NOT NULL,      -- allow|deny|require_approval|require_step_up_auth
      status           TEXT NOT NULL,      -- success|failed|pending|revoked
      metadata         TEXT DEFAULT '{}',  -- JSON extra context
      timestamp        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ── Revoked Grants (local tracking) ─────────────────────────
    -- Auth0 is the source of truth; this table tracks which connections
    -- have been revoked through this system for faster UI feedback.
    CREATE TABLE IF NOT EXISTS revoked_grants (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      connection  TEXT NOT NULL,
      grant_id    TEXT,
      revoked_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, connection)
    );

    CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_action  ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_status  ON audit_logs(status);
    CREATE INDEX IF NOT EXISTS idx_audit_time    ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_pending_user  ON pending_actions(user_id);
    CREATE INDEX IF NOT EXISTS idx_runs_user     ON agent_runs(user_id);
  `);

  console.log(`[DB] Initialized — ${DB_PATH === ':memory:' ? 'in-memory' : DB_PATH}`);
}

// Ensure the database is initialized immediately on first import
initDatabase();
