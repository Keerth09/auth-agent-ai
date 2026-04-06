"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, AlertCircle, CheckCircle2, Copy, RefreshCw, Lock, Smartphone } from "lucide-react";

type Step = "start" | "qr" | "verify" | "done";

interface SetupData {
  qrCode: string;
  base32: string;
  otpauthUrl: string;
}

// ── Inline styles ─────────────────────────────────────────────────────────────
const pill = (color: string) => ({
  padding: "3px 12px", borderRadius: 99, fontSize: 10, fontWeight: 800,
  textTransform: "uppercase" as const, letterSpacing: "0.12em",
  background: `${color}18`, color, border: `1px solid ${color}35`,
});



export default function TOTPSetupPage() {
  const [step, setStep] = useState<Step>("start");
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [otpTimer, setOtpTimer] = useState(30);
  const [context, setContext] = useState<"setup" | "auth">("setup");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP refresh indicator
  useEffect(() => {
    if (step !== "verify" && step !== "done") return;
    const tick = () => {
      const secs = 30 - (Math.floor(Date.now() / 1000) % 30);
      setOtpTimer(secs);
    };
    tick();
    const iv = setInterval(tick, 500);
    return () => clearInterval(iv);
  }, [step]);

  // Countdown display when locked
  const [lockCountdown, setLockCountdown] = useState("");
  useEffect(() => {
    if (!lockedUntil) return;
    const update = () => {
      const diff = lockedUntil - Date.now();
      if (diff <= 0) { setLockedUntil(null); setLockCountdown(""); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLockCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [lockedUntil]);

  // ── STEP 1 → 2: Generate secret & QR ───────────────────────────────────────
  const handleSetupStart = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@vaultproxy.local" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSetup(data);
      setContext("setup");
      setStep("qr");
    } catch (e: unknown) {
      setError(`Setup failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── OTP input handling (auto-advance) ──────────────────────────────────────
  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    setError("");
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (!digit && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  // Paste support
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    const next = [...otp];
    digits.split("").forEach((d, i) => { next[i] = d; });
    setOtp(next);
    inputRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  // ── STEP 2 → 3: Submit OTP for verification ─────────────────────────────────
  const handleVerify = useCallback(async () => {
    const token = otp.join("");
    if (token.length !== 6) { setError("Enter all 6 digits."); return; }
    if (lockedUntil && Date.now() < lockedUntil) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@vaultproxy.local", token, context }),
      });
      const data = await res.json();

      if (data.success) {
        setStep("done");
      } else {
        setError(data.error ?? "Invalid OTP.");
        setAttemptsLeft(data.attemptsLeft ?? 0);
        if (data.lockedUntil) setLockedUntil(data.lockedUntil);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [otp, lockedUntil, context]);

  // Submit on last digit entry
  useEffect(() => {
    if (otp.every(Boolean)) handleVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const copyBase32 = () => {
    navigator.clipboard.writeText(setup?.base32 ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetFlow = () => {
    setStep("start"); setSetup(null); setOtp(["", "", "", "", "", ""]);
    setError(""); setAttemptsLeft(3); setLockedUntil(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={{ maxWidth: 760, margin: "0 auto", paddingBottom: 48 }}>
      {/* Back link */}
      <Link href="/dashboard/settings" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13, marginBottom: 28, textDecoration: "none" }}
        className="hover:text-white transition-colors">
        <ArrowLeft size={15} /> Back to Security Settings
      </Link>

      {/* Page header */}
      <div style={{ marginBottom: 36, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(167,139,250,0.1))", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Smartphone size={22} style={{ color: "#a78bfa" }} />
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 28, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 2 }}>
                Authenticator App Setup
              </h1>
              <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                TOTP · Time-Based One-Time Password · RFC 6238
              </p>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {(["start", "qr", "verify", "done"] as Step[]).map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800,
                background: s === step ? "linear-gradient(135deg, #7C3AED, #a78bfa)"
                  : (["start", "qr", "verify", "done"].indexOf(step) > i) ? "rgba(76,215,246,0.2)"
                  : "rgba(255,255,255,0.05)",
                border: s === step ? "none"
                  : (["start", "qr", "verify", "done"].indexOf(step) > i) ? "1px solid rgba(76,215,246,0.4)"
                  : "1px solid rgba(255,255,255,0.08)",
                color: s === step ? "#fff"
                  : (["start", "qr", "verify", "done"].indexOf(step) > i) ? "#4cd7f6"
                  : "var(--text-muted)",
                boxShadow: s === step ? "0 0 14px rgba(124,58,237,0.4)" : "none",
                transition: "all 0.3s",
              }}>
                {(["start", "qr", "verify", "done"].indexOf(step) > i) ? "✓" : i + 1}
              </div>
              {i < 3 && <div style={{ width: 24, height: 1, background: (["start", "qr", "verify", "done"].indexOf(step) > i) ? "#4cd7f6" : "rgba(255,255,255,0.08)" }} />}
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP: start ───────────────────────────────────────────────────────── */}
      {step === "start" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* What is TOTP card */}
          <div style={{ padding: "28px 32px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 18 }}>
            <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
              How Authenticator App MFA Works
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
              {[
                { num: "01", title: "Scan QR Code",  desc: "Link your authenticator app to VaultProxy with a one-time scan.", icon: "📷", color: "#a78bfa" },
                { num: "02", title: "Get OTP",       desc: "Your app generates a fresh 6-digit code every 30 seconds.", icon: "🔁", color: "#4cd7f6" },
                { num: "03", title: "Verify & Lock", desc: "Enter the code to prove physical possession. 3 attempts max.", icon: "🔐", color: "#34d399" },
              ].map((card) => (
                <div key={card.num} style={{ padding: "20px 18px", borderRadius: 14, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
                  <div style={{ fontSize: 40, opacity: 0.08, position: "absolute", top: 8, right: 10, fontFamily: "var(--font-syne)", fontWeight: 900, lineHeight: 1, color: card.color }}>{card.num}</div>
                  <div style={{ fontSize: 22, marginBottom: 10 }}>{card.icon}</div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{card.title}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{card.desc}</p>
                </div>
              ))}
            </div>

            {/* Supported apps */}
            <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Compatible with any RFC 6238 TOTP app:</p>
              <div style={{ display: "flex", gap: 8 }}>
                {["Google Authenticator", "Microsoft Authenticator", "Authy", "1Password"].map((app) => (
                  <span key={app} style={pill("#a78bfa")}>{app}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Security rules */}
          <div style={{ padding: "20px 24px", background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { icon: "⏱️", label: "30s OTP Rotation",    desc: "Code expires every 30 seconds" },
              { icon: "🚫", label: "3 Attempt Limit",     desc: "Lock on 3 consecutive failures" },
              { icon: "⏰", label: "24h Cooling Period",  desc: "Lockout resets after 24 hours" },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", gap: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{r.icon}</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{r.label}</p>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{r.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", display: "flex", gap: 10, alignItems: "center" }}>
              <AlertCircle size={16} style={{ color: "#f87171", flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "#f87171" }}>{error}</p>
            </div>
          )}

          <button
            onClick={handleSetupStart}
            disabled={loading}
            style={{
              padding: "16px 32px", borderRadius: 14, border: "none",
              background: loading ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg, #7C3AED, #a855f7)",
              color: "#fff", fontSize: 15, fontWeight: 800, cursor: loading ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: "0 0 32px rgba(124,58,237,0.35)", transition: "all 0.2s",
              width: "fit-content",
            }}
          >
            {loading ? <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Generating Secret...</> : "⚡ Generate QR Code & Link App"}
          </button>
        </div>
      )}

      {/* ── STEP: qr ─────────────────────────────────────────────────────────── */}
      {step === "qr" && setup && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* QR code display */}
          <div style={{ padding: 28, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", textAlign: "center" }}>Scan with Authenticator App</h2>

            {/* QR Code */}
            <div style={{ padding: 16, background: "#fff", borderRadius: 16, boxShadow: "0 0 40px rgba(124,58,237,0.25)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={setup.qrCode} alt="TOTP QR Code" width={240} height={240} style={{ display: "block", borderRadius: 8 }} />
            </div>

            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Open your authenticator app → tap ＋ → Scan QR code</p>
              <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "rgba(167,139,250,0.6)", textTransform: "uppercase", letterSpacing: "0.15em" }}>VaultProxy · TOTP · SHA-1 HMAC</p>
            </div>
          </div>

          {/* Manual key + instructions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Step-by-step */}
            <div style={{ padding: "22px 24px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 18, flex: 1 }}>
              <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>Setup Instructions</h3>
              {[
                "Open Google Authenticator, Microsoft Authenticator, or Authy",
                'Tap the "+" button to add a new account',
                'Choose "Scan QR Code" and point your camera at the code',
                'VaultProxy will appear in your app — you\'re linked!',
                "Click Next and enter the 6-digit code shown in the app",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#a78bfa", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{step}</p>
                </div>
              ))}
            </div>

            {/* Manual entry key */}
            <div style={{ padding: "18px 20px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
              <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: 10 }}>
                Can&apos;t scan? Enter this key manually:
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "#a78bfa", letterSpacing: "0.15em", wordBreak: "break-all" }}>
                  {setup.base32}
                </div>
                <button onClick={copyBase32} style={{ padding: "10px 12px", borderRadius: 8, background: copied ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)"}`, cursor: "pointer", color: copied ? "#34d399" : "var(--text-muted)", transition: "all 0.15s" }}>
                  {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <button
              onClick={() => { setStep("verify"); setOtp(["", "", "", "", "", ""]); setTimeout(() => inputRefs.current[0]?.focus(), 100); }}
              style={{ padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7C3AED, #a855f7)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 0 24px rgba(124,58,237,0.35)" }}
            >
              I&apos;ve scanned the code → Enter OTP
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: verify ─────────────────────────────────────────────────────── */}
      {step === "verify" && (
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ padding: "36px 36px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, boxShadow: "0 0 60px rgba(124,58,237,0.12)" }}>

            {/* Icon */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(167,139,250,0.1))", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 0 32px rgba(124,58,237,0.2)" }}>
                <span style={{ fontSize: 28 }}>📱</span>
              </div>
              <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
                Enter Authenticator Code
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Open your authenticator app and enter the 6-digit code shown for <strong style={{ color: "#a78bfa" }}>VaultProxy</strong>
              </p>
            </div>

            {/* OTP Timer bar */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)" }}>Code Valid For</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: otpTimer <= 10 ? "#f87171" : "#4cd7f6" }}>{otpTimer}s</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(otpTimer / 30) * 100}%`, background: otpTimer <= 10 ? "#f87171" : otpTimer <= 20 ? "#fbbf24" : "#4cd7f6", borderRadius: 999, transition: "width 0.5s linear, background 0.3s", boxShadow: `0 0 8px ${otpTimer <= 10 ? "#f87171" : "#4cd7f6"}` }} />
              </div>
            </div>

            {/* 6-digit OTP boxes */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20 }}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  disabled={!!lockedUntil}
                  style={{
                    width: 52, height: 60, borderRadius: 12, textAlign: "center",
                    fontSize: 24, fontWeight: 800, fontFamily: "var(--font-mono)",
                    background: digit ? "rgba(124,58,237,0.1)" : "rgba(255,255,255,0.03)",
                    border: `2px solid ${digit ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.08)"}`,
                    color: "#fff", outline: "none",
                    boxShadow: digit ? "0 0 12px rgba(124,58,237,0.2)" : "none",
                    transition: "all 0.15s",
                  }}
                />
              ))}
            </div>

            {/* Attempts indicator */}
            {!lockedUntil && attemptsLeft < 3 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 12 }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < attemptsLeft ? "#fbbf24" : "rgba(255,255,255,0.1)", boxShadow: i < attemptsLeft ? "0 0 6px #fbbf24" : "none" }} />
                ))}
                <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#fbbf24", marginLeft: 4 }}>{attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} left</span>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
                <AlertCircle size={14} style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: "#f87171", lineHeight: 1.4 }}>{error}</p>
              </div>
            )}

            {/* Locked state */}
            {lockedUntil && (
              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", textAlign: "center", marginBottom: 16 }}>
                <Lock size={20} style={{ color: "#f87171", margin: "0 auto 8px" }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 4 }}>Account Locked</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Unlocks in: <span style={{ fontFamily: "var(--font-mono)", color: "#f87171" }}>{lockCountdown}</span></p>
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={loading || otp.join("").length !== 6 || !!lockedUntil}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: (loading || otp.join("").length !== 6 || !!lockedUntil)
                  ? "rgba(124,58,237,0.2)"
                  : "linear-gradient(135deg, #7C3AED, #a855f7)",
                color: "#fff", fontSize: 14, fontWeight: 800,
                cursor: (loading || otp.join("").length !== 6 || !!lockedUntil) ? "not-allowed" : "pointer",
                boxShadow: (loading || otp.join("").length !== 6 || !!lockedUntil) ? "none" : "0 0 24px rgba(124,58,237,0.35)",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Verifying..." : "Confirm OTP →"}
            </button>

            <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 14 }}>
              Codes rotate every 30 seconds. If expired, wait for the next code.
            </p>
          </div>
        </div>
      )}

      {/* ── STEP: done ───────────────────────────────────────────────────────── */}
      {step === "done" && (
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ padding: "48px 40px", background: "var(--bg-card)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 20, boxShadow: "0 0 60px rgba(52,211,153,0.08)", textAlign: "center" }}>
            <div style={{ width: 88, height: 88, borderRadius: "50%", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 0 40px rgba(52,211,153,0.2)" }}>
              <ShieldCheck size={40} style={{ color: "#34d399" }} />
            </div>

            <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 26, fontWeight: 900, color: "var(--text-primary)", marginBottom: 10 }}>
              Authenticator App Linked!
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 28, maxWidth: 340, margin: "0 auto 28px" }}>
              Your VaultProxy account is now protected with TOTP 2FA. Future destructive agent actions will require your authenticator code.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32, textAlign: "left" }}>
              {[
                "✅ TOTP secret bound to your account",
                "✅ 6-digit codes valid for 30 seconds",
                "✅ 3-attempt lockout protection active",
                "✅ Required for all DESTRUCTIVE agent actions",
              ].map((item) => (
                <div key={item} style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.12)", fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
                  {item}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <Link href="/dashboard/settings" style={{ flex: 1, padding: "14px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
                Back to Settings
              </Link>
              <button
                onClick={resetFlow}
                style={{ flex: 1, padding: "14px", borderRadius: 12, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Set Up Another Device
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick test panel (visible during verify for hackathon demo) */}
      {step === "verify" && (
        <div style={{ marginTop: 24, padding: "16px 20px", background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 14, display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 18 }}>💡</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", marginBottom: 2 }}>Demo Tip</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
              Open your authenticator app and look for <strong style={{ color: "var(--text-primary)" }}>VaultProxy</strong>. Enter the 6-digit code exactly as shown. Codes rotate every 30s — the timer bar shows time remaining.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
