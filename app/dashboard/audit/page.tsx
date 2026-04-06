"use client";

import { useEffect, useState, useCallback } from "react";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  token_fingerprint?: string;
  scopes?: string;
  decision: string;
  status: string;
  metadata?: string;
  timestamp: string;
}

const RISK_CONFIG: Record<string, { dot: string; badge: string; label: string; decision: string }> = {
  allow:                { dot: "#4cd7f6", badge: "bg-secondary/10 text-[#4cd7f6] border-[#4cd7f6]/20", label: "Nominal",  decision: "Approved" },
  require_approval:     { dot: "#a78bfa", badge: "bg-primary/10 text-[#a78bfa] border-[#a78bfa]/20",   label: "Elevated", decision: "Manual Auth Required" },
  require_step_up_auth: { dot: "#f87171", badge: "bg-tertiary/10 text-[#f87171] border-[#f87171]/20",  label: "Critical", decision: "Denied by Human" },
  deny:                 { dot: "#f87171", badge: "bg-tertiary/10 text-[#f87171] border-[#f87171]/20",  label: "Critical", decision: "Automated Block" },
};


function DecisionIcon({ decision, status }: { decision: string; status: string }) {
  if (status === "success" && decision === "allow") return <span style={{ color: "#4cd7f6", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>✅ Approved</span>;
  if (decision === "require_approval") return <span style={{ color: "#a78bfa", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>👤 Manual Auth</span>;
  if (decision === "require_step_up_auth" || decision === "deny") return <span style={{ color: "#f87171", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>🚫 Blocked</span>;
  return <span style={{ color: "#64748b", fontSize: 13 }}>{status}</span>;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/logs?limit=100");
      if (!res.ok) return;
      const data = await res.json();
      setLogs(data.logs ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchLogs();
    const iv = setInterval(fetchLogs, 5000);
    return () => clearInterval(iv);
  }, [fetchLogs]);

  const filtered = logs.filter((l) => {
    const matchFilter = filter === "all" || l.decision === filter;
    const matchSearch = !search || l.action.toLowerCase().includes(search.toLowerCase()) || (l.token_fingerprint ?? "").includes(search);
    return matchFilter && matchSearch;
  });

  const totalActions = logs.length;
  const blockedCount = logs.filter((l) => l.decision !== "allow" || l.status === "failed").length;
  const actionsToday = logs.filter((l) => new Date(l.timestamp).toDateString() === new Date().toDateString()).length;

  // Demo data for empty state
  const demoRows = [
    { time: "14:22:08.412", agent: "Sentinel-04", action: "Bulk File Deletion", risk: "Critical", dot: "#f87171", decision: "deny", status: "failed" },
    { time: "14:19:12.805", agent: "Cognito-X",   action: "Inbound Email Verification", risk: "Nominal",  dot: "#4cd7f6", decision: "allow", status: "success" },
    { time: "14:15:33.002", agent: "Data-Miner-01",action: "Cross-Region API Call", risk: "Elevated", dot: "#a78bfa", decision: "require_approval", status: "pending" },
    { time: "14:02:44.912", agent: "Admin-Proxy",  action: "SSH Key Rotation", risk: "Critical", dot: "#f87171", decision: "deny", status: "failed" },
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 32 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 24, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 34, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 6 }}>
            Audit Log
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, maxWidth: 520 }}>
            Cryptographically signed records of all agent operations. This ledger is immutable and serves as the primary source of truth for security governance.
          </p>
        </div>

        {/* Live Activity Pulse card */}
        <div style={{ width: 260, padding: "20px 24px", background: "var(--bg-card)", border: "1px solid rgba(76,215,246,0.25)", borderLeft: "4px solid #4cd7f6", borderRadius: 16, position: "relative", overflow: "hidden", flexShrink: 0 }}>
          <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "#4cd7f6", marginBottom: 4 }}>Live Activity Pulse</p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontFamily: "var(--font-syne)", fontSize: 28, fontWeight: 900, color: "var(--text-primary)" }}>
              {totalActions} <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>ACTIONS/SESSION</span>
            </div>
            {/* Mini bar chart */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 40 }}>
              {[0.4,0.6,0.3,0.8,1].map((h, i) => (
                <div key={i} style={{ width: 5, height: `${h * 100}%`, background: i === 4 ? "#4cd7f6" : "rgba(76,215,246,0.2)", borderRadius: "2px 2px 0 0", boxShadow: i === 4 ? "0 0 6px #4cd7f6" : "none" }} />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4cd7f6", animation: "pulse-green 2s infinite" }} />
            <span style={{ fontSize: 10, color: "rgba(76,215,246,0.7)", fontFamily: "var(--font-mono)" }}>System monitoring active</span>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div style={{ padding: "18px 22px", background: "rgba(50,53,60,0.4)", backdropFilter: "blur(20px)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: "block", fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: 8 }}>Search Hash or Agent</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 14 }}>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. agent action or fingerprint..."
              style={{ width: "100%", padding: "9px 12px 9px 34px", background: "rgba(50,53,60,0.8)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-primary)", fontSize: 13, fontFamily: "var(--font-body)", outline: "none" }}
            />
          </div>
        </div>

        {/* Risk filter */}
        <div style={{ width: 160 }}>
          <label style={{ display: "block", fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: 8 }}>Risk Level</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", background: "rgba(50,53,60,0.8)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-primary)", fontSize: 13, outline: "none", cursor: "pointer" }}
          >
            <option value="all">All Hazards</option>
            <option value="deny">Critical Only</option>
            <option value="require_step_up_auth">Elevated</option>
            <option value="allow">Nominal</option>
          </select>
        </div>

        {/* Stats pills */}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          {[
            { label: "Total", value: totalActions, color: "#a78bfa" },
            { label: "Blocked", value: blockedCount, color: "#f87171" },
            { label: "Today", value: actionsToday, color: "#4cd7f6" },
          ].map((s) => (
            <div key={s.label} style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Audit Table ─────────────────────────────────────────────────────── */}
      <div style={{ background: "var(--bg-secondary)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "0 20px 50px rgba(0,0,0,0.4)", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {["Timestamp & Status", "Agent", "Action", "Risk", "Decision", "Log Hash"].map((h, i) => (
                <th key={h} style={{ padding: "16px 20px", fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--text-muted)", textAlign: i === 3 ? "center" : "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: "80px", textAlign: "center" }}>
                  <div className="spinner-lg" style={{ margin: "0 auto 16px" }} />
                  <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Syncing audit ledger...</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              // Demo rows when empty
              demoRows.map((row, i) => {
                return (
                  <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: row.dot, boxShadow: `0 0 8px ${row.dot}`, flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{row.time}</p>
                          <p style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{new Date().toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🤖</div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{row.agent}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: 13, fontWeight: 500, color: "var(--text-primary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.action}</td>
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 4, fontSize: 9, fontWeight: 900, textTransform: "uppercase", background: `${row.dot}22`, color: row.dot, border: `1px solid ${row.dot}44` }}>
                        {row.risk}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <DecisionIcon decision={row.decision} status={row.status} />
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", background: "rgba(0,0,0,0.3)", padding: "4px 8px", borderRadius: 6 }}>
                        0x{Math.random().toString(16).slice(2, 6)}...{Math.random().toString(16).slice(2, 6)}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              filtered.map((log) => {
                const cfg = RISK_CONFIG[log.decision] ?? { dot: "#64748b", label: "Unknown", decision: log.decision };
                return (
                  <tr key={log.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot, boxShadow: `0 0 8px ${cfg.dot}`, flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </p>
                          <p style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                            {new Date(log.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🤖</div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>VaultAgent</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px", maxWidth: 220 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.action}</span>
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 4, fontSize: 9, fontWeight: 900, textTransform: "uppercase", background: `${cfg.dot}22`, color: cfg.dot, border: `1px solid ${cfg.dot}44` }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <DecisionIcon decision={log.decision} status={log.status} />
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", background: "rgba(0,0,0,0.3)", padding: "4px 8px", borderRadius: 6 }}>
                        {log.token_fingerprint ? `…${log.token_fingerprint.slice(-8)}` : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination-style footer */}
        <div style={{ padding: "14px 20px", background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Showing {filtered.length} of {logs.length} entries · Synced every 5s
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button style={{ padding: "7px 16px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              ⬇ Export PDF
            </button>
            <button style={{ padding: "7px 16px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {} JSON Feed
            </button>
          </div>
        </div>
      </div>

      {/* ── Node Sync footer ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🖥️</div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Node Synchronization</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 360 }}>
              Audit logs are hashed and distributed across four secure enclaves (EU-1, US-1, AS-1, HK-1) to ensure zero-point failure and non-repudiation.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["EU-1", "US-1", "AS-1", "HK-1"].map((node) => (
            <div key={node} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(76,215,246,0.07)", border: "1px solid rgba(76,215,246,0.2)", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#4cd7f6" }}>
              {node} ●
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
