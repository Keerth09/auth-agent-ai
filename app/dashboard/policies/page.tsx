"use client";

import { useState } from "react";

interface PolicyRule {
  id: string;
  name: string;
  policyId: string;
  scope: string;
  action: "block" | "mfa" | "rotate" | "approve";
  icon: string;
  color: string;
  code: { file: string; lines: string[] };
  enabled: boolean;
}

const INITIAL_POLICIES: PolicyRule[] = [
  {
    id: "1",
    name: "No Bulk Data Exports",
    policyId: "POL-DX-0922",
    scope: "All Agents",
    action: "block",
    icon: "🔒",
    color: "#f87171",
    code: {
      file: "policy_v1.json",
      lines: [
        "if (request.size > 50MB) {",
        '  action = DENY;',
        '  audit.log("BULK_XFER");',
        "}",
      ],
    },
    enabled: true,
  },
  {
    id: "2",
    name: "Human Verification for HR Records",
    policyId: "POL-SEC-HR44",
    scope: "HR_Sync_Bot",
    action: "mfa",
    icon: "🛡️",
    color: "#a78bfa",
    code: {
      file: "hr_gatekeeper.json",
      lines: [
        "on (access.hr_db) {",
        "  require(MFA_Duo);",
        "  timeout = 300s;",
        "}",
      ],
    },
    enabled: true,
  },
  {
    id: "3",
    name: "JIT Token Rotation (15 mins)",
    policyId: "POL-AUTH-JIT8",
    scope: "Global Auth",
    action: "rotate",
    icon: "⏱️",
    color: "#4cd7f6",
    code: {
      file: "jit_config.yml",
      lines: [
        "token_ttl: 900s",
        "reauth: forced",
        'algorithm: "ED25519"',
      ],
    },
    enabled: true,
  },
];

const ACTION_CONFIG = {
  block:   { label: "Block",       bg: "rgba(248,113,113,0.12)",  color: "#f87171", border: "rgba(248,113,113,0.25)" },
  mfa:     { label: "MFA Required", bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.25)" },
  rotate:  { label: "Rotate",      bg: "rgba(76,215,246,0.12)",   color: "#4cd7f6", border: "rgba(76,215,246,0.25)"  },
  approve: { label: "Approval",    bg: "rgba(52,211,153,0.12)",   color: "#34d399", border: "rgba(52,211,153,0.25)"  },
};

const CHART_BARS = [0.4, 0.6, 0.9, 0.3, 0.5, 0.8, 0.45, 0.55];

function GuardrailToggle({ label, desc, on, color }: { label: string; desc: string; on: boolean; color: string }) {
  const [active, setActive] = useState(on);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", marginBottom: 8 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{label}</p>
        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{desc}</p>
      </div>
      <div
        onClick={() => setActive(!active)}
        style={{
          width: 48, height: 26, borderRadius: 13, cursor: "pointer", flexShrink: 0,
          background: active ? `linear-gradient(135deg, ${color}99, ${color})` : "rgba(255,255,255,0.06)",
          border: `1px solid ${active ? color + "60" : "rgba(255,255,255,0.1)"}`,
          position: "relative", transition: "all 0.2s",
          boxShadow: active ? `0 0 10px ${color}40` : "none",
        }}
      >
        <div style={{ position: "absolute", top: 3, left: active ? "auto" : 3, right: active ? 3 : "auto", width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "all 0.2s" }} />
      </div>
    </div>
  );
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyRule[]>(INITIAL_POLICIES);
  const [selectedReq, setSelectedReq] = useState<"approve" | "mfa" | "block">("mfa");
  const [agentSel, setAgentSel] = useState("FinancialSummarizer_v4");
  const [actionSel, setActionSel] = useState("Read Database");

  const togglePolicy = (id: string) => {
    setPolicies((ps) => ps.map((p) => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const appendPolicy = () => {
    const newPolicy: PolicyRule = {
      id: String(Date.now()),
      name: `${agentSel} → ${actionSel}`,
      policyId: `POL-USR-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      scope: agentSel,
      action: selectedReq,
      icon: selectedReq === "block" ? "🔒" : selectedReq === "mfa" ? "🔑" : "✅",
      color: ACTION_CONFIG[selectedReq].color,
      code: { file: "custom_rule.json", lines: [`// ${agentSel}`, `// action: ${actionSel}`, `require: ${selectedReq.toUpperCase()}`] },
      enabled: true,
    };
    setPolicies((ps) => [newPolicy, ...ps]);
  };

  const activeCount = policies.filter((p) => p.enabled).length;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 32 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.3em", color: "#a78bfa", marginBottom: 6 }}>Governance Engine</p>
          <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 34, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            Security Policies
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14 }}>
          <div>
            <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: 2 }}>Global Status</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#4cd7f6", fontSize: 13 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4cd7f6", animation: "pulse-green 2s infinite", boxShadow: "0 0 10px rgba(76,215,246,0.7)" }} />
              Zero-Trust Active
            </div>
          </div>
        </div>
      </div>

      {/* ── Bento grid ─────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18, alignItems: "start" }}>

        {/* LEFT COLUMN ── Guardrails + Rule Builder */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Global Guardrails */}
          <div className="section-card" style={{ padding: 24, borderLeft: "4px solid #f87171", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -24, right: -24, width: 80, height: 80, background: "rgba(248,113,113,0.06)", filter: "blur(30px)", borderRadius: "50%" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>🧱</span>
              <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 15, fontWeight: 700, textTransform: "uppercase", color: "var(--text-primary)" }}>Global Guardrails</h2>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 18 }}>
              Strict mode enabled. Any interaction not explicitly defined is restricted by the neural firewall.
            </p>
            <GuardrailToggle label="Destructive Actions" desc="Block all by default" on={true} color="#f87171" />
            <GuardrailToggle label="Cross-Agent Comms"  desc="Requires Handshake" on={false} color="#a78bfa" />
            <GuardrailToggle label="Off-Hours Lockout"  desc="21:00 – 07:00 UTC" on={true} color="#4cd7f6" />
          </div>

          {/* Quick Rule Builder */}
          <div className="section-card" style={{ padding: 24, background: "rgba(50,53,60,0.55)", backdropFilter: "blur(24px)" }}>
            <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              ➕ Quick Rule Builder
            </h2>

            {/* If Agent */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: 6 }}>If Agent [X]</label>
              <select
                value={agentSel}
                onChange={(e) => setAgentSel(e.target.value)}
                style={{ width: "100%", padding: "11px 12px", background: "rgba(50,53,60,0.9)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-primary)", fontSize: 12, outline: "none" }}
              >
                <option>FinancialSummarizer_v4</option>
                <option>CustomerSupport_AI</option>
                <option>DevOps_AutoDeploy</option>
                <option>HR-Executive-Proxy</option>
                <option>Asset-Liquidation-Bot</option>
              </select>
            </div>

            {/* Requests Action */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: 6 }}>Requests Action [Y]</label>
              <select
                value={actionSel}
                onChange={(e) => setActionSel(e.target.value)}
                style={{ width: "100%", padding: "11px 12px", background: "rgba(50,53,60,0.9)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-primary)", fontSize: 12, outline: "none" }}
              >
                <option>Read Database</option>
                <option>External API Call</option>
                <option>Bulk Data Export</option>
                <option>Vault Token Request</option>
                <option>Delete Records</option>
              </select>
            </div>

            {/* Requirement */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: 8 }}>Requirement</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {(["approve", "mfa", "block"] as const).map((req) => (
                  <button
                    key={req}
                    onClick={() => setSelectedReq(req)}
                    style={{
                      padding: "12px 6px", borderRadius: 10, cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      background: selectedReq === req ? ACTION_CONFIG[req].bg : "rgba(255,255,255,0.03)",
                      border: `1px solid ${selectedReq === req ? ACTION_CONFIG[req].border : "rgba(255,255,255,0.06)"}`,
                      color: selectedReq === req ? ACTION_CONFIG[req].color : "var(--text-muted)",
                      fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{req === "approve" ? "👤" : req === "mfa" ? "🔑" : "🚫"}</span>
                    {ACTION_CONFIG[req].label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={appendPolicy}
              style={{ width: "100%", padding: "13px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-primary)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, #7C3AED, #a78bfa)"; e.currentTarget.style.border = "1px solid transparent"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; }}
            >
              Append Policy Rule
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN ── Policy list + charts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Active Deployment Rules */}
          <div style={{ background: "var(--bg-secondary)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>
            <div style={{ padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Active Deployment Rules</h2>
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>{activeCount} Total Rules</span>
            </div>

            {policies.map((policy, i) => {
              const ac = ACTION_CONFIG[policy.action];
              return (
                <div
                  key={policy.id}
                  style={{
                    padding: "24px 28px",
                    borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    display: "flex", gap: 24, alignItems: "flex-start",
                    opacity: policy.enabled ? 1 : 0.4,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Meta */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${policy.color}14`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                        {policy.icon}
                      </div>
                      <div>
                        <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>{policy.name}</h3>
                        <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.15em" }}>ID: {policy.policyId}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 9, fontWeight: 800, textTransform: "uppercase", background: "rgba(255,255,255,0.04)", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        {policy.scope}
                      </span>
                      <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 9, fontWeight: 800, textTransform: "uppercase", background: ac.bg, color: ac.color, border: `1px solid ${ac.border}` }}>
                        {ac.label}
                      </span>
                    </div>
                  </div>

                  {/* Code snippet */}
                  <div
                    style={{
                      width: 240, background: "rgba(0,0,0,0.35)", borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.05)",
                      padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 11,
                      lineHeight: 1.7, flexShrink: 0,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ color: "#475569", fontSize: 10 }}>{policy.code.file}</span>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: policy.color, boxShadow: `0 0 6px ${policy.color}` }} />
                    </div>
                    {policy.code.lines.map((line, j) => (
                      <div key={j} style={{ color: line.startsWith("//") ? "#475569" : line.includes("DENY") || line.includes("block") ? "#f87171" : line.includes("MFA") || line.includes("mfa") ? "#a78bfa" : "#4cd7f6" }}>
                        {line}
                      </div>
                    ))}
                  </div>

                  {/* Enable toggle */}
                  <div
                    onClick={() => togglePolicy(policy.id)}
                    title={policy.enabled ? "Disable rule" : "Enable rule"}
                    style={{
                      width: 42, height: 24, borderRadius: 12, cursor: "pointer", flexShrink: 0, marginTop: 8,
                      background: policy.enabled ? `linear-gradient(135deg, ${policy.color}99, ${policy.color})` : "rgba(255,255,255,0.06)",
                      border: `1px solid ${policy.enabled ? policy.color + "50" : "rgba(255,255,255,0.1)"}`,
                      position: "relative", transition: "all 0.2s",
                      boxShadow: policy.enabled ? `0 0 10px ${policy.color}30` : "none",
                    }}
                  >
                    <div style={{ position: "absolute", top: 3, left: policy.enabled ? "auto" : 3, right: policy.enabled ? 3 : "auto", width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "all 0.2s" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom analytics row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* Intercept chart */}
            <div className="section-card" style={{ padding: 20 }}>
              <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: 16 }}>Policy Intercepts (24h)</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
                {CHART_BARS.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1, height: `${h * 100}%`,
                      background: i === 2 ? "rgba(167,139,250,0.7)" : i === 5 ? "rgba(248,113,113,0.7)" : "rgba(255,255,255,0.07)",
                      borderRadius: "3px 3px 0 0",
                      boxShadow: i === 2 ? "0 0 10px rgba(167,139,250,0.4)" : i === 5 ? "0 0 10px rgba(248,113,113,0.4)" : "none",
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                <span>00:00</span>
                <span style={{ color: "#a78bfa" }}>INTERCEPTS: 142</span>
                <span>23:59</span>
              </div>
            </div>

            {/* Compliance rating */}
            <div className="section-card" style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h4 style={{ fontFamily: "var(--font-syne)", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Compliance Rating</h4>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>NIST AI-100-1 Standard</p>
                <div style={{ fontFamily: "var(--font-syne)", fontSize: 32, fontWeight: 900, color: "#4cd7f6" }}>99.8%</div>
              </div>
              <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
                <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#4cd7f6" strokeWidth="8"
                    strokeDasharray="213" strokeDashoffset="2" strokeLinecap="round"
                    style={{ filter: "drop-shadow(0 0 6px rgba(76,215,246,0.7))" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✅</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
