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

const DECISION_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  allow:                { bg: "rgba(16,185,129,0.12)", text: "#34d399",  label: "READ"    },
  require_approval:     { bg: "rgba(245,158,11,0.12)", text: "#fbbf24",  label: "WRITE"   },
  require_step_up_auth: { bg: "rgba(239,68,68,0.12)",  text: "#f87171",  label: "DEST."   },
  deny:                 { bg: "rgba(239,68,68,0.12)",  text: "#f87171",  label: "DENIED"  },
};

const STATUS_COLORS: Record<string, string> = {
  success: "#34d399",
  failed:  "#f87171",
  pending: "#fbbf24",
  revoked: "#94a3b8",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/logs?limit=100");
      if (!res.ok) return;
      const data = await res.json();
      setLogs(data.logs ?? []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const filtered = filter === "all"
    ? logs
    : logs.filter((l) => l.decision === filter);

  const totalCount = logs.length;
  const successCount = logs.filter((l) => l.status === "success").length;
  const pendingCount = logs.filter((l) => l.status === "pending").length;

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: 36, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 36, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 6 }}>
            Audit Logs
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
            Immutable cryptographic action records.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: 99,
            fontSize: 11,
            fontWeight: 700,
            color: "var(--green)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--green)",
              animation: "pulse-green 2s infinite",
            }}
          />
          Live Feed
        </div>
      </header>

      {/* Summary row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Events", value: totalCount, color: "var(--purple-light)" },
          { label: "Successful",   value: successCount, color: "var(--green)" },
          { label: "Pending",      value: pendingCount,  color: "var(--orange)" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: "16px 24px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              flex: 1,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 28, fontFamily: "var(--font-mono)", fontWeight: 700, color: item.color, marginBottom: 4 }}>
              {item.value}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { value: "all", label: "All Events" },
          { value: "allow", label: "READ" },
          { value: "require_approval", label: "WRITE" },
          { value: "require_step_up_auth", label: "Destructive" },
          { value: "deny", label: "Denied" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: "7px 16px",
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "var(--transition)",
              border: filter === f.value ? "1px solid rgba(124,58,237,0.6)" : "1px solid var(--border)",
              background: filter === f.value ? "rgba(124,58,237,0.15)" : "transparent",
              color: filter === f.value ? "var(--purple-light)" : "var(--text-secondary)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        className="section-card"
        style={{ overflow: "hidden", padding: 0 }}
      >
        {loading ? (
          <div style={{ padding: "80px", textAlign: "center" }}>
            <div className="spinner-lg" style={{ margin: "0 auto 16px" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "80px 40px", textAlign: "center", opacity: 0.4 }}>
            <p style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)" }}>
              No events recorded yet
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {["Token Fingerprint", "Action", "Permission", "Status", "Timestamp"].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "14px 20px",
                      textAlign: "left",
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => {
                const dec = DECISION_COLORS[log.decision] ?? {
                  bg: "rgba(255,255,255,0.05)",
                  text: "var(--text-secondary)",
                  label: log.decision.toUpperCase(),
                };
                return (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")
                    }
                  >
                    {/* Fingerprint */}
                    <td style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {log.token_fingerprint
                          ? `…${String(log.token_fingerprint).slice(-4)}`
                          : "—"}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: "14px 20px", maxWidth: 280 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Decision badge */}
                    <td style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: 99,
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          background: dec.bg,
                          color: dec.text,
                        }}
                      >
                        {dec.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: STATUS_COLORS[log.status] ?? "var(--text-secondary)",
                        }}
                      >
                        {log.status}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          color: "var(--text-muted)",
                        }}
                      >
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Immutability note */}
      <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
        🔒 All entries are write-once. Deletion is not permitted. This log is your full audit trail.
      </p>
    </div>
  );
}
