"use client";

import { useState, useEffect } from "react";

const FAKE_TOKEN_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEF";

function ScrambleToken({ value, scrambling }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!scrambling) { setDisplay(value); return; }
    let iter = 0;
    const interval = setInterval(() => {
      setDisplay(
        value
          .split("")
          .map((char, idx) =>
            idx < iter
              ? char
              : FAKE_TOKEN_CHARS[Math.floor(Math.random() * FAKE_TOKEN_CHARS.length)]
          )
          .join("")
      );
      if (iter >= value.length) clearInterval(interval);
      iter += 0.5;
    }, 40);
    return () => clearInterval(interval);
  }, [scrambling, value]);

  return <span>{display}</span>;
}

export default function AttackToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setRevealed(true), 100);
      return () => clearTimeout(t);
    } else {
      setRevealed(false);
    }
  }, [isOpen]);

  return (
    <div
      className="mt-8 rounded-3xl border border-white/8 overflow-hidden"
      style={{ background: "rgba(14, 14, 20, 0.6)", backdropFilter: "blur(20px)" }}
    >
      {/* Header / Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left attack-toggle-header"
        id="attack-toggle-btn"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}
          >
            🔍
          </div>
          <div>
            <p className="text-white font-bold text-base tracking-tight">Security Comparison</p>
            <p className="text-zinc-600 text-xs font-medium mt-0.5">Click to see VaultProxy vs. exposed credentials</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
            style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}
          >
            Demo
          </span>
          <svg
            className={`w-5 h-5 text-zinc-600 transition-transform duration-400 ${isOpen ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable Panels */}
      <div
        style={{
          maxHeight: isOpen ? "800px" : "0",
          opacity: isOpen ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 0.55s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 pt-0">

          {/* ── LEFT: Without VaultProxy ───────────────────── */}
          <div
            className="rounded-2xl p-8 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(127,29,29,0.3) 0%, rgba(69,10,10,0.2) 100%)",
              border: "1px solid rgba(239,68,68,0.25)",
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateX(0)" : "translateX(-24px)",
              transition: "opacity 0.5s ease, transform 0.5s ease",
              transitionDelay: "0.1s",
            }}
          >
            {/* Corner indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute opacity-30" />
              <div className="w-2 h-2 rounded-full bg-red-500 relative" />
            </div>

            <h3 className="text-lg font-black text-red-400 mb-6 flex items-center gap-3">
              <span className="text-2xl">⚠️</span> Without VaultProxy
            </h3>

            <div className="space-y-5">
              {/* Request Headers */}
              <div>
                <p className="text-red-400/50 mb-2 uppercase tracking-widest text-[9px] font-bold">
                  → Request Headers (Exposed)
                </p>
                <div
                  className="p-4 rounded-xl space-y-2.5 font-mono text-xs"
                  style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(239,68,68,0.15)" }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white/30 select-none">Authorization:</span>
                    <span className="fake-token font-bold">
                      Bearer{" "}
                      <ScrambleToken value="ya29.a0AfH6SMB..." scrambling={isOpen} />
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/30 select-none">X-API-Key:</span>
                    <span className="fake-token font-bold" style={{ animationDelay: "0.3s" }}>
                      <ScrambleToken value="AIzaSy-r3alKey!!" scrambling={isOpen} />
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/30 select-none">X-Client-Secret:</span>
                    <span className="fake-token font-bold" style={{ animationDelay: "0.6s" }}>
                      <ScrambleToken value="s3cr3t_0auth_tok" scrambling={isOpen} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk indicators */}
              <div className="space-y-2">
                {[
                  "Token lives in agent memory — any crash = leak",
                  "No scope enforcement — full API access granted",
                  "No audit trail — no revocation possible",
                  "Replay attack surface — tokens reusable",
                ].map((text, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl text-red-300 text-xs font-medium"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.15)",
                      borderLeft: "3px solid #ef4444",
                      opacity: revealed ? 1 : 0,
                      transform: revealed ? "translateX(0)" : "translateX(-12px)",
                      transition: `opacity 0.4s ease ${0.2 + i * 0.08}s, transform 0.4s ease ${0.2 + i * 0.08}s`,
                    }}
                  >
                    <span className="text-base flex-shrink-0">🚨</span>
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Watermark */}
            <div className="absolute -bottom-6 -right-6 text-8xl opacity-[0.04] select-none pointer-events-none">🔓</div>
          </div>

          {/* ── RIGHT: With VaultProxy ─────────────────────── */}
          <div
            className="rounded-2xl p-8 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(6,78,59,0.25) 0%, rgba(4,47,36,0.15) 100%)",
              border: "1px solid rgba(16,185,129,0.25)",
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateX(0)" : "translateX(24px)",
              transition: "opacity 0.5s ease, transform 0.5s ease",
              transitionDelay: "0.2s",
            }}
          >
            {/* Corner indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" style={{ boxShadow: "0 0 8px rgba(16,185,129,0.8)" }} />
            </div>

            <h3 className="text-lg font-black text-emerald-400 mb-6 flex items-center gap-3">
              <span className="text-2xl">✅</span> With VaultProxy
            </h3>

            <div className="space-y-5">
              {/* Request Headers */}
              <div>
                <p className="text-emerald-400/50 mb-2 uppercase tracking-widest text-[9px] font-bold">
                  → Request Headers (Secured)
                </p>
                <div
                  className="p-4 rounded-xl space-y-2.5 font-mono text-xs"
                  style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(16,185,129,0.15)" }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white/30 select-none">Authorization:</span>
                    <span className="real-token font-bold">Bearer [JWT — scoped]</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/30 select-none">X-Vault-Sig:</span>
                    <span className="real-token font-bold">hmac-sha256=a4f2…</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/30 select-none">X-Vault-Scope:</span>
                    <span className="real-token font-bold">gmail.readonly</span>
                  </div>
                </div>
              </div>

              {/* Safety indicators */}
              <div className="space-y-2">
                {[
                  "Token stored encrypted in Auth0 Vault — never in memory",
                  "RFC 8693 scoped exchange — principle of least privilege",
                  "Immutable audit trail — full revocation chain",
                  "One-time-use tokens — replay attacks impossible",
                ].map((text, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl text-emerald-300 text-xs font-medium"
                    style={{
                      background: "rgba(16,185,129,0.07)",
                      border: "1px solid rgba(16,185,129,0.15)",
                      borderLeft: "3px solid #10b981",
                      opacity: revealed ? 1 : 0,
                      transform: revealed ? "translateX(0)" : "translateX(12px)",
                      transition: `opacity 0.4s ease ${0.3 + i * 0.08}s, transform 0.4s ease ${0.3 + i * 0.08}s`,
                    }}
                  >
                    <span className="text-base flex-shrink-0">🛡️</span>
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Watermark */}
            <div className="absolute -bottom-6 -right-6 text-8xl opacity-[0.04] select-none pointer-events-none">🛡️</div>
          </div>
        </div>

        {/* Bottom footnote */}
        <div
          className="px-6 pb-6 text-center"
          style={{
            opacity: revealed ? 1 : 0,
            transition: "opacity 0.5s ease 0.5s",
          }}
        >
          <p className="text-[10px] text-zinc-700 uppercase tracking-widest font-bold">
            VaultProxy — Zero-Knowledge Credential Broker for AI Agents · Auth0 Token Exchange (RFC 8693)
          </p>
        </div>
      </div>
    </div>
  );
}
