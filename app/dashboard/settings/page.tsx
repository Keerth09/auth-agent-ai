"use client";

import { useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [toggles, setToggles] = useState({
    hardwareKeys: true,
    ipWhitelisting: false,
    sessionAutoRevoke: true,
    autoApproveRead: true,
    strictWrite: true,
  });
  const [dangerzoneHover, setDangerzoneHover] = useState<string | null>(null);

  const toggle = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  function handleMFA() {
    setLoading(true);
    setTimeout(() => { window.location.href = "/dashboard/settings/mfa"; }, 500);
  }

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <div
      onClick={onClick}
      style={{
        width: 48, height: 26, borderRadius: 13, cursor: "pointer",
        background: on ? "linear-gradient(135deg, #7C3AED, #a78bfa)" : "rgba(255,255,255,0.08)",
        border: `1px solid ${on ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.12)"}`,
        position: "relative", transition: "all 0.2s ease",
        boxShadow: on ? "0 0 12px rgba(124,58,237,0.4)" : "none",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute", top: 3,
          left: on ? "auto" : 3, right: on ? 3 : "auto",
          width: 18, height: 18, borderRadius: "50%",
          background: "#fff",
          boxShadow: on ? "0 0 6px rgba(124,58,237,0.5)" : "none",
          transition: "all 0.2s ease",
        }}
      />
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 32 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 34, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 4 }}>
          Security Settings
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Manage your identity vault and workspace authorization protocols.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>

        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* User Profile Card */}
          <div style={{ padding: "28px 28px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -32, right: -32, width: 120, height: 120, background: "rgba(124,58,237,0.05)", borderRadius: "50%", filter: "blur(40px)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 24, position: "relative", zIndex: 1 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 80, height: 80, borderRadius: 16, background: "linear-gradient(135deg, #7C3AED, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#fff", fontFamily: "var(--font-syne)", overflow: "hidden" }}>
                  🔐
                </div>
                <div style={{ position: "absolute", bottom: -4, right: -4, background: "#4cd7f6", padding: "3px 6px", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, border: "2px solid var(--bg-primary)" }}>
                  ✅
                </div>
              </div>
              <div>
                <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>System Administrator</h2>
                <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "#a78bfa", marginBottom: 14 }}>Senior Security Architect · Level 4 Clearance</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer" }}>Edit Profile</button>
                  <button style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer" }}>Update Avatar</button>
                </div>
              </div>
            </div>
          </div>

          {/* Workspace Compliance */}
          <div style={{ padding: "24px 28px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 20 }}>🛡️</span>
              <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Workspace Compliance</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { key: "hardwareKeys" as const, label: "Enforce Hardware Keys", desc: "Require FIDO2 keys for all privileged operations." },
                { key: "ipWhitelisting" as const, label: "IP Whitelisting", desc: "Restrict access to corporate VPN ranges only." },
                { key: "sessionAutoRevoke" as const, label: "Session Auto-Revoke", desc: "Terminate sessions after 12 hours of inactivity." },
              ].map((row) => (
                <div key={row.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{row.label}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{row.desc}</p>
                  </div>
                  <Toggle on={toggles[row.key]} onClick={() => toggle(row.key)} />
                </div>
              ))}
            </div>
          </div>


          {/* Agent Policies */}
          <div style={{ padding: "24px 28px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16 }}>
            <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>Agent Global Policies</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { key: "autoApproveRead" as const, label: "Auto-Approve READ Actions", desc: "Agents can fetch non-mutating data without pinging your dashboard." },
                { key: "strictWrite" as const, label: "Strict WRITE Quarantining", desc: "Any mutation action requires explicit Human-in-the-Loop review." },
              ].map((row, i, arr) => (
                <div key={row.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{row.label}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{row.desc}</p>
                  </div>
                  <Toggle on={toggles[row.key]} onClick={() => toggle(row.key)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — MFA + Danger Zone */}
        <div style={{ position: "sticky", top: 80 }}>
          <div style={{ padding: "30px", background: "rgba(50,53,60,0.6)", backdropFilter: "blur(24px)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 20, boxShadow: "0 0 50px rgba(167,139,250,0.1)" }}>

            {/* MFA header */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 14, boxShadow: "0 0 24px rgba(124,58,237,0.3)" }}>
                🔐
              </div>
              <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>MFA Protocols</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Status: <span style={{ color: "#4cd7f6", fontWeight: 700 }}>Securely Armored</span>
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* TOTP */}
              <div style={{ padding: "18px", borderRadius: 14, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>📳</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Authenticator App (TOTP)</p>
                      <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.15em", color: "#a78bfa", marginTop: 2 }}>Recommended</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 18, color: "#4cd7f6" }}>✅</span>
                </div>
                <button
                  onClick={handleMFA}
                  disabled={loading}
                  style={{ width: "100%", padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}
                >
                  {loading ? "Redirecting..." : "Manage App"}
                </button>
              </div>

              {/* SMS Backup */}
              <div style={{ padding: "18px", borderRadius: 14, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18, opacity: 0.5 }}>💬</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>SMS / Email Backup</p>
                      <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)", marginTop: 2 }}>Secondary Fallback</p>
                    </div>
                  </div>
                  <button style={{ background: "none", border: "none", fontSize: 11, fontWeight: 800, color: "#a78bfa", cursor: "pointer" }}>Setup</button>
                </div>
                <p style={{ fontSize: 10, fontStyle: "italic", color: "var(--text-muted)" }}>Required for emergency account recovery access.</p>
              </div>

              {/* Recovery Codes */}
              <div style={{ padding: "18px", borderRadius: 14, background: "rgba(0,0,0,0.15)", border: "2px dashed rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 16, color: "#fbbf24" }}>🗝️</span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Recovery Codes</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
                  {["****-****-****", "****-****-****"].map((c, i) => (
                    <div key={i} style={{ padding: "8px", borderRadius: 8, background: "rgba(0,0,0,0.3)", fontFamily: "var(--font-mono)", fontSize: 10, textAlign: "center", color: "var(--text-muted)" }}>{c}</div>
                  ))}
                </div>
                <button style={{ width: "100%", padding: "10px", borderRadius: 10, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", cursor: "pointer" }}>
                  Generate New Codes
                </button>
              </div>
            </div>

            {/* Login Activity Link */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <h4 style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "#4cd7f6", marginBottom: 10 }}>🔍 Login Activity</h4>
              <Link href="/dashboard/settings/activity" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, background: "rgba(76,215,246,0.05)", border: "1px solid rgba(76,215,246,0.15)", textDecoration: "none", transition: "all 0.15s" }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>View Login History</p>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>Devices, locations, IPs &amp; risk alerts</p>
                </div>
                <span style={{ fontSize: 12, color: "#4cd7f6", fontWeight: 700 }}>→</span>
              </Link>
            </div>

            {/* Danger Zone */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <h4 style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "#f87171", marginBottom: 12 }}>⚠ Danger Zone</h4>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Freeze Vault Access", icon: "🧊" },
                  { label: "Purge Workspace Identity", icon: "🗑️" },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onMouseEnter={() => setDangerzoneHover(btn.label)}
                    onMouseLeave={() => setDangerzoneHover(null)}
                    style={{
                      width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: 12,
                      background: dangerzoneHover === btn.label ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.06)",
                      border: `1px solid rgba(239,68,68,${dangerzoneHover === btn.label ? 0.35 : 0.12})`,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#f87171" }}>{btn.label}</span>
                    <span style={{ fontSize: 16, opacity: dangerzoneHover === btn.label ? 1 : 0.5, transition: "opacity 0.15s" }}>{btn.icon}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Audit pulse widget */}
          <div style={{ marginTop: 12, padding: "12px 18px", borderRadius: 99, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(76,215,246,0.2)", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
            <div style={{ position: "relative", width: 8, height: 8 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#4cd7f6", opacity: 0.7, animation: "pulse-green 2s infinite" }} />
              <div style={{ position: "relative", width: 8, height: 8, borderRadius: "50%", background: "#4cd7f6" }} />
            </div>
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#4cd7f6" }}>Real-Time Security Audit Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
