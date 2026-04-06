"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface AgentEntry {
  id: string;
  name: string;
  version: string;
  status: "online" | "quarantined" | "offline";
  risk: "low" | "medium" | "critical";
  permissions: string[];
  lastAction: string;
  lastActionType: "ok" | "warn" | "idle";
  actionAt?: string;
}

const DEMO_AGENTS: AgentEntry[] = [
  {
    id: "88-X-90",
    name: "HR-Executive-Proxy",
    version: "V4.2.1",
    status: "online",
    risk: "low",
    permissions: ["READ", "WRITE"],
    lastAction: "Processed 14 candidate reviews for Dept. Eng.",
    lastActionType: "ok",
    actionAt: "2m ago",
  },
  {
    id: "42-K-01",
    name: "Asset-Liquidation-Bot",
    version: "V9.0.0-Beta",
    status: "quarantined",
    risk: "critical",
    permissions: ["DESTRUCTIVE"],
    lastAction: "Unauthorized attempt to purge vault storage #501",
    lastActionType: "warn",
    actionAt: "14m ago",
  },
  {
    id: "12-L-44",
    name: "Legal-Discovery-Agent",
    version: "V3.5.2",
    status: "offline",
    risk: "medium",
    permissions: ["READ"],
    lastAction: "No active heartbeats recorded in last 24h",
    lastActionType: "idle",
    actionAt: "24h ago",
  },
];

// colour configs
const STATUS_CONFIG = {
  online:      { dot: "#4cd7f6", bg: "rgba(76,215,246,0.08)",  border: "rgba(76,215,246,0.2)",   text: "#4cd7f6",  label: "Online"      },
  quarantined: { dot: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)",  text: "#f87171",  label: "Quarantined" },
  offline:     { dot: "#475569", bg: "rgba(71,85,105,0.1)",    border: "rgba(71,85,105,0.25)",   text: "#64748b",  label: "Offline"     },
};

const RISK_COLORS = {
  low:      { color: "#4cd7f6",  bg: "rgba(76,215,246,0.08)",  border: "rgba(76,215,246,0.2)"  },
  medium:   { color: "#a78bfa",  bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" },
  critical: { color: "#f87171",  bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
};

const PERM_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  READ:        { bg: "rgba(76,215,246,0.1)",  color: "#4cd7f6", border: "rgba(76,215,246,0.25)"  },
  WRITE:       { bg: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "rgba(167,139,250,0.25)" },
  DESTRUCTIVE: { bg: "rgba(248,113,113,0.1)", color: "#f87171", border: "rgba(248,113,113,0.25)" },
};

function AgentCard({ agent }: { agent: AgentEntry }) {
  const sc = STATUS_CONFIG[agent.status];
  const rc = RISK_COLORS[agent.risk];

  return (
    <div
      className="card-lift"
      style={{
        background: "rgba(50,53,60,0.45)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 18,
        padding: 28,
        boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* top-right ambient glow */}
      <div
        style={{
          position: "absolute", top: 0, right: 0,
          width: 100, height: 100, borderRadius: "50%",
          background: agent.status === "quarantined"
            ? "rgba(248,113,113,0.06)"
            : agent.status === "online"
            ? "rgba(124,58,237,0.06)"
            : "transparent",
          filter: "blur(40px)", pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${agent.status === "quarantined" ? "rgba(248,113,113,0.25)" : "rgba(255,255,255,0.08)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
              boxShadow: agent.status === "quarantined" ? "0 0 14px rgba(248,113,113,0.2)" : "none",
            }}
          >
            🤖
          </div>
          <div>
            <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 17, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
              {agent.name}
            </h3>
            <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginTop: 3 }}>
              {agent.version} · ID: {agent.id}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
            borderRadius: 99, background: sc.bg, border: `1px solid ${sc.border}`,
          }}
        >
          <div
            style={{
              width: 7, height: 7, borderRadius: "50%", background: sc.dot,
              boxShadow: agent.status === "online"
                ? "0 0 8px rgba(76,215,246,0.8)"
                : agent.status === "quarantined"
                ? "0 0 8px rgba(248,113,113,0.8)"
                : "none",
              animation: agent.status === "online" ? "pulse-green 2.5s infinite" : undefined,
            }}
          />
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: sc.text }}>
            {sc.label}
          </span>
        </div>
      </div>

      {/* Meta grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {/* Risk */}
        <div style={{ padding: "12px 14px", borderRadius: 10, background: rc.bg, border: `1px solid ${rc.border}` }}>
          <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: 4 }}>Risk Profile</p>
          <span style={{ fontSize: 13, fontWeight: 700, color: rc.color, textTransform: "uppercase", fontFamily: "var(--font-syne)" }}>
            {agent.risk} Risk
          </span>
        </div>

        {/* Permissions */}
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: 6 }}>Permissions</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {agent.permissions.map((p) => {
              const pc = PERM_COLORS[p] ?? PERM_COLORS.READ;
              return (
                <span key={p} style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: pc.bg, border: `1px solid ${pc.border}`, color: pc.color, textTransform: "uppercase" }}>{p}</span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Last action */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: 8 }}>Recent Action</p>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            borderRadius: 10, fontSize: 11, lineHeight: 1.4,
            background:
              agent.lastActionType === "warn"
                ? "rgba(248,113,113,0.06)"
                : "rgba(255,255,255,0.02)",
            border:
              agent.lastActionType === "warn"
                ? "1px solid rgba(248,113,113,0.2)"
                : "1px solid rgba(255,255,255,0.04)",
            color: "var(--text-muted)",
          }}
        >
          <span style={{ fontSize: 14, flexShrink: 0 }}>
            {agent.lastActionType === "ok" ? "✅" : agent.lastActionType === "warn" ? "⚠️" : "🕐"}
          </span>
          <span>{agent.lastAction}</span>
          {agent.actionAt && (
            <span style={{ marginLeft: "auto", fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)", flexShrink: 0, paddingLeft: 8 }}>{agent.actionAt}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}>
        {agent.status === "quarantined" ? (
          <button style={{ flex: 1, padding: "9px 0", borderRadius: 10, background: "#f87171", color: "#fff", border: "none", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer" }}>
            Release Hold
          </button>
        ) : agent.status === "offline" ? (
          <button style={{ flex: 1, padding: "9px 0", borderRadius: 10, background: "linear-gradient(135deg, #7C3AED, #a78bfa)", color: "#fff", border: "none", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer", boxShadow: "0 0 18px rgba(124,58,237,0.3)" }}>
            Wake Up
          </button>
        ) : (
          <button style={{ flex: 1, padding: "9px 0", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer" }}>
            Toggle Status
          </button>
        )}
        <Link href="/dashboard/audit" style={{ flex: 1, padding: "9px 0", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
          View Logs
        </Link>
        <button style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
          ⚙
        </button>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<{ action: string; decision: string; timestamp: string }[]>([]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/logs?limit=20");
      if (!res.ok) return;
      const data = await res.json();
      setLogs(data.logs ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchStats();
    const iv = setInterval(fetchStats, 8000);
    return () => clearInterval(iv);
  }, [fetchStats]);

  const activeCount = DEMO_AGENTS.filter((a) => a.status === "online").length;
  const quarantinedCount = DEMO_AGENTS.filter((a) => a.status === "quarantined").length;
  const intercepted = logs.filter((l) => l.decision !== "allow").length;

  const filtered = DEMO_AGENTS.filter(
    (a) => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.id.includes(search)
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 32 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 34, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 2 }}>
              Agent Fleet
            </h1>
            <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)" }}>
              Autonomous Proxy Intelligence Monitoring
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: "rgba(50,53,60,0.6)", border: "1px solid var(--border)", borderRadius: 12 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter agents by name, ID or version..."
                style={{ background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 13, outline: "none", width: 240 }}
              />
            </div>
            <button style={{ padding: "9px 12px", borderRadius: 12, background: "rgba(50,53,60,0.6)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 16 }}>⚡</button>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ──────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Active Agents",    value: activeCount,       sub: "+3 today",   color: "#a78bfa", border: "rgba(167,139,250,0.5)" },
          { label: "Intercepted",      value: intercepted || "1.2k", sub: "Critical actions", color: "#4cd7f6", border: "rgba(76,215,246,0.5)"  },
          { label: "Global Risk Score",value: "0.04",            sub: "/ 1.00 max",  color: "#f87171", border: quarantinedCount > 0 ? "rgba(248,113,113,0.6)" : "rgba(255,255,255,0.08)" },
        ].map((s) => (
          <div
            key={s.label}
            style={{ padding: "22px 24px", background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: `4px solid ${s.border.replace("0.5","0.8").replace("0.08","0.2")}`, borderRadius: 16 }}
          >
            <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: 8 }}>{s.label}</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-syne)", fontSize: 36, fontWeight: 900, color: "var(--text-primary)" }}>{s.value}</span>
              <span style={{ fontSize: 11, color: s.color, fontFamily: "var(--font-mono)" }}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Agent Grid ─────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
        {filtered.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}

        {/* Deploy new agent placeholder */}
        <div
          style={{
            borderRadius: 18, border: "2px dashed rgba(255,255,255,0.08)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "40px 28px", cursor: "pointer", transition: "border-color 0.2s, background 0.2s",
            minHeight: 200,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; e.currentTarget.style.background = "rgba(124,58,237,0.04)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "transparent"; }}
        >
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 14 }}>+</div>
          <p style={{ fontFamily: "var(--font-syne)", fontSize: 16, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>New Proxy Instance</p>
          <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Initialize secure agent container</p>
        </div>
      </div>
    </div>
  );
}
