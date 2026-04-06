"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [enrolled] = useState(true); // Mocking that they have MFA, just UI demo

  function handleEnroll() {
    setLoading(true);
    // In a real Auth0 app, we redirect to MFA enrollment
    setTimeout(() => {
      window.location.href = "/dashboard/settings/password";
    }, 800);
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
          Security Settings
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
          Manage your Zero-Trust Agent configurations and multi-factor authentication.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* MFA Card */}
        <div className="section-card" style={{ padding: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
              }}
            >
              🔐
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, fontFamily: "var(--font-syne)" }}>
                Multi-Factor Authentication (MFA)
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                Require an additional verification step when agents attempt to perform <strong style={{color:"#ef4444"}}>DESTRUCTIVE</strong> actions on your behalf.
              </p>
            </div>
          </div>

          <div
            style={{
              padding: 20,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                Authenticator App / Passkey
              </p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                Status: {enrolled ? <span style={{color:"#34d399", fontWeight:700}}>ACTIVE</span> : <span style={{color:"var(--text-muted)"}}>NOT ENROLLED</span>}
              </p>
            </div>
            <button
              className="btn-primary"
              onClick={handleEnroll}
              disabled={loading}
              style={{
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 10,
                background: "rgba(124,58,237,0.2)",
                border: "1px solid var(--purple)",
                color: "#fff",
              }}
            >
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="spinner-sm" /> Redirecting...
                </div>
              ) : (
                "Configure / Test MFA"
              )}
            </button>
          </div>
        </div>

        {/* Global Policy Settings */}
        <div className="section-card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, fontFamily: "var(--font-syne)" }}>
            Agent Global Policies
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
             
             {/* Read-only toggle */}
             <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--border)"}}>
                <div>
                   <p style={{ fontSize: 15, fontWeight: 700 }}>Auto-Approve READ Actions</p>
                   <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Agents can fetch un-mutating data without pinging your dashboard.</p>
                </div>
                <div style={{ width: 44, height: 24, borderRadius: 12, background: "var(--purple)", position: "relative" }}>
                   <div style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: "50%", background: "#fff" }} />
                </div>
             </div>

             {/* Human in the loop toggle */}
             <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--border)"}}>
                <div>
                   <p style={{ fontSize: 15, fontWeight: 700 }}>Strict WRITE Quarantining</p>
                   <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Any mutation action requires explicit Human-in-the-Loop review.</p>
                </div>
                <div style={{ width: 44, height: 24, borderRadius: 12, background: "var(--purple)", position: "relative" }}>
                   <div style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: "50%", background: "#fff" }} />
                </div>
             </div>

          </div>
        </div>

      </div>
    </div>
  );
}
