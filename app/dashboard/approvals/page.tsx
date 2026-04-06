"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, Check } from "lucide-react";

interface PendingAction {
  id: string;
  run_id: string;
  action_name: string;
  action_data: Record<string, unknown>;
  status: string;
  created_at: string;
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
    <div
      className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}
      style={{ display: "flex", alignItems: "center", gap: "8px" }}
    >
      {toast.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />} {toast.message}
    </div>
  );
}

export default function ApprovalsPage() {
  const [pending, setPending] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastType>(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/pending");
      if (!res.ok) return;
      const data = await res.json();
      setPending(data.pending ?? []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 4000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  async function handleApprove(actionId: string) {
    setProcessingId(actionId);
    try {
      const res = await fetch("/api/agent/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId }),
      });
      if (!res.ok) throw new Error("Failed");
      setToast({ message: "Action approved and executing", type: "success" });
      setPending((prev) => prev.filter((p) => p.id !== actionId));
    } catch {
      setToast({ message: "Failed to approve action", type: "error" });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDeny(actionId: string) {
    setProcessingId(actionId);
    try {
      const res = await fetch("/api/agent/deny", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId }),
      });
      if (!res.ok) throw new Error("Failed");
      setToast({ message: "Action denied. Agent notified.", type: "error" });
      setPending((prev) => prev.filter((p) => p.id !== actionId));
    } catch {
      setToast({ message: "Failed to deny action", type: "error" });
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="animate-fade-in">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <header style={{ marginBottom: 36, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
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
            Approval Queue
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
            Secure human-in-the-loop authorization.
          </p>
        </div>
        {pending.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              background: "rgba(245,158,11,0.15)",
              border: "1px solid rgba(245,158,11,0.4)",
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 700,
              color: "#fbbf24",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#f59e0b",
                animation: "pulse-slow 1.5s ease-in-out infinite",
              }}
            />
            {pending.length} Pending
          </div>
        )}
      </header>

      {loading && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div className="spinner-lg" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.15em" }}>
            Loading pending actions...
          </p>
        </div>
      )}

      {!loading && pending.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "100px 40px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              marginBottom: 24,
              animation: "float 4s ease-in-out infinite",
              color: "#10b981",
            }}
          >
            <Check size={36} strokeWidth={3} />
          </div>
          <h2
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 12,
            }}
          >
            No Pending Approvals
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", maxWidth: 360 }}>
            All agent actions are within auto-approved limits or have been
            resolved.
          </p>
        </div>
      )}

      {!loading && pending.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {pending.map((item) => {
            const isDestructive =
              item.action_name.toLowerCase().includes("delete") ||
              item.action_name.toLowerCase().includes("remove") ||
              item.action_name.toLowerCase().includes("destroy");

            return (
              <div
                key={item.id}
                className={`approval-card ${isDestructive ? "destructive" : ""}`}
                style={{
                  animation: "slide-up 0.35s cubic-bezier(0.16,1,0.3,1) both",
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      background: isDestructive
                        ? "rgba(239,68,68,0.12)"
                        : "rgba(245,158,11,0.12)",
                      border: `1px solid ${
                        isDestructive
                          ? "rgba(239,68,68,0.3)"
                          : "rgba(245,158,11,0.3)"
                      }`,
                    }}
                  >
                    <span
                      className={isDestructive ? "chip-destructive" : "chip-write"}
                    >
                      {isDestructive ? "DESTRUCTIVE" : "WRITE"}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontFamily: "var(--font-syne)",
                        fontSize: 18,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: 4,
                      }}
                    >
                      {item.action_name}
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        fontSize: 12,
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      <span>ID: {item.id.slice(0, 8)}…</span>
                      <span>
                        {new Date(item.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action data */}
                <div
                  style={{
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 12,
                    padding: "14px 18px",
                    marginBottom: 20,
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "rgba(148,163,184,0.8)",
                    overflow: "auto",
                    maxHeight: 150,
                    lineHeight: 1.7,
                  }}
                >
                  <pre>{JSON.stringify(item.action_data, null, 2)}</pre>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    className="btn-approve"
                    disabled={processingId === item.id}
                    onClick={() => handleApprove(item.id)}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    {processingId === item.id ? (
                      <div className="spinner-sm" />
                    ) : <CheckCircle size={16} />}
                    Approve
                  </button>
                  <button
                    className="btn-deny"
                    disabled={processingId === item.id}
                    onClick={() => handleDeny(item.id)}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    <XCircle size={16} />
                    Deny
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
