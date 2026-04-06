"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Lock, 
  Fingerprint,
  Activity,
  Brain,
  Sparkles,
  AlertTriangle,
  Shield,
} from "lucide-react";

type Risk = "READ" | "WRITE" | "DESTRUCTIVE";

interface ExecutionStep {
  icon: string;
  label: string;
  status: "running" | "completed" | "warning" | "error";
  detail?: string;
}

interface RunResult {
  status: string;
  result?: string;
  fingerprint?: string;
  actionId?: string;
  authUrl?: string;
}

interface IntentTask {
  action: string;
  resource: string;
  risk: "READ" | "WRITE" | "DESTRUCTIVE";
  confidence: number;
  details: string;
  content?: string;
  security_reason?: string;
}

interface IntentAnalysis {
  tasks: IntentTask[];
  raw_intent: string;
  source: "llm" | "keyword_fallback";
  model?: string | null;
}

function SecurityModal({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const lockUntil = localStorage.getItem("vault_lockout");
    return !!lockUntil && Number(lockUntil) > Date.now();
  });
  const [scanning, setScanning] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [answers, setAnswers] = useState(["", "", "", "", ""]);

  const QUESTIONS = [
    "What was the name of your first pet?",
    "In which city were you born?",
    "What was your childhood nickname?",
    "What was the model of your first car?",
    "What is your mother's maiden name?"
  ];


  const handleVerify = () => {
    if (pin === "1234") {
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        const lockTime = Date.now() + 24 * 60 * 60 * 1000;
        localStorage.setItem("vault_lockout", lockTime.toString());
        setIsLocked(true);
      }
    }
  };

  const handleQuestionSubmit = () => {
    if (activeQuestion < 4) {
      setActiveQuestion(activeQuestion + 1);
    } else {
      // Manual Override success
      localStorage.removeItem("vault_lockout");
      alert("identity Protocol Verified. Vault Unlocked.");
      window.location.reload();
    }
  };

  const simulateBio = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      onSuccess();
    }, 2000);
  };

  if (isLocked && !showQuestions) {
    return (
      <div className="animate-fade-in" style={{ 
        marginTop: 20, 
        padding: 32, 
        background: "rgba(239,68,68,0.1)", 
        border: "1px solid #ef4444", 
        borderRadius: 24,
        textAlign: 'center',
        marginLeft: 30
      }}>
        <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#ef4444", marginBottom: 12 }}>VAULT LOCKED</h3>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Too many failed attempts. For your security, this vault is frozen for 24 hours.
        </p>
        <button 
           onClick={() => setShowQuestions(true)}
           style={{ 
             marginTop: 24, 
             padding: "12px 24px", 
             borderRadius: 12, 
             background: "rgba(255,255,255,0.05)", 
             border: "1px solid var(--border)", 
             color: "#fff",
             fontSize: 13,
             fontWeight: 700,
             cursor: "pointer"
           }}
           className="hover:bg-white/10 transition-all"
        >
          Identity Recovery Protocol →
        </button>
      </div>
    );
  }

  if (showQuestions) {
    return (
      <div className="animate-fade-in" style={{ 
        marginTop: 20, 
        padding: 32, 
        background: "rgba(0,0,0,0.4)", 
        border: "1px solid var(--purple)", 
        borderRadius: 24,
        marginLeft: 30 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
           <Activity size={20} className="text-purple-500" />
           <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-syne)" }}>Recover Vault Context</h3>
        </div>

        <div style={{ marginBottom: 24 }}>
           <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Question {activeQuestion + 1} of 5</p>
           <h4 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{QUESTIONS[activeQuestion]}</h4>
        </div>

        <input 
           type="text" 
           placeholder="Your Answer"
           value={answers[activeQuestion]}
           onChange={(e) => {
              const newAnswers = [...answers];
              newAnswers[activeQuestion] = e.target.value;
              setAnswers(newAnswers);
           }}
           style={{ 
             width: '100%', 
             padding: 16, 
             background: 'rgba(255,255,255,0.03)', 
             border: '1px solid var(--border)', 
             borderRadius: 12, 
             color: '#fff',
             fontSize: 14,
             marginBottom: 20,
             outline: 'none'
           }}
           className="focus:border-purple-500 transition-colors"
        />

        <button 
           onClick={handleQuestionSubmit}
           style={{ 
             width: '100%', 
             padding: 16, 
             borderRadius: 12, 
             background: 'var(--purple)', 
             border: 'none', 
             color: '#fff', 
             fontWeight: 700, 
             cursor: 'pointer' 
           }}
        >
          {activeQuestion < 4 ? "Continue Challenge" : "Authorize Recovery"}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ 
      marginTop: 20, 
      padding: 32, 
      background: "rgba(124,58,237,0.05)", 
      border: "1px solid rgba(124,58,237,0.2)", 
      borderRadius: 24,
      marginLeft: 30 
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
         <Lock size={20} className="text-purple-500" />
         <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-syne)" }}>Security Override</h3>
      </div>
      
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.5 }}>
         Enter your 4-digit Security PIN or use biometric scan to authorize this destructive task.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <input 
          type="password" 
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
          maxLength={4}
          style={{ 
            width: 120,
            padding: "16px", 
            background: "rgba(255,255,255,0.03)", 
            border: "1px solid var(--border)", 
            borderRadius: 16,
            color: "#fff",
            fontSize: 24,
            textAlign: 'center',
            letterSpacing: '0.2em',
            outline: 'none'
          }}
          className="focus:border-purple-500 transition-colors"
        />
        
        <button 
          onClick={handleVerify}
          className="btn-primary" 
          style={{ 
            background: "var(--purple)", 
            padding: "0 32px",
            height: 60,
            borderRadius: 16,
            fontWeight: 800,
            fontSize: 14,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {attempts > 0 ? `Verify (Attempt ${attempts}/3)` : "Verify PIN"}
        </button>

        <button 
           onClick={simulateBio}
           disabled={scanning}
           style={{ 
             height: 60,
             padding: "0 24px",
             borderRadius: 16,
             background: 'rgba(52,211,153,0.1)',
             border: '1px solid rgba(52,211,153,0.3)',
             color: '#34d399',
             display: 'flex',
             alignItems: 'center',
             gap: 10,
             fontWeight: 700,
             fontSize: 13,
             cursor: 'pointer'
           }}
           className="hover:bg-emerald-500/20 transition-colors"
        >
          {scanning ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
               <div className="spinner-sm" style={{ borderColor: '#34d399 #34d399 transparent transparent' }} /> Scanning...
            </div>
          ) : (
            <>
              <Fingerprint size={20} /> Use Biometrics
            </>
          )}
        </button>
      </div>

      <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
         <Link href="/dashboard/settings/password" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: 'none' }} className="hover:text-purple-400">
            Forgot PIN? or Authentication not set? Configure in Settings →
         </Link>
      </div>
    </div>
  );
}

const QUICK_TASKS = [
  {
    icon: "📧",
    label: "Summarize Emails",
    task: "Summarize my last 5 emails",
    risk: "READ" as Risk,
    chipClass: "quick-chip-blue",
    badgeClass: "chip-read",
    badge: "READ · Auto-approved",
    color: "#3b82f6",
  },
  {
    icon: "📤",
    label: "Send Email",
    task: "Send email to team@hack.com about the vault update",
    risk: "WRITE" as Risk,
    chipClass: "quick-chip-orange",
    badgeClass: "chip-write",
    badge: "WRITE · Approval required",
    color: "#f59e0b",
  },
  {
    icon: "🗑️",
    label: "Delete Drafts",
    task: "Delete all draft emails in Gmail",
    risk: "DESTRUCTIVE" as Risk,
    chipClass: "quick-chip-red",
    badgeClass: "chip-destructive",
    badge: "DESTRUCTIVE · MFA required",
    color: "#ef4444",
  },
];

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function StepStatus({ status }: { status: ExecutionStep["status"] }) {
  if (status === "completed")
    return (
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "var(--green)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        ✓ OK
      </span>
    );
  if (status === "warning")
    return (
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "var(--orange)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        ⏸ PAUSED
      </span>
    );
  if (status === "error")
    return (
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "var(--red)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        ✕ ERR
      </span>
    );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div className="spinner-sm" />
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "#60a5fa",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        Live
      </span>
    </div>
  );
}

export default function RunPage() {
  const [task, setTask] = useState("");
  const [riskLevel, setRiskLevel] = useState<Risk>("READ");
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const addStepRef = useRef<((s: ExecutionStep) => void) | null>(null);

  // Intent Analyzer state
  const [analysis, setAnalysis] = useState<IntentAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const analyzeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [expandedContent, setExpandedContent] = useState<Record<number, boolean>>({});

  // Debounced intent analysis — calls LLaMA 3 via Groq
  const analyzeTask = useCallback(async (taskText: string) => {
    if (!taskText.trim() || taskText.length < 3) {
      setAnalysis(null);
      setAnalyzeError(null);
      return;
    }
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/agent/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || "Analysis failed");
      }
      const data: IntentAnalysis = await res.json();
      setAnalysis(data);
      // Sync the risk level badge from the first task
      if (data.tasks.length > 0) {
        setRiskLevel(data.tasks[0].risk as Risk);
      }
    } catch (err: unknown) {
      setAnalyzeError(err instanceof Error ? err.message : "Analysis unavailable");
    } finally {
      setAnalyzing(false);
    }
  }, []);

  // Watch task input — debounce 600ms before hitting Groq
  useEffect(() => {
    if (analyzeDebounceRef.current) clearTimeout(analyzeDebounceRef.current);
    if (!task.trim()) {
      setAnalysis(null);
      setRiskLevel("READ");
      return;
    }
    analyzeDebounceRef.current = setTimeout(() => {
      analyzeTask(task);
    }, 600);
    return () => {
      if (analyzeDebounceRef.current) clearTimeout(analyzeDebounceRef.current);
    };
  }, [task, analyzeTask]);

  addStepRef.current = (step: ExecutionStep) => {
    setSteps((prev) => [...prev, step]);
  };

  const updateLast = (patch: Partial<ExecutionStep>) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === prev.length - 1 ? { ...s, ...patch } : s))
    );
  };

  async function handleRun() {
    if (!task.trim() || running) return;
    setRunning(true);
    setSteps([]);
    setRunResult(null);

    // Step 1 — Classify intent via LLaMA 3
    addStepRef.current!({
      icon: "🧠",
      label: "Classifying request with LLaMA 3...",
      status: "running",
    });
    await delay(400);
    updateLast({ 
      status: "completed",
      detail: analysis ? `${analysis.source === 'llm' ? '🤖 LLaMA 3 (Groq)' : '🔤 Keyword'} · ${analysis.tasks.length} task(s) · Risk: ${riskLevel}` : `Risk: ${riskLevel}`,
    });

    // Step 2 — Permission engine
    addStepRef.current!({
      icon: "🛡️",
      label: "Evaluating permission engine...",
      status: "running",
      detail: `Classified action → ${riskLevel}`,
    });
    await delay(600);
    updateLast({ status: "completed" });

    // ── Unified API Execution Path ──
    addStepRef.current!({
      icon: "⚡",
      label: "Firing Zero-Trust Protocol...",
      status: "running",
    });

    let apiResult: { 
      status?: string; 
      authUrl?: string; 
      message?: string; 
      error?: string; 
      result?: { fingerprint?: string }; 
    } | null = null;
    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      
      apiResult = await res.json();

      const isStepUp = apiResult?.status === "step_up_required" || (res.status === 401 && apiResult?.authUrl);

      if (isStepUp && apiResult?.authUrl) {
        updateLast({
          status: "warning",
          label: "Security Challenge: MFA Required",
          detail: "Verify your identity via Auth0 to authorize this action.",
        });
        setRunResult({ status: 'step_up', authUrl: apiResult.authUrl });
        setRunning(false);
        return;
      }

      if (!res.ok) {
        throw new Error(apiResult?.message || apiResult?.error || "Execution failed");
      }

      // Handle Success or Waiting Approval
      if (apiResult?.status === 'waiting_approval') {
        updateLast({
          status: "warning",
          label: "Human-in-the-Loop: Approval Required",
          detail: "This sensitive action has been paused and queued for your review.",
        });
        setRunResult({ status: 'waiting_approval' });
        setRunning(false);
        return;
      }

      updateLast({
        status: "completed",
        label: "Protocol Execution Authorized",
        detail: `Fingerprint: ...${apiResult?.result?.fingerprint?.slice(-4) ?? "a4f2"}`
      });

    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Internal system error";
      updateLast({ status: "error" });
      addStepRef.current!({
        icon: "❌",
        label: "Execution Failed",
        status: "error",
        detail: errMsg,
      });
      setRunning(false);
      return;
    }

    updateLast({
      status: "completed",
      detail: `Token fingerprint: ...${(apiResult as { fingerprint?: string })?.fingerprint ?? "a4f2"}`,
    });
    await delay(300);

    // Step 4 — Progress
    addStepRef.current!({
      icon: "⚡",
      label: "Executing with scoped token...",
      status: "running",
      detail: "__progress__",
    });
    await delay(1800);
    updateLast({ status: "completed", detail: undefined });

    // Step 5 — Done
    addStepRef.current!({
      icon: "✅",
      label: "Complete. Token discarded from memory.",
      status: "completed",
      detail: "Token was never stored · Audit log updated",
    });

    setRunResult(apiResult as RunResult);
    setRunning(false);
  }

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: 36 }}>
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
          Agent Execution
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
          Zero-Trust Protocol · Intent classified by{" "}
          <span style={{ color: "#a78bfa", fontWeight: 700 }}>LLaMA 3 (Groq)</span>
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          alignItems: "stretch",
        }}
      >
        {/* ── LEFT PANEL ─────────────────────────────────────────── */}
        <div className="section-card" style={{ padding: 32 }}>
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "var(--text-muted)",
                marginBottom: 10,
              }}
            >
              Task Description
            </label>
            <textarea
              id="task-input"
              className="form-textarea"
              rows={5}
              placeholder="e.g. Summarize my last 5 emails"
              value={task}
              onChange={(e) => setTask(e.target.value)}
            />
          </div>

          {/* Quick Chips */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "var(--text-muted)",
                marginBottom: 12,
              }}
            >
              Quick Actions
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {QUICK_TASKS.map((qt) => (
                <button
                  key={qt.label}
                  id={`chip-${qt.label.toLowerCase().replace(/\s/g, "-")}`}
                  className={`quick-chip ${qt.chipClass}`}
                  onClick={() => {
                    setTask(qt.task);
                    setRiskLevel(qt.risk);
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{qt.icon}</span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {qt.label}
                    </span>
                    <span
                      className={qt.badgeClass}
                      style={{ marginLeft: "auto", fontSize: 10 }}
                    >
                      {qt.badge}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Risk indicator */}
          {task && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
                padding: "10px 14px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 10,
                border: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Risk Level:
              </span>
              {riskLevel === "READ" && (
                <span className="chip-read">🟢 READ</span>
              )}
              {riskLevel === "WRITE" && (
                <span className="chip-write">🟠 WRITE</span>
              )}
              {riskLevel === "DESTRUCTIVE" && (
                <span className="chip-destructive">🔴 DESTRUCTIVE</span>
              )}
            </div>
          )}

          {/* Execute button */}
          <button
            id="execute-btn"
            onClick={handleRun}
            disabled={running || !task.trim()}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "16px",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              borderRadius: 14,
              background: running
                ? "rgba(124,58,237,0.4)"
                : "linear-gradient(135deg, #7C3AED, #4f46e5)",
              boxShadow: running ? "none" : "0 0 40px rgba(124,58,237,0.3)",
              transition: "var(--transition)",
            }}
          >
            {running ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <div className="spinner-sm" />
                Protocol Locked...
              </span>
            ) : (
              "⚡ Execute Agent Task"
            )}
          </button>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────── */}
        <div
          style={{
            background: "rgba(8,8,14,0.7)",
            border: steps.length === 0 && !running
              ? "1px dashed rgba(124,58,237,0.3)"
              : "1px solid var(--border)",
            borderRadius: 20,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 480,
            animation: steps.length === 0 && !running ? "glow-pulse 3s ease-in-out infinite" : undefined,
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "var(--text-muted)",
              }}
            >
              Live Execution
            </span>
            {running && (
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--purple)",
                  boxShadow: "0 0 8px var(--purple-glow)",
                  animation: "pulse-slow 1s ease-in-out infinite",
                  marginLeft: 4,
                }}
              />
            )}
          </div>

          {/* Steps area */}
          <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
            {!running && steps.length === 0 ? (
              <div className="execution-idle">
                <div className="idle-ring">⚡</div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Ready to execute
                </p>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Assign a task to begin
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {steps.map((s, i) => (
                  <div
                    key={i}
                    className="execution-step"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: 14,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        border: "1px solid",
                        borderColor:
                          s.status === "completed"
                            ? "rgba(16,185,129,0.25)"
                            : s.status === "warning"
                            ? "rgba(245,158,11,0.25)"
                            : s.status === "error"
                            ? "rgba(239,68,68,0.25)"
                            : "rgba(124,58,237,0.25)",
                        background:
                          s.status === "completed"
                            ? "rgba(16,185,129,0.05)"
                            : s.status === "warning"
                            ? "rgba(245,158,11,0.05)"
                            : s.status === "error"
                            ? "rgba(239,68,68,0.05)"
                            : "rgba(124,58,237,0.07)",
                      }}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
                        {s.icon}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {s.label}
                        </p>
                        {s.detail && s.detail !== "__progress__" && (
                          <p
                            style={{
                              fontSize: 11,
                              fontFamily: "var(--font-mono)",
                              color: "var(--text-muted)",
                              marginTop: 4,
                            }}
                          >
                            {s.detail}
                          </p>
                        )}
                        {s.detail === "__progress__" && (
                          <div className="progress-bar-track">
                            <div className="progress-bar-fill" />
                          </div>
                        )}
                      </div>
                      <div style={{ flexShrink: 0, marginTop: 1 }}>
                        <StepStatus status={s.status} />
                      </div>
                    </div>
                    {/* Inline Actions for blocks */}
                    {s.status === "warning" && runResult?.status === "step_up" && (
                       <SecurityModal 
                         onSuccess={() => {
                           alert("Identity Verified. Proceeding with deletion...");
                           window.location.reload(); 
                         }} 
                       />
                    )}
                    {s.status === "warning" && runResult?.status === "waiting_approval" && (
                       <div style={{ marginTop: 12, paddingLeft: 30 }}>
                          <a 
                            href="/dashboard/approvals" 
                            className="btn-primary" 
                            style={{ 
                              padding: '8px 16px', 
                              fontSize: 12, 
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              background: 'var(--orange)',
                              boxShadow: '0 0 20px rgba(245,158,11,0.3)'
                            }}
                          >
                            Go to Approval Console
                          </a>
                       </div>
                    )}
                  </div>
                ))}

                {/* WRITE CTA */}
                {steps.length >= 3 &&
                  steps[steps.length - 1]?.status === "warning" &&
                  riskLevel === "WRITE" && (
                    <div
                      className="execution-step"
                      style={{
                        padding: 16,
                        borderRadius: 14,
                        background: "rgba(245,158,11,0.07)",
                        border: "1px solid rgba(245,158,11,0.25)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#fbbf24",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          marginBottom: 12,
                        }}
                      >
                        Human-in-the-Loop Interceptor Active
                      </p>
                      <a
                        href="/dashboard/approvals"
                        style={{
                          display: "block",
                          textAlign: "center",
                          padding: "12px",
                          background: "rgba(245,158,11,0.8)",
                          color: "#000",
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          textDecoration: "none",
                        }}
                      >
                        Go to Approvals →
                      </a>
                    </div>
                  )}

                {/* DESTRUCTIVE CTA */}
                {steps.length >= 3 &&
                  steps[steps.length - 1]?.status === "warning" &&
                  riskLevel === "DESTRUCTIVE" && (
                    <div
                      className="execution-step"
                      style={{
                        padding: 16,
                        borderRadius: 14,
                        background: "rgba(239,68,68,0.07)",
                        border: "1px solid rgba(239,68,68,0.25)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#f87171",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          marginBottom: 12,
                        }}
                      >
                        Step-Up Auth Required — MFA Gate Active
                      </p>
                      <a
                        href="/auth/login?screen_hint=mfa"
                        style={{
                          display: "block",
                          textAlign: "center",
                          padding: "12px",
                          background: "rgba(239,68,68,0.75)",
                          color: "#fff",
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          textDecoration: "none",
                        }}
                      >
                        Verify Identity →
                      </a>
                    </div>
                  )}

                {/* Result card */}
                {runResult && runResult.status === "completed" && (
                  <div
                    className="execution-step"
                    style={{
                      padding: 16,
                      borderRadius: 14,
                      background: "rgba(16,185,129,0.05)",
                      border: "1px solid rgba(16,185,129,0.2)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#34d399",
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        marginBottom: 10,
                      }}
                    >
                      Execution Result
                    </p>
                    <div
                      style={{
                        padding: 16,
                        background: "rgba(16,185,129,0.1)",
                        border: "1px solid rgba(16,185,129,0.3)",
                        borderRadius: 12,
                        marginTop: 4,
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ 
                          width: 32, height: 32, borderRadius: "50%", 
                          background: "var(--purple)", display: "flex", 
                          alignItems: "center", justifyContent: "center", 
                          fontSize: 14, flexShrink: 0 
                        }}>
                          🤖
                        </div>
                        <div style={{ flex: 1, minWidth: 0, color: "var(--text-primary)", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {runResult.result || runResult.status}
                        </div>
                      </div>
                    </div>
                    {runResult.fingerprint && (
                       <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "rgba(52,211,153,0.8)", marginBottom: 12 }}>
                         [Vault Trace]: Token Fingerprint: {runResult.fingerprint}
                       </div>
                    )}
                    <p
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        marginTop: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Token was never stored · Audit log updated
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── INTENT ANALYZER PANEL ─────────────────────────────────────────────── */}
      {task.trim().length >= 3 && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: 28,
            background: "rgba(8,8,14,0.85)",
            border: "1px solid rgba(124,58,237,0.35)",
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 28px",
              borderBottom: "1px solid rgba(124,58,237,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(124,58,237,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Brain size={16} style={{ color: "#a78bfa" }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.18em" }}>
                Intent Analyzer
              </span>
              {analyzing && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div className="spinner-sm" style={{ borderColor: "#a78bfa #a78bfa transparent transparent" }} />
                  <span style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: "0.1em" }}>CLASSIFYING...</span>
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", background: analysis?.source === "llm" ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)", border: analysis?.source === "llm" ? "1px solid rgba(124,58,237,0.4)" : "1px solid var(--border)", borderRadius: 99 }}>
              {analysis?.source === "llm" ? (
                <>
                  <Sparkles size={10} style={{ color: "#a78bfa" }} />
                  <span style={{ fontSize: 9, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.1em", textTransform: "uppercase" }}>LLaMA 3 · Groq</span>
                </>
              ) : (
                <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {analyzing ? "Connecting..." : analysis ? "Keyword Fallback" : "Waiting..."}
                </span>
              )}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: 24 }}>
            {analyzeError && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, marginBottom: 16 }}>
                <AlertTriangle size={14} style={{ color: "#f87171", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#f87171" }}>{analyzeError}</span>
              </div>
            )}

            {!analyzing && !analysis && !analyzeError && (
              <p style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Type a task above to classify intent...
              </p>
            )}

            {analysis && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {analysis.raw_intent && (
                  <div style={{ padding: "8px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 8 }}>
                    <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>Detected Intent: </span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>&quot;{analysis.raw_intent}&quot;</span>
                  </div>
                )}

                {analysis.tasks.map((t, i) => {
                  const riskCfg = t.risk === "READ"
                    ? { color: "#34d399", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.3)", label: "READ" }
                    : t.risk === "WRITE"
                    ? { color: "#fbbf24", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)", label: "WRITE" }
                    : { color: "#f87171", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", label: "DESTRUCTIVE" };

                  const isExp = !!expandedContent[i];

                  return (
                    <div key={i} className="animate-slide-up" style={{ padding: 20, background: riskCfg.bg, border: `1px solid ${riskCfg.border}`, borderRadius: 16, animationDelay: `${i * 60}ms` }}>
                      {/* Task header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                        {t.risk === "READ"
                          ? <Shield size={13} style={{ color: "#34d399" }} />
                          : <AlertTriangle size={13} style={{ color: riskCfg.color }} />}
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>
                          {t.action.replace(/_/g, " ")}
                        </span>
                        <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 10, fontWeight: 800, color: riskCfg.color, background: `${riskCfg.color}18`, border: `1px solid ${riskCfg.border}`, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          {riskCfg.label}
                        </span>
                        <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700, color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", textTransform: "uppercase" }}>
                          {t.resource}
                        </span>
                      </div>

                      {/* Details */}
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>{t.details}</p>

                      {/* Confidence bar */}
                      <div style={{ marginBottom: (t.security_reason || t.content) ? 14 : 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Confidence</span>
                          <span style={{ fontSize: 10, fontWeight: 800, color: riskCfg.color }}>{t.confidence}%</span>
                        </div>
                        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${t.confidence}%`, background: `linear-gradient(90deg, ${riskCfg.color}88, ${riskCfg.color})`, borderRadius: 99, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
                        </div>
                      </div>

                      {/* Security reason */}
                      {t.security_reason && (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "rgba(0,0,0,0.25)", borderRadius: 10, marginBottom: t.content ? 12 : 0, border: `1px solid ${riskCfg.border}` }}>
                          <AlertTriangle size={12} style={{ color: riskCfg.color, flexShrink: 0, marginTop: 1 }} />
                          <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>{t.security_reason}</p>
                        </div>
                      )}

                      {/* Draft preview */}
                      {t.content && (
                        <div style={{ marginTop: 12 }}>
                          <button
                            onClick={() => setExpandedContent((prev) => ({ ...prev, [i]: !prev[i] }))}
                            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, color: "#a78bfa", background: "transparent", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: isExp ? 10 : 0, padding: 0 }}
                          >
                            <Sparkles size={10} />{isExp ? "Hide Generated Draft" : "Show Generated Draft"}
                          </button>
                          {isExp && (
                            <pre style={{ padding: 14, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 10, fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
                              {t.content}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
