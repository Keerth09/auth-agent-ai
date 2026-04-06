"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import VaultProxyLogo from "@/components/VaultProxyLogo";

interface User {
  name?: string;
  email?: string;
  picture?: string;
  sub?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: string | number | null;
  badgeColor?: string;
}

function SecurityStatusBar() {
  return (
    <div className="security-status-bar">
      {[
        { icon: "🔐", label: "Token Vault", value: "Connected", ok: true },
        { icon: "🛡️", label: "Permission Engine", value: "Active", ok: true },
        { icon: "📋", label: "Session", value: "Secure (HTTP-only)", ok: true },
      ].map((s) => (
        <div key={s.label} className="status-indicator">
          <div className={`status-dot ${s.ok ? "green" : "red"}`} />
          <span>
            {s.icon} {s.label}:&nbsp;
          </span>
          <span className={s.ok ? "status-value-green" : "status-value-red"}>
            {s.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [vaultOk] = useState(true);

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await fetch("/api/audit/stats");
      if (!res.ok) return;
      const data = await res.json();
      setPendingCount(data.pendingApproval ?? 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/auth/status");
        if (!res.ok) {
        window.location.href = "/auth/login";
          return;
        }
        const data = await res.json();
        if (!data.authenticated) {
        window.location.href = "/auth/login";
          return;
        }
        setUser(data.user);
      } catch {
        window.location.href = "/auth/login";
      } finally {
        setLoading(false);
      }
    }
    init();
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 5000);
    return () => clearInterval(interval);
  }, [fetchPendingCount]);

  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊", href: "/dashboard" },
    { id: "run", label: "Run Agent", icon: "⚡", href: "/dashboard/run" },
    {
      id: "approvals",
      label: "Approvals",
      icon: "⏸️",
      href: "/dashboard/approvals",
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: "bg-red-500",
    },
    {
      id: "vault",
      label: "Token Vault",
      icon: "🔐",
      href: "/dashboard/vault",
      badge: vaultOk ? "●" : "!",
      badgeColor: vaultOk ? "text-green-400" : "text-red-400",
    },
    { id: "audit", label: "Audit Logs", icon: "📋", href: "/dashboard/audit" },
    { id: "settings", label: "Settings", icon: "⚙️", href: "/dashboard/settings" },
  ];

  const getActiveId = () => {
    if (pathname === "/dashboard") return "dashboard";
    if (pathname.startsWith("/dashboard/run")) return "run";
    if (pathname.startsWith("/dashboard/approvals")) return "approvals";
    if (pathname.startsWith("/dashboard/vault")) return "vault";
    if (pathname.startsWith("/dashboard/audit")) return "audit";
    if (pathname.startsWith("/dashboard/settings")) return "settings";
    return "";
  };
  const activeId = getActiveId();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div className="spinner-lg" style={{ margin: "0 auto 16px" }} />
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              fontWeight: 700,
            }}
          >
            Initializing Vault Connection...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-screen">
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: "24px 16px 16px" }}>
          <VaultProxyLogo variant="sidebar" href="/dashboard" />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", margin: "0 20px 16px" }} />

        {/* Nav */}
        <nav style={{ padding: "0 12px", flex: 1 }}>
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              id={`nav-${item.id}`}
              className={`nav-item ${activeId === item.id ? "active" : ""}`}
              style={{ marginBottom: 4, display: "flex" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                <span style={{ fontSize: 16, opacity: 0.8 }}>{item.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>
              </span>
              {item.badge !== null && item.badge !== undefined && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 99,
                    lineHeight: 1.6,
                    ...(typeof item.badge === "number"
                      ? {
                          background: "#ef4444",
                          color: "#fff",
                        }
                      : item.badgeColor === "text-green-400"
                      ? { color: "#4ade80", fontSize: 14, lineHeight: 1 }
                      : { color: "#f87171" }),
                  }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", margin: "0 20px 16px" }} />

        {/* User card */}
        <div style={{ padding: "0 16px 20px" }}>
          <div className="user-card" style={{ marginBottom: 10 }}>
            <div className="user-avatar">
              {user?.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.picture}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span>{user?.name?.charAt(0) ?? "U"}</span>
              )}
            </div>
            <div style={{ overflow: "hidden", minWidth: 0 }}>
              <div className="user-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name}
              </div>
              <div className="user-email" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email}
              </div>
            </div>
          </div>
          <a
            href="/auth/logout"
            id="logout-btn"
            style={{
              display: "block",
              textAlign: "center",
              padding: "10px",
              borderRadius: 10,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#f87171",
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              transition: "var(--transition)",
            }}
          >
            Log Out
          </a>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <SecurityStatusBar />
        <main className="main-content" style={{ padding: "40px 48px", flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
