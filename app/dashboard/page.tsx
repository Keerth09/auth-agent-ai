"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

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
  agent_id?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span className="tabular-nums">{display.toLocaleString()}</span>;
}

function riskColor(decision: string) {
  if (decision === "allow") return { bg: "log-read", badge: "badge-read", label: "READ", dot: "dot-ok", status: "AUTO-APPROVED" };
  if (decision === "require_approval") return { bg: "log-write", badge: "badge-write", label: "WRITE", dot: "dot-live", status: "PENDING APPROVAL" };
  return { bg: "log-dest", badge: "badge-destructive", label: "DESTRUCTIVE", dot: "dot-live", status: "INTERCEPTED" };
}

// ── Main Component ───────────────────────────────────────────────────────────

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
        fetch("/api/logs?limit=8"),
      ]);
      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        setStats(await statsRes.value.json());
      }
      if (logsRes.status === "fulfilled" && logsRes.value.ok) {
        const data = await logsRes.value.json();
        setLogs(data.logs ?? []);
      }
    } catch { /* ignore */ }
    finally { setLoadingStats(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // The most recent DESTRUCTIVE / pending log becomes the "intercepted" hero
  const interceptedLog =
    logs.find((l) => l.decision === "require_step_up_auth" && l.status === "pending") ??
    logs.find((l) => l.decision === "require_approval" && l.status === "pending") ??
    null;

  const recentLogs = logs.slice(0, 6);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 32 }}>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <header style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--font-syne)",
            fontSize: 30,
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            marginBottom: 4,
          }}
        >
          AI Agent Control Center
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
          Zero-Trust Runtime · All agent actions intercepted · Human approval enforced
        </p>
      </header>

      {/* ── Stat Bar ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 28,
        }}
      >
        {[
          { label: "Credentials Protected", value: stats.credentialsProtected, color: "#a78bfa", border: "rgba(124,58,237,0.45)" },
          { label: "Actions Approved",      value: stats.actionsApproved,      color: "#34d399", border: "rgba(16,185,129,0.45)" },
          { label: "Pending Approval",      value: stats.pendingApproval,      color: "#fbbf24", border: stats.pendingApproval > 0 ? "rgba(245,158,11,0.6)" : "rgba(255,255,255,0.07)" },
          { label: "MFA Triggers",          value: stats.mfaTriggers,          color: "#f87171", border: "rgba(239,68,68,0.4)" },
        ].map((c, i) => (
          <div
            key={c.label}
            className="stat-card animate-slide-up"
            style={{ animationDelay: `${i * 60}ms`, borderLeftWidth: 3, borderLeftStyle: "solid", borderLeftColor: c.border, padding: 20 }}
          >
            <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: 10, fontFamily: "var(--font-mono)" }}>
              {c.label}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700, color: c.color, opacity: loadingStats ? 0.4 : 1, transition: "opacity 0.3s" }}>
              {loadingStats ? "—" : <AnimatedNumber value={c.value} />}
            </div>
          </div>
        ))}
      </div>

      {/* ── 3-Column Grid ─────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 280px", gap: 18, alignItems: "start" }}>

        {/* ── LEFT: Live Action Feed ─────────────────────────────────────── */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 2px" }}>
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              Live Action Feed
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div className="dot-live" />
              <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "#f87171" }}>LIVE</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 640, overflowY: "auto" }}>
            {recentLogs.length === 0 && (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  background: "var(--bg-card)",
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                }}
              >
                No activity yet
                <br />
                <Link href="/dashboard/run" style={{ color: "var(--purple-light)", marginTop: 8, display: "block" }}>
                  Run an agent task →
                </Link>
              </div>
            )}

            {recentLogs.map((log, i) => {
              const risk = riskColor(log.decision);
              return (
                <div
                  key={log.id}
                  className={`${risk.bg} card-lift animate-slide-up`}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 14,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    animationDelay: `${i * 50}ms`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <span className={risk.badge}>{risk.label}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.4, marginBottom: 8 }}>
                    {log.action}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className={risk.dot} />
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: "var(--font-mono)",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        color:
                          log.decision === "allow" ? "#34d399"
                          : log.decision === "require_approval" ? "#fbbf24"
                          : "#f87171",
                      }}
                    >
                      {risk.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Risk Legend */}
          <div
            style={{
              marginTop: 12,
              padding: "14px 16px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
            }}
          >
            <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--text-muted)", marginBottom: 10 }}>
              Risk Legend
            </p>
            {[
              { cls: "dot-ok",   label: "READ — Auto-approved, no risk" },
              { cls: "dot-live", label: "WRITE — Human approval required" },
              { cls: "dot-live", label: "DESTRUCTIVE — Biometric + PIN gate" },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 2 ? 8 : 0 }}>
                <div className={r.cls} style={{ background: i === 0 ? "#10b981" : i === 1 ? "#f59e0b" : "#ef4444" }} />
                <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{r.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── CENTER: Security Gate ─────────────────────────────────────── */}
        <section>
          {interceptedLog ? (
            /* Real intercepted action */
            <div style={{ position: "relative" }}>
              <div className="gate-glow-bg" />
              <div className="security-gate security-gate-animated">
                <div className="scanline-overlay" style={{ position: "absolute", inset: 0, zIndex: 1, borderRadius: 20 }} />

                {/* Gate Header */}
                <div
                  style={{
                    position: "relative", zIndex: 2,
                    padding: "22px 26px 18px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    background: "linear-gradient(to right, rgba(239,68,68,0.07), rgba(124,58,237,0.05))",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      {/* Alert icon */}
                      <div
                        style={{
                          width: 46, height: 46, borderRadius: 13,
                          background: "rgba(239,68,68,0.15)",
                          border: "1px solid rgba(239,68,68,0.35)",
                          boxShadow: "0 0 24px rgba(239,68,68,0.3)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 20, flexShrink: 0, position: "relative",
                        }}
                      >
                        ⚡
                        <div
                          style={{
                            position: "absolute", top: -4, right: -4,
                            width: 14, height: 14, borderRadius: "50%",
                            background: "#ef4444", border: "2px solid #0a0a0f",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 7, fontWeight: 900, color: "#fff",
                          }}
                        >!</div>
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                            Security Gate
                          </h2>
                          <span className="badge-destructive">INTERCEPTED</span>
                        </div>
                        <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#64748b" }}>
                          Action paused · Waiting for your decision
                        </p>
                      </div>
                    </div>
                    {/* Confidence ring */}
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="4"/>
                        <circle cx="30" cy="30" r="24" fill="none" stroke="#ef4444" strokeWidth="4"
                          strokeDasharray="150.8" strokeDashoffset="15"
                          strokeLinecap="round"
                          style={{ filter: "drop-shadow(0 0 5px rgba(239,68,68,0.7))" }}
                        />
                      </svg>
                      <div style={{ marginTop: -44, fontSize: 13, fontWeight: 800, color: "#f87171", fontFamily: "var(--font-syne)", textAlign: "center" }}>
                        92%
                      </div>
                      <p style={{ fontSize: 8, fontFamily: "var(--font-mono)", color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 18 }}>
                        Confidence
                      </p>
                    </div>
                  </div>
                  {/* Risk + target pills */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <span className="badge-destructive" style={{ padding: "5px 12px", fontSize: 10 }}>
                      🚨 Risk: DESTRUCTIVE
                    </span>
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#64748b", padding: "5px 12px", borderRadius: 99, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      🕐 {new Date(interceptedLog.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Gate Body */}
                <div style={{ position: "relative", zIndex: 2, padding: "20px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Action */}
                  <div>
                    <label style={{ display: "block", fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "#475569", marginBottom: 8 }}>
                      Action Intent
                    </label>
                    <div
                      style={{
                        padding: "14px 16px", borderRadius: 12,
                        background: "rgba(239,68,68,0.04)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5,
                      }}
                    >
                      {interceptedLog.action}
                    </div>
                  </div>

                  {/* Why required */}
                  <div
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "14px 16px", borderRadius: 12,
                      background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#fca5a5", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Why is approval required?
                      </p>
                      <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                        This action is classified <strong style={{ color: "#f87171" }}>DESTRUCTIVE</strong>. It is irreversible once executed and requires biometric + PIN step-up verification before the agent proceeds.
                      </p>
                    </div>
                  </div>

                  {/* Token info */}
                  <div
                    style={{
                      padding: "10px 16px", borderRadius: 12,
                      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      fontSize: 10, fontFamily: "var(--font-mono)", color: "#475569",
                    }}
                  >
                    <span>Auth: RSA-4096-PSS</span>
                    <span>Run: {interceptedLog.id.slice(0, 8)}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div className="dot-ok" />
                      <span>AI Context Locked</span>
                    </div>
                  </div>
                </div>

                {/* Decision Buttons */}
                <div style={{ position: "relative", zIndex: 2, padding: "0 26px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Link
                    href="/dashboard/approvals"
                    className="btn-approve-premium"
                    style={{ textDecoration: "none" }}
                  >
                    ✅ Approve &amp; Execute
                  </Link>
                  <Link
                    href="/dashboard/approvals"
                    className="btn-deny-premium"
                    style={{ textDecoration: "none" }}
                  >
                    🚫 Deny &amp; Quarantine
                  </Link>
                </div>

                {/* Footer */}
                <div
                  style={{
                    position: "relative", zIndex: 2,
                    padding: "10px 26px",
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                    background: "rgba(0,0,0,0.25)",
                    textAlign: "center",
                    fontSize: 9, fontFamily: "var(--font-mono)", color: "#334155",
                  }}
                >
                  Clicking Approve will trigger biometric + PIN verification · Token is JIT-scoped and auto-expires
                </div>
              </div>

              {/* Execution chain strip */}
              <div
                style={{
                  marginTop: 12, padding: "12px 18px",
                  background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)" }}>
                  Execution Chain
                </span>
                <div className="exec-chain">
                  <span className="exec-step">CLASSIFY</span>
                  <span className="exec-arrow">→</span>
                  <span className="exec-step">INTERCEPT</span>
                  <span className="exec-arrow">→</span>
                  <span className="exec-step-active">AWAIT HUMAN</span>
                  <span className="exec-arrow">→</span>
                  <span className="exec-step-pending">AUTH GATE</span>
                  <span className="exec-arrow">→</span>
                  <span className="exec-step-pending">EXECUTE</span>
                </div>
              </div>
            </div>
          ) : (
            /* No active interception — show system status */
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: 36,
                textAlign: "center",
                minHeight: 420,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 18,
              }}
            >
              <div
                style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  boxShadow: "0 0 32px rgba(16,185,129,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28,
                }}
              >🛡️</div>
              <div>
                <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 22, fontWeight: 800, color: "#34d399", marginBottom: 6 }}>
                  System Secure
                </h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, fontFamily: "var(--font-mono)" }}>
                  No intercepted actions · All agents operating within policy
                </p>
              </div>

              {/* Mini stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 320 }}>
                <div
                  style={{
                    padding: "14px 16px", borderRadius: 12,
                    background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 22, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#34d399" }}>
                    <AnimatedNumber value={stats.actionsApproved} />
                  </div>
                  <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", textTransform: "uppercase", color: "#475569", marginTop: 4 }}>
                    Approved
                  </div>
                </div>
                <div
                  style={{
                    padding: "14px 16px", borderRadius: 12,
                    background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 22, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#a78bfa" }}>
                    <AnimatedNumber value={stats.credentialsProtected} />
                  </div>
                  <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", textTransform: "uppercase", color: "#475569", marginTop: 4 }}>
                    Protected
                  </div>
                </div>
              </div>

              <Link
                href="/dashboard/run"
                className="btn-primary"
                style={{ textDecoration: "none", marginTop: 4 }}
              >
                ⚡ Run Agent Task
              </Link>
            </div>
          )}
        </section>

        {/* ── RIGHT: Audit Timeline + Quick Actions ─────────────────────── */}
        <section>
          {/* Audit Timeline */}
          <div style={{ marginBottom: 12, padding: "0 2px" }}>
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              Audit Timeline
            </span>
          </div>

          <div className="timeline-wrap" style={{ marginBottom: 18 }}>
            {logs.slice(0, 5).map((log, i) => {
              const risk = riskColor(log.decision);
              const dotColor = log.decision === "allow" ? "#10b981" : log.decision === "require_approval" ? "#f59e0b" : "#ef4444";
              const dotGlow = log.decision === "allow" ? "0 0 8px rgba(16,185,129,0.7)" : log.decision === "require_approval" ? "0 0 8px rgba(245,158,11,0.7)" : "0 0 8px rgba(239,68,68,0.7)";

              return (
                <div
                  key={log.id}
                  className="animate-slide-up"
                  style={{
                    position: "relative", paddingLeft: 28, marginBottom: i < 4 ? 16 : 0,
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute", left: 0, top: 4,
                      width: 14, height: 14, borderRadius: "50%",
                      background: dotColor,
                      border: "2px solid var(--bg-primary)",
                      boxShadow: dotGlow,
                      zIndex: 1,
                    }}
                  />
                  <div
                    className="card-lift"
                    style={{
                      padding: "12px 14px", borderRadius: 12,
                      background: "var(--bg-card)", border: "1px solid var(--border)",
                    }}
                  >
                    <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: 4 }}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6, lineHeight: 1.3 }}>
                      {log.action.length > 50 ? log.action.slice(0, 50) + "…" : log.action}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className={risk.badge} style={{ fontSize: 8 }}>{risk.label}</span>
                      <span
                        style={{
                          fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, textTransform: "uppercase",
                          color: log.status === "success" ? "#34d399" : log.status === "pending" ? "#fbbf24" : "#f87171",
                        }}
                      >
                        {log.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {logs.length === 0 && (
              <div style={{ paddingLeft: 28, padding: "20px 0", color: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                No audit events yet
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/dashboard/run" style={{ textDecoration: "none" }}>
              <div
                className="card-lift"
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", borderRadius: 12,
                  background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
                  color: "#a78bfa",
                }}
              >
                <span style={{ fontSize: 18 }}>⚡</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text-primary)" }}>Run Agent Task</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>Execute through VaultProxy</div>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/approvals" style={{ textDecoration: "none" }}>
              <div
                className="card-lift"
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", borderRadius: 12,
                  background: stats.pendingApproval > 0 ? "rgba(245,158,11,0.08)" : "var(--bg-card)",
                  border: stats.pendingApproval > 0 ? "1px solid rgba(245,158,11,0.3)" : "1px solid var(--border)",
                  color: "#fbbf24",
                  position: "relative",
                }}
              >
                <span style={{ fontSize: 18 }}>⏸️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text-primary)" }}>Review Approvals</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                    {stats.pendingApproval > 0 ? `${stats.pendingApproval} action(s) waiting` : "No pending approvals"}
                  </div>
                </div>
                {stats.pendingApproval > 0 && (
                  <span
                    style={{
                      padding: "2px 8px", borderRadius: 99,
                      background: "#ef4444", color: "#fff",
                      fontSize: 10, fontWeight: 800,
                    }}
                  >
                    {stats.pendingApproval}
                  </span>
                )}
              </div>
            </Link>
            <Link href="/dashboard/audit" style={{ textDecoration: "none" }}>
              <div
                className="card-lift"
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", borderRadius: 12,
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: 18 }}>📋</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text-primary)" }}>Full Audit Log</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>All agent interactions</div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
