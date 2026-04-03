"use client";

import { useEffect, useState, useCallback } from "react";

interface Connection {
  connection: string;
  isRevoked: boolean;
  grantId?: string;
}

type ToastType = { message: string; type: "success" | "error" } | null;

function Toast({ toast, onClose }: { toast: ToastType; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
      {toast.type === "success" ? "✅" : "❌"} {toast.message}
    </div>
  );
}

export default function VaultPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastType>(null);

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/tokens");
      if (!res.ok) return;
      const data = await res.json();
      setConnections(data.connections ?? []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  async function handleRevoke(connectionName: string) {
    if (!confirm(`Revoke access for ${connectionName}? This cannot be undone without re-connecting.`)) return;
    setRevoking(connectionName);
    try {
      const res = await fetch("/api/tokens/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection: connectionName }),
      });
      if (!res.ok) throw new Error("Failed");
      setToast({ message: `${connectionName} access revoked successfully`, type: "success" });
      fetchConnections();
    } catch {
      setToast({ message: "Failed to revoke connection", type: "error" });
    } finally {
      setRevoking(null);
    }
  }

  const getConnectionIcon = (name: string) => {
    if (name.includes("google")) return "G";
    if (name.includes("github")) return "GH";
    if (name.includes("slack")) return "S";
    return "V";
  };

  const getConnectionLabel = (name: string) => {
    if (name.includes("google")) return "Google OAuth2";
    if (name.includes("github")) return "GitHub";
    if (name.includes("slack")) return "Slack";
    return name;
  };

  const getConnectionColor = (name: string) => {
    if (name.includes("google")) return { bg: "rgba(66,133,244,0.15)", text: "#60a5fa" };
    if (name.includes("github")) return { bg: "rgba(255,255,255,0.08)", text: "#94a3b8" };
    return { bg: "rgba(124,58,237,0.15)", text: "#a78bfa" };
  };

  return (
    <div className="animate-fade-in">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <header style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 36, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 6 }}>
          Token Vault
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
          Manages RFC 8693 token exchange endpoints — real tokens never touch your app.
        </p>
      </header>

      {/* Vault info banner */}
      <div
        style={{
          padding: "20px 24px",
          background: "rgba(124,58,237,0.08)",
          border: "1px solid rgba(124,58,237,0.25)",
          borderRadius: 16,
          marginBottom: 28,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 28, flexShrink: 0 }}>🔐</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--purple-light)", marginBottom: 4 }}>
            Auth0 Token Vault — Active
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Tokens are stored encrypted in Auth0's secure vault and retrieved per-request via{" "}
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--purple-light)", fontSize: 12 }}>
              RFC 8693 Token Exchange
            </span>
            . They are discarded immediately after use and never persisted in this application.
          </div>
        </div>
      </div>

      {/* How vault works */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 36,
        }}
      >
        {[
          { step: "01", icon: "🔑", title: "OAuth Grant", desc: "User authorizes once via OAuth. Auth0 stores the refresh token in the Vault." },
          { step: "02", icon: "⚡", title: "Token Exchange", desc: "Agent sends a JWT. VaultProxy exchanges it for a scoped access token via RFC 8693." },
          { step: "03", icon: "🗑️", title: "Immediate Discard", desc: "Token is used for one action, then discarded. Never stored in our DB." },
        ].map((item) => (
          <div
            key={item.step}
            style={{
              padding: "20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: "var(--purple-light)", letterSpacing: "0.15em", marginBottom: 10, fontFamily: "var(--font-mono)" }}>
              {item.step} —
            </div>
            <div style={{ fontSize: 20, marginBottom: 10 }}>{item.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{item.title}</div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Connections */}
      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
          Connected Services
        </h2>
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {connections.filter((c) => !c.isRevoked).length} active
        </span>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div className="spinner-lg" style={{ margin: "0 auto 16px" }} />
        </div>
      )}

      {!loading && connections.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "80px 40px",
            background: "var(--bg-card)",
            border: "1px dashed var(--border)",
            borderRadius: 20,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.3 }}>🔓</div>
          <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            No Vaults Connected
          </h3>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Complete the OAuth flow via Auth0 to connect a service.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {connections.map((conn) => {
          const colors = getConnectionColor(conn.connection);
          return (
            <div
              key={conn.connection}
              className="section-card animate-slide-up"
              style={{
                padding: "24px 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
                borderLeft: `3px solid ${conn.isRevoked ? "var(--red)" : "var(--green)"}`,
                opacity: conn.isRevoked ? 0.6 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: conn.isRevoked ? "rgba(30,30,40,0.6)" : colors.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 900,
                    color: conn.isRevoked ? "var(--text-muted)" : colors.text,
                    boxShadow: conn.isRevoked ? "none" : `0 0 20px ${colors.bg}`,
                    flexShrink: 0,
                  }}
                >
                  {getConnectionIcon(conn.connection)}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                    {getConnectionLabel(conn.connection)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: conn.isRevoked ? "var(--red)" : "var(--green)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: conn.isRevoked ? "var(--red)" : "var(--green)",
                          boxShadow: conn.isRevoked ? "none" : "0 0 6px rgba(16,185,129,0.8)",
                          animation: conn.isRevoked ? "none" : "pulse-green 2s infinite",
                        }}
                      />
                      {conn.isRevoked ? "Revoked" : "Encrypted & Mounted"}
                    </div>
                    {conn.grantId && (
                      <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        Grant: {conn.grantId.slice(0, 8)}…
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Token Exchange badge */}
                <div
                  style={{
                    padding: "6px 14px",
                    background: "rgba(124,58,237,0.1)",
                    border: "1px solid rgba(124,58,237,0.2)",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--purple-light)",
                    fontFamily: "var(--font-mono)",
                    whiteSpace: "nowrap",
                  }}
                >
                  RFC 8693
                </div>
                {!conn.isRevoked && (
                  <button
                    onClick={() => handleRevoke(conn.connection)}
                    disabled={revoking === conn.connection}
                    style={{
                      padding: "8px 16px",
                      background: "transparent",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: 10,
                      color: "var(--red)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      transition: "var(--transition)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {revoking === conn.connection ? (
                      <div className="spinner-sm" />
                    ) : null}
                    Emergency Revoke
                  </button>
                )}
                {conn.isRevoked && (
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                    Re-authorize via OAuth to reconnect
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security note */}
      <div
        style={{
          marginTop: 32,
          padding: "16px 20px",
          background: "rgba(16,185,129,0.05)",
          border: "1px solid rgba(16,185,129,0.15)",
          borderRadius: 12,
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.7,
        }}
      >
        <span style={{ fontWeight: 700, color: "var(--green)" }}>🛡️ Security note: </span>
        Token fingerprints (first 8 + last 4 chars) are stored in the audit log for traceability.{" "}
        Full tokens are never written to disk, memory dumps, or logs.{" "}
        Revocation is instant and propagated to Auth0.
      </div>
    </div>
  );
}
