"use client";

import { useState, useEffect } from "react";

const SCRAMBLE_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEF";

function ScrambleToken({ value, scrambling }: { value: string; scrambling: boolean }) {
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
              : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
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
      style={{
        marginTop: 32,
        borderRadius: 24,
        border: "1px solid var(--border)",
        overflow: "hidden",
        background: "rgba(8,8,14,0.7)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Header / Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        id="attack-toggle-btn"
        aria-expanded={isOpen}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 28px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          transition: "var(--transition)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              background: "rgba(124,58,237,0.15)",
              border: "1px solid rgba(124,58,237,0.3)",
              flexShrink: 0,
            }}
          >
            🔍
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-syne)" }}>
              Security Comparison
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {isOpen ? "Click to collapse" : "See why token isolation matters — click to expand"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              padding: "6px 14px",
              borderRadius: 99,
              background: "rgba(124,58,237,0.15)",
              color: "var(--purple-light)",
              border: "1px solid rgba(124,58,237,0.3)",
            }}
          >
            Live Demo
          </span>
          <svg
            style={{
              width: 20,
              height: 20,
              color: "var(--text-muted)",
              transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              flexShrink: 0,
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable Panels */}
      <div
        style={{
          maxHeight: isOpen ? "900px" : "0",
          opacity: isOpen ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 0.55s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            padding: "0 24px 24px",
          }}
        >
          {/* ── LEFT: Without VaultProxy ─────────────────────────── */}
          <div
            style={{
              borderRadius: 20,
              padding: 28,
              position: "relative",
              overflow: "hidden",
              background: "linear-gradient(135deg, rgba(127,29,29,0.3), rgba(69,10,10,0.2))",
              border: "1px solid rgba(239,68,68,0.25)",
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateX(0)" : "translateX(-28px)",
              transition: "opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s",
            }}
          >
            {/* Live danger indicator */}
            <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--red)", animation: "pulse-red-dot 1.5s ease-in-out infinite", boxShadow: "0 0 8px rgba(239,68,68,0.8)" }} />
            </div>

            <h3
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#f87171",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: "var(--font-syne)",
              }}
            >
              <span style={{ fontSize: 20 }}>⚠️</span> Without VaultProxy
            </h3>

            {/* Request block */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(248,113,113,0.5)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 10 }}>
                → Typical Agent Request (Exposed)
              </p>
              <div
                style={{
                  padding: "16px",
                  borderRadius: 12,
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  lineHeight: 1.9,
                }}
              >
                <div style={{ color: "rgba(255,255,255,0.2)" }}>POST /gmail/v1/users/me/messages</div>
                <div style={{ color: "rgba(255,255,255,0.2)" }}>Host: www.googleapis.com</div>
                <div>
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>Authorization: </span>
                  <span className="fake-token">
                    Bearer <ScrambleToken value="ya29.a0AfH6SMB..." scrambling={isOpen} />
                  </span>
                </div>
                <div>
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>X-API-Key: </span>
                  <span className="fake-token" style={{ animationDelay: "0.3s" }}>
                    <ScrambleToken value="AIzaSy-r3alKey!!" scrambling={isOpen} />
                  </span>
                </div>
                <div style={{ borderTop: "1px solid rgba(239,68,68,0.1)", marginTop: 8, paddingTop: 8 }}>
                  <span style={{ color: "rgba(239,68,68,0.4)", fontSize: 11 }}>
                    {"// Token sitting in process.env"}<br />
                    {"// Visible in logs, memory dumps"}<br />
                    {"// One leak = full account access"}
                  </span>
                </div>
              </div>
            </div>

            {/* Risk items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "Raw token in environment variable",
                "Agent holds credential indefinitely",
                "No scope enforcement (full API access)",
                "No audit trail",
                "Cannot revoke without rotating credentials",
              ].map((text, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.15)",
                    borderLeft: "3px solid var(--red)",
                    borderRadius: 10,
                    fontSize: 12,
                    color: "#f87171",
                    fontWeight: 500,
                    opacity: revealed ? 1 : 0,
                    transform: revealed ? "translateX(0)" : "translateX(-12px)",
                    transition: `opacity 0.4s ease ${0.2 + i * 0.07}s, transform 0.4s ease ${0.2 + i * 0.07}s`,
                  }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0 }}>🚨</span>
                  {text}
                </div>
              ))}
            </div>

            {/* Watermark */}
            <div
              style={{
                position: "absolute",
                bottom: -20,
                right: -20,
                fontSize: 80,
                opacity: 0.04,
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              🔓
            </div>
          </div>

          {/* ── RIGHT: With VaultProxy ────────────────────────────── */}
          <div
            style={{
              borderRadius: 20,
              padding: 28,
              position: "relative",
              overflow: "hidden",
              background: "linear-gradient(135deg, rgba(6,78,59,0.25), rgba(4,47,36,0.15))",
              border: "1px solid rgba(16,185,129,0.25)",
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateX(0)" : "translateX(28px)",
              transition: "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s",
            }}
          >
            {/* Live safe indicator */}
            <div style={{ position: "absolute", top: 14, right: 14 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 8px rgba(16,185,129,0.8)", animation: "pulse-green 2s infinite" }} />
            </div>

            <h3
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#34d399",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: "var(--font-syne)",
              }}
            >
              <span style={{ fontSize: 20 }}>✅</span> With VaultProxy
            </h3>

            {/* Request block */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(52,211,153,0.5)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 10 }}>
                → VaultProxy Agent Request (Secured)
              </p>
              <div
                style={{
                  padding: "16px",
                  borderRadius: 12,
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid rgba(16,185,129,0.15)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  lineHeight: 1.9,
                }}
              >
                <div style={{ color: "rgba(255,255,255,0.2)" }}>POST /api/agent/run</div>
                <div style={{ color: "rgba(255,255,255,0.2)" }}>Host: vaultproxy.app</div>
                <div>
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>Authorization: </span>
                  <span className="real-token">Bearer eyJhbGciOiJSUzI...</span>
                </div>
                <div>
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>X-Vault-Signature: </span>
                  <span className="real-token">hmac-sha256-a4f2...</span>
                </div>
                <div style={{ borderTop: "1px solid rgba(16,185,129,0.1)", marginTop: 8, paddingTop: 8 }}>
                  <span style={{ color: "rgba(16,185,129,0.4)", fontSize: 11 }}>
                    {"// Real token never leaves Auth0 Vault"}<br />
                    {"// Fetched per-request, discarded after"}<br />
                    {"// Agent sees: undefined"}
                  </span>
                </div>
              </div>
            </div>

            {/* Safe items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "Token stored in Auth0 Token Vault only",
                "Fetched fresh per-action, discarded after",
                "Scoped to minimum required permissions",
                "Full immutable audit trail",
                "Revoke instantly from dashboard",
              ].map((text, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    background: "rgba(16,185,129,0.06)",
                    border: "1px solid rgba(16,185,129,0.15)",
                    borderLeft: "3px solid var(--green)",
                    borderRadius: 10,
                    fontSize: 12,
                    color: "#34d399",
                    fontWeight: 500,
                    opacity: revealed ? 1 : 0,
                    transform: revealed ? "translateX(0)" : "translateX(12px)",
                    transition: `opacity 0.4s ease ${0.3 + i * 0.07}s, transform 0.4s ease ${0.3 + i * 0.07}s`,
                  }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0 }}>🛡️</span>
                  {text}
                </div>
              ))}
            </div>

            {/* Watermark */}
            <div
              style={{
                position: "absolute",
                bottom: -20,
                right: -20,
                fontSize: 80,
                opacity: 0.04,
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              🛡️
            </div>
          </div>
        </div>

        {/* Footnote */}
        <div
          style={{
            padding: "0 28px 24px",
            textAlign: "center",
            opacity: revealed ? 1 : 0,
            transition: "opacity 0.5s ease 0.6s",
          }}
        >
          <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
            VaultProxy — Zero-Knowledge Credential Broker · Auth0 Token Exchange (RFC 8693)
          </p>
        </div>
      </div>
    </div>
  );
}
