"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Shield, Terminal, Zap, Lock, CheckCircle2, AlertTriangle,
  XCircle, ChevronRight, Play, RotateCcw, Eye, Mail, Trash2,
  FileSearch, ArrowLeft, Activity
} from "lucide-react";

// ─── Demo Scenarios ───────────────────────────────────────────────────────────

const SCENARIOS = [
  {
    id: "read",
    label: "Summarize Emails",
    icon: FileSearch,
    command: "Summarize my last 5 emails",
    risk: "READ",
    riskScore: "LOW — 15",
    color: "#10b981",
    steps: [
      { text: "Parsing natural language intent...", delay: 600 },
      { text: "Classified: summarize_emails (READ)", delay: 500 },
      { text: "Risk level: LOW — Auto-executing...", delay: 500 },
      { text: "Generating scoped JIT token (expires in 60s)...", delay: 700 },
      { text: "Fetching inbox — Gmail API call #1...", delay: 800 },
      { text: "✓ Received 5 messages securely", delay: 400 },
      { text: "Token invalidated — session closed.", delay: 500 },
    ],
    result: {
      type: "success",
      title: "Inbox Summary",
      items: [
        { from: "team@vercel.com", subject: "Your deployment is live", time: "2h ago" },
        { from: "notifications@github.com", subject: "PR #42 merged to main", time: "3h ago" },
        { from: "stripe@stripe.com", subject: "Payment of $49 received", time: "5h ago" },
        { from: "security@google.com", subject: "New sign-in detected", time: "Yesterday" },
        { from: "newsletters@hackernews.com", subject: "Top stories this week", time: "Yesterday" },
      ]
    }
  },
  {
    id: "write",
    label: "Send Email",
    icon: Mail,
    command: 'Send email to team@company.com — "Deployment ready"',
    risk: "WRITE",
    riskScore: "MEDIUM — 65",
    color: "#f59e0b",
    steps: [
      { text: "Parsing intent — send_email detected...", delay: 600 },
      { text: "Risk level: WRITE — Requires human approval", delay: 600 },
      { text: "⚠ Halting execution — HITL gate triggered", delay: 500 },
      { text: "Notifying security dashboard...", delay: 700 },
      { text: "Awaiting operator approval...", delay: 600 },
      { text: "✓ Operator approved — resuming pipeline", delay: 400 },
      { text: "JIT token issued — sending via Gmail API...", delay: 600 },
      { text: "Token invalidated post-use.", delay: 400 },
    ],
    result: {
      type: "approval",
      title: "Human-in-the-Loop Approval",
      message: "Agent wants to send an email to team@company.com with subject \"Deployment ready\"",
    }
  },
  {
    id: "destructive",
    label: "Delete Emails",
    icon: Trash2,
    command: "Delete all spam emails permanently",
    risk: "DESTRUCTIVE",
    riskScore: "HIGH — 98",
    color: "#ef4444",
    steps: [
      { text: "Parsing intent — delete_email detected...", delay: 600 },
      { text: "Risk level: DESTRUCTIVE — REQUIRE_AUTH", delay: 500 },
      { text: "🚨 BLOCKING EXECUTION — Destructive action!", delay: 500 },
      { text: "Triggering Step-Up Authentication gate...", delay: 700 },
      { text: "Requesting MFA / Passkey verification...", delay: 600 },
      { text: "Waiting for biometric confirmation...", delay: 800 },
      { text: "Logging access attempt to immutable ledger...", delay: 400 },
    ],
    result: {
      type: "mfa",
      title: "Step-Up Authentication Required",
      message: "Destructive action detected. Verify your identity to proceed.",
    }
  },
];

// ─── Audit log entries ─────────────────────────────────────────────────────────

const AUDIT_LOGS = [
  { id: "AUD-001", action: "summarize_emails", risk: "READ",        status: "COMPLETED",  time: "14:32:01", sig: "VERIFIED_TOKEN" },
  { id: "AUD-002", action: "send_email",       risk: "WRITE",       status: "APPROVED",   time: "14:28:44", sig: "VERIFIED_MFA" },
  { id: "AUD-003", action: "delete_email",     risk: "DESTRUCTIVE", status: "BLOCKED",    time: "14:15:10", sig: "BLOCKED_AUTH" },
  { id: "AUD-004", action: "read_email",       risk: "READ",        status: "COMPLETED",  time: "13:58:22", sig: "VERIFIED_TOKEN" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const riskColor = (r: string) =>
  r === "DESTRUCTIVE" ? "#ef4444" : r === "WRITE" ? "#f59e0b" : "#10b981";

const statusColor = (s: string) =>
  s === "COMPLETED" ? "#10b981" : s === "APPROVED" ? "#f59e0b" : "#ef4444";

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── Component ────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [selected, setSelected] = useState(0);
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [result, setResult] = useState<null | "done">(null);
  const [mfaInput, setMfaInput] = useState("");
  const [mfaStatus, setMfaStatus] = useState<"idle" | "success" | "fail">("idle");
  const [approvalStatus, setApprovalStatus] = useState<"idle" | "approved" | "rejected">("idle");
  const bottomRef = useRef<HTMLDivElement>(null);
  const scenario = SCENARIOS[selected];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const runScenario = async () => {
    if (running) return;
    setRunning(true);
    setLines([]);
    setResult(null);
    setMfaInput("");
    setMfaStatus("idle");
    setApprovalStatus("idle");

    // Type the command
    await delay(300);
    setLines([`$ ${scenario.command}`]);
    await delay(700);
    setLines(prev => [...prev, "→ Analyzing with VaultProxy AI Engine..."]);

    for (const step of scenario.steps) {
      await delay(step.delay);
      setLines(prev => [...prev, `• ${step.text}`]);
    }

    await delay(500);
    setResult("done");
    setRunning(false);
  };

  const reset = () => {
    setLines([]);
    setResult(null);
    setRunning(false);
    setMfaInput("");
    setMfaStatus("idle");
    setApprovalStatus("idle");
  };

  const handleMFA = () => {
    if (mfaInput === "123456") {
      setMfaStatus("success");
    } else {
      setMfaStatus("fail");
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060610", color: "#cbd5e1", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 50, backgroundColor: "rgba(6,6,16,0.9)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", textDecoration: "none", fontSize: "13px" }}>
            <ArrowLeft size={16} /> Back
          </Link>
          <div style={{ width: "1px", height: "20px", backgroundColor: "rgba(255,255,255,0.1)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#10b981", boxShadow: "0 0 8px #10b981", animation: "pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.5px" }}>VaultProxy</span>
            <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "99px", backgroundColor: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa", fontWeight: 600 }}>DEMO MODE</span>
          </div>
        </div>
        <Link href="/api/auth/login" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "#7c3aed", color: "#fff", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: 700, letterSpacing: "1px" }}>
          <Shield size={14} /> Start Secure
        </Link>
      </header>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "320px 1fr", gap: "32px", alignItems: "start" }}>

        {/* ── Left Panel ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Scenario picker */}
          <div style={{ backgroundColor: "#0a0a14", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", overflow: "hidden" }}>
            <div style={{ padding: "20px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ fontSize: "11px", color: "#64748b", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Select Scenario</p>
              <p style={{ fontSize: "13px", color: "#94a3b8" }}>See how VaultProxy handles each risk level</p>
            </div>
            <div style={{ padding: "12px" }}>
              {SCENARIOS.map((s, i) => {
                const Icon = s.icon;
                const isActive = i === selected;
                return (
                  <button
                    key={s.id}
                    onClick={() => { setSelected(i); reset(); }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: "14px",
                      padding: "14px 16px", borderRadius: "10px", border: "none",
                      backgroundColor: isActive ? `${s.color}14` : "transparent",
                      outline: isActive ? `1px solid ${s.color}44` : "none",
                      cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                      marginBottom: "6px",
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: "8px", backgroundColor: `${s.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={18} color={s.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: isActive ? "#e2e8f0" : "#94a3b8" }}>{s.label}</div>
                      <div style={{ fontSize: "11px", color: s.color, fontWeight: 700, marginTop: "2px" }}>{s.risk} · {s.riskScore}</div>
                    </div>
                    {isActive && <ChevronRight size={16} color={s.color} style={{ marginLeft: "auto" }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audit Log panel */}
          <div style={{ backgroundColor: "#0a0a14", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "10px" }}>
              <Activity size={16} color="#a78bfa" />
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}>Live Audit Ledger</p>
            </div>
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {AUDIT_LOGS.map((log) => (
                <div key={log.id} style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "10px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#64748b" }}>{log.id}</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: statusColor(log.status) }}>{log.status}</span>
                  </div>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>{log.action}</span>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "10px", color: riskColor(log.risk), fontWeight: 700 }}>{log.risk}</span>
                    <span style={{ fontSize: "10px", color: "#475569" }}>{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Panel: Terminal ────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Scenario header */}
          <div style={{ backgroundColor: "#0a0a14", border: `1px solid ${scenario.color}33`, borderRadius: "16px", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{ padding: "6px 14px", borderRadius: "99px", backgroundColor: `${scenario.color}18`, border: `1px solid ${scenario.color}44`, fontSize: "11px", fontWeight: 800, color: scenario.color, letterSpacing: "1.5px" }}>
                  {scenario.risk} RISK
                </div>
                <div style={{ padding: "6px 14px", borderRadius: "99px", backgroundColor: "rgba(255,255,255,0.04)", fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                  Score: {scenario.riskScore}
                </div>
              </div>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "#e2e8f0" }}>{scenario.label}</p>
              <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>"{scenario.command}"</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              {result && (
                <button onClick={reset} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.04)", color: "#94a3b8", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                  <RotateCcw size={14} /> Reset
                </button>
              )}
              <button
                onClick={running ? undefined : (result ? reset : runScenario)}
                disabled={running}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 22px", borderRadius: "8px", border: "none", backgroundColor: running ? "rgba(139,92,246,0.3)" : "#7c3aed", color: "#fff", cursor: running ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 700, transition: "all 0.2s" }}
              >
                <Play size={14} /> {running ? "Running..." : "Run Demo"}
              </button>
            </div>
          </div>

          {/* Terminal output */}
          <div style={{ backgroundColor: "#050508", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", overflow: "hidden", minHeight: "340px" }}>
            {/* Title bar */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.02)" }}>
              {["rgba(239,68,68,0.5)", "rgba(245,158,11,0.5)", "rgba(16,185,129,0.4)"].map((c, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: c }} />
              ))}
              <Terminal size={12} color="#475569" style={{ marginLeft: 8 }} />
              <span style={{ fontSize: "11px", color: "#475569", letterSpacing: "1px" }}>vaultproxy — agent-shell</span>
            </div>

            {/* Log lines */}
            <div style={{ padding: "24px", fontFamily: "monospace", fontSize: "13px", lineHeight: 1.8, minHeight: "240px" }}>
              {lines.length === 0 && !running ? (
                <div style={{ color: "#334155", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", gap: "16px" }}>
                  <Terminal size={40} strokeWidth={1} />
                  <span>Click "Run Demo" to simulate the agent pipeline</span>
                </div>
              ) : (
                lines.map((line, i) => (
                  <div key={i} style={{ color: line.startsWith("$") ? "#a78bfa" : line.startsWith("→") ? "#4cd7f6" : line.includes("✓") ? "#10b981" : line.includes("🚨") || line.includes("BLOCKING") ? "#ef4444" : line.includes("⚠") ? "#f59e0b" : "#94a3b8", marginBottom: "2px" }}>
                    {line}
                  </div>
                ))
              )}
              {running && (
                <div style={{ color: "#475569", animation: "blink 1s step-end infinite" }}>█</div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Result panel */}
          {result === "done" && (
            <div style={{ backgroundColor: "#0a0a14", border: `1px solid ${scenario.color}33`, borderRadius: "16px", overflow: "hidden", animation: "fadeIn 0.4s ease" }}>

              {/* READ result: email list */}
              {scenario.result.type === "success" && "items" in scenario.result && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <CheckCircle2 size={18} color="#10b981" />
                    <span style={{ fontWeight: 700, color: "#e2e8f0" }}>Execution Successful — 5 Emails Retrieved</span>
                  </div>
                  <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {scenario.result.items.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 16px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Mail size={16} color="#a78bfa" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>{item.subject}</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>{item.from}</div>
                        </div>
                        <span style={{ fontSize: "11px", color: "#475569" }}>{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WRITE result: approval gate */}
              {scenario.result.type === "approval" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <AlertTriangle size={18} color="#f59e0b" />
                    <span style={{ fontWeight: 700, color: "#e2e8f0" }}>{scenario.result.title}</span>
                  </div>
                  <div style={{ padding: "24px" }}>
                    <p style={{ color: "#94a3b8", marginBottom: "24px", fontSize: "14px" }}>{scenario.result.message}</p>
                    {approvalStatus === "idle" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <button onClick={() => setApprovalStatus("approved")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", borderRadius: "10px", border: "none", backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981", cursor: "pointer", fontWeight: 700, fontSize: "14px", outline: "1px solid rgba(16,185,129,0.3)" }}>
                          <CheckCircle2 size={16} /> Approve
                        </button>
                        <button onClick={() => setApprovalStatus("rejected")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", borderRadius: "10px", border: "none", backgroundColor: "rgba(239,68,68,0.12)", color: "#ef4444", cursor: "pointer", fontWeight: 700, fontSize: "14px", outline: "1px solid rgba(239,68,68,0.3)" }}>
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    )}
                    {approvalStatus === "approved" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px", borderRadius: "10px", backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
                        <CheckCircle2 size={20} color="#10b981" />
                        <div>
                          <div style={{ fontWeight: 700, color: "#10b981" }}>Email Sent Successfully</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>Action logged to audit ledger · Token invalidated</div>
                        </div>
                      </div>
                    )}
                    {approvalStatus === "rejected" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px", borderRadius: "10px", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
                        <XCircle size={20} color="#ef4444" />
                        <div>
                          <div style={{ fontWeight: 700, color: "#ef4444" }}>Action Rejected by Operator</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>Rejection logged · Agent blocked</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DESTRUCTIVE result: MFA gate */}
              {scenario.result.type === "mfa" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <Lock size={18} color="#ef4444" />
                    <span style={{ fontWeight: 700, color: "#e2e8f0" }}>{scenario.result.title}</span>
                  </div>
                  <div style={{ padding: "24px" }}>
                    <p style={{ color: "#94a3b8", marginBottom: "24px", fontSize: "14px" }}>{scenario.result.message}</p>
                    {mfaStatus === "idle" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "8px", backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", fontSize: "13px", color: "#f59e0b" }}>
                          <Eye size={14} /> Enter OTP code — hint: try 123456
                        </div>
                        <div style={{ display: "flex", gap: "12px" }}>
                          <input
                            value={mfaInput}
                            onChange={e => setMfaInput(e.target.value)}
                            placeholder="6-digit OTP"
                            maxLength={6}
                            style={{ flex: 1, padding: "12px 16px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: "16px", letterSpacing: "8px", fontFamily: "monospace", outline: "none" }}
                          />
                          <button onClick={handleMFA} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", backgroundColor: "#7c3aed", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "14px" }}>
                            Verify
                          </button>
                        </div>
                      </div>
                    )}
                    {mfaStatus === "success" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px", borderRadius: "10px", backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
                        <CheckCircle2 size={20} color="#10b981" />
                        <div>
                          <div style={{ fontWeight: 700, color: "#10b981" }}>Identity Verified — Action Authorized</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>Scoped JIT token issued · 3s TTL · Logged</div>
                        </div>
                      </div>
                    )}
                    {mfaStatus === "fail" && (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px", borderRadius: "10px", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", marginBottom: "12px" }}>
                          <XCircle size={20} color="#ef4444" />
                          <div>
                            <div style={{ fontWeight: 700, color: "#ef4444" }}>Wrong OTP — Access Denied</div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>Attempt logged · Try 123456</div>
                          </div>
                        </div>
                        <button onClick={() => { setMfaInput(""); setMfaStatus("idle"); }} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: "13px" }}>
                          Try Again
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div style={{ backgroundColor: "#0a0a14", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "16px", padding: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "18px", color: "#e2e8f0", marginBottom: "6px" }}>Ready to deploy VaultProxy?</div>
              <div style={{ fontSize: "14px", color: "#64748b" }}>Connect your real Gmail account and run live agent tasks.</div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <Link href="/" style={{ padding: "12px 20px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "transparent", color: "#94a3b8", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
                Learn More
              </Link>
              <Link href="/api/auth/login" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "8px", backgroundColor: "#7c3aed", color: "#fff", textDecoration: "none", fontSize: "13px", fontWeight: 700 }}>
                <Zap size={14} /> Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { border-color: rgba(139,92,246,0.5) !important; box-shadow: 0 0 0 3px rgba(139,92,246,0.15); }
        button:hover:not(:disabled) { filter: brightness(1.1); }
      `}</style>
    </div>
  );
}
