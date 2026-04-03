"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AttackToggle from "@/components/AttackToggle";

interface Stats {
  credentialsProtected: number;
  actionsApproved: number;
  pendingApproval: number;
  mfaTriggers: number;
}

interface AuditLog {
  id: string;
  action: string;
  decision: string;
  status: string;
  timestamp: string;
  token_fingerprint?: string;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  return <span className="tabular-nums">{display.toLocaleString()}</span>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    credentialsProtected: 0,
    actionsApproved: 0,
    pendingApproval: 0,
    mfaTriggers: 0,
  });
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, logsRes] = await Promise.allSettled([
        fetch("/api/audit/stats"),
        fetch("/api/logs?limit=5"),
      ]);
      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const data = await statsRes.value.json();
        setStats(data);
      }
      if (logsRes.status === "fulfilled" && logsRes.value.ok) {
        const data = await logsRes.value.json();
        setLogs(data.logs ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const statCards = [
    {
      label: "Credentials Protected",
      value: stats.credentialsProtected,
      icon: "🔐",
      color: "#a78bfa",
      borderColor: "rgba(124,58,237,0.5)",
    },
    {
      label: "Actions Approved",
      value: stats.actionsApproved,
      icon: "✅",
      color: "#34d399",
      borderColor: "rgba(16,185,129,0.5)",
    },
    {
      label: "Pending Approval",
      value: stats.pendingApproval,
      icon: "⏸️",
      color: "#fbbf24",
      borderColor:
        stats.pendingApproval > 0
          ? "rgba(245,158,11,0.6)"
          : "rgba(255,255,255,0.08)",
    },
    {
      label: "MFA Triggers",
      value: stats.mfaTriggers,
      icon: "🔑",
      color: "#f87171",
      borderColor: "rgba(239,68,68,0.4)",
    },
  ];

  const getRiskBadge = (decision: string) => {
    if (decision === "allow")
      return (
        <span className="chip-read" style={{ fontSize: 10 }}>
          READ
        </span>
      );
    if (decision === "require_approval")
      return (
        <span className="chip-write" style={{ fontSize: 10 }}>
          WRITE
        </span>
      );
    if (decision === "require_step_up_auth")
      return (
        <span className="chip-destructive" style={{ fontSize: 10 }}>
          DEST.
        </span>
      );
    return (
      <span className="chip-read" style={{ fontSize: 10 }}>
        {decision}
      </span>
    );
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: 40 }}>
        <h1
          style={{
            fontFamily: "var(--font-syne)",
            fontSize: 36,
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            marginBottom: 6,
          }}
        >
          Security Overview
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
          Real-time activity across all agent interactions.
        </p>
      </header>

      {/* ── ROW 1: Stat Cards ──────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 20,
          marginBottom: 40,
        }}
      >
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="stat-card animate-slide-up"
            style={{
              animationDelay: `${i * 80}ms`,
              borderLeftWidth: 3,
              borderLeftStyle: "solid",
              borderLeftColor: card.borderColor,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 18 }}>{card.icon}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "var(--text-muted)",
                }}
              >
                {card.label}
              </span>
            </div>
            <div
              className="stat-value"
              style={{
                color: card.color,
                fontSize: loadingStats ? 28 : 32,
                opacity: loadingStats ? 0.5 : 1,
                transition: "opacity 0.3s",
              }}
            >
              {loadingStats ? "—" : <AnimatedNumber value={card.value} />}
            </div>
          </div>
        ))}
      </div>

      {/* ── ROW 2: Recent Activity + Quick Actions ─────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 24,
          marginBottom: 32,
        }}
      >
        {/* Recent Activity */}
        <div className="section-card" style={{ padding: 28 }}>
          <h2
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Recent Agent Activity
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--green)",
                boxShadow: "0 0 8px rgba(16,185,129,0.8)",
                animation: "pulse-green 2s infinite",
              }}
            />
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {logs.length === 0 && (
              <p
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "var(--text-muted)",
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                No activity yet — run an agent task to start
              </p>
            )}
            {logs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {log.action}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                      marginTop: 2,
                    }}
                  >
                    {new Date(log.timestamp).toLocaleTimeString()}
                    {log.token_fingerprint && (
                      <span style={{ marginLeft: 8 }}>
                        · Token: ...{log.token_fingerprint.slice(-4)}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {getRiskBadge(log.decision)}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color:
                        log.status === "success"
                          ? "var(--green)"
                          : log.status === "pending"
                          ? "var(--orange)"
                          : "var(--red)",
                    }}
                  >
                    {log.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section-card" style={{ padding: 28 }}>
          <h2
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 20,
            }}
          >
            Quick Actions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Link
              href="/dashboard/run"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "18px 20px",
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.3)",
                borderRadius: 14,
                textDecoration: "none",
                transition: "var(--transition)",
                color: "var(--purple-light)",
              }}
            >
              <span style={{ fontSize: 22 }}>⚡</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  Run New Agent Task
                </div>
                <div
                  style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}
                >
                  Execute a new task through VaultProxy
                </div>
              </div>
            </Link>
            <Link
              href="/dashboard/approvals"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "18px 20px",
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: 14,
                textDecoration: "none",
                transition: "var(--transition)",
                color: "#fbbf24",
                position: "relative",
              }}
            >
              <span style={{ fontSize: 22 }}>⏸️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  Review Approvals
                </div>
                <div
                  style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}
                >
                  {stats.pendingApproval > 0
                    ? `${stats.pendingApproval} action(s) awaiting your decision`
                    : "No pending approvals"}
                </div>
              </div>
              {stats.pendingApproval > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 16,
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 99,
                  }}
                >
                  {stats.pendingApproval}
                </span>
              )}
            </Link>
            <Link
              href="/dashboard/vault"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "18px 20px",
                background: "rgba(16,185,129,0.07)",
                border: "1px solid rgba(16,185,129,0.22)",
                borderRadius: 14,
                textDecoration: "none",
                transition: "var(--transition)",
                color: "#34d399",
              }}
            >
              <span style={{ fontSize: 22 }}>🔐</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  Manage Vault
                </div>
                <div
                  style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}
                >
                  View and revoke Auth0 Token Vault connections
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Attack Toggle ──────────────────────────────────── */}
      <AttackToggle />
    </div>
  );
}
