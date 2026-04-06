"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2, LogOut, RefreshCw, Globe, Monitor, Smartphone, Tablet, Shield, Activity } from "lucide-react";

interface LoginEntry {
  id: string;
  userId: string;
  ip: string;
  country: string | null;
  city: string | null;
  deviceType: string;
  browser: string;
  os: string;
  status: "success" | "failed";
  isCurrent: boolean;
  isSuspicious: boolean;
  riskReason: string | null;
  sessionToken: string | null;
  timestamp: string;
}

interface Stats {
  total: number;
  failed: number;
  suspicious: number;
  countries: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function DeviceIcon({ type }: { type: string }) {
  const s = { color: "#a78bfa", flexShrink: 0 as const };
  if (type === "mobile")  return <Smartphone size={18} style={s} />;
  if (type === "tablet")  return <Tablet     size={18} style={s} />;
  return                         <Monitor    size={18} style={s} />;
}

function relativeTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const min  = Math.floor(diff / 60000);
  const hr   = Math.floor(diff / 3600000);
  const day  = Math.floor(diff / 86400000);
  if (min < 1)  return "Just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24)  return `${hr}h ago`;
  if (day < 7)  return `${day}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function countryFlag(country: string | null): string {
  if (!country) return "🌐";
  const flags: Record<string, string> = {
    "United States": "🇺🇸", "India": "🇮🇳", "United Kingdom": "🇬🇧",
    "Germany": "🇩🇪", "France": "🇫🇷", "Canada": "🇨🇦",
    "Australia": "🇦🇺", "Japan": "🇯🇵", "China": "🇨🇳",
    "Brazil": "🇧🇷", "Russia": "🇷🇺", "Netherlands": "🇳🇱",
    "Singapore": "🇸🇬", "South Korea": "🇰🇷", "Local Network": "🖥️",
  };
  return flags[country] ?? "🌐";
}

// ── Demo seed data shown before real data loads ───────────────────────────────
const DEMO_ACTIVITY: LoginEntry[] = [
  {
    id: "cur", userId: "demo", ip: "192.168.1.42", country: "India", city: "Hyderabad",
    deviceType: "desktop", browser: "Chrome", os: "macOS",
    status: "success", isCurrent: true, isSuspicious: false, riskReason: null,
    sessionToken: "sess_abc", timestamp: new Date().toISOString(),
  },
  {
    id: "ok2", userId: "demo", ip: "49.36.88.14", country: "India", city: "Bangalore",
    deviceType: "mobile", browser: "Safari", os: "iOS (iPhone)",
    status: "success", isCurrent: false, isSuspicious: false, riskReason: null,
    sessionToken: "sess_def", timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "sus1", userId: "demo", ip: "185.220.101.34", country: "Russia", city: "Moscow",
    deviceType: "desktop", browser: "Firefox", os: "Linux",
    status: "success", isCurrent: false, isSuspicious: true, riskReason: "First login from Russia · New device: Firefox on Linux",
    sessionToken: null, timestamp: new Date(Date.now() - 26 * 3600000).toISOString(),
  },
  {
    id: "fail1", userId: "demo", ip: "45.33.32.156", country: "Netherlands", city: "Amsterdam",
    deviceType: "unknown", browser: "cURL", os: "Unknown",
    status: "failed", isCurrent: false, isSuspicious: true, riskReason: "Failed authentication attempt · 5 failed attempts in last 10 minutes",
    sessionToken: null, timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: "ok3", userId: "demo", ip: "103.4.20.56", country: "India", city: "Mumbai",
    deviceType: "desktop", browser: "Chrome", os: "Windows 10/11",
    status: "success", isCurrent: false, isSuspicious: false, riskReason: null,
    sessionToken: "sess_ghi", timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LoginActivityPage() {
  const [activity, setActivity] = useState<LoginEntry[]>(DEMO_ACTIVITY);
  const [stats, setStats]       = useState<Stats>({ total: 5, failed: 1, suspicious: 2, countries: 3 });
  const [loading, setLoading]   = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revokeMsg, setRevokeMsg] = useState("");
  const [filter, setFilter]     = useState<"all" | "success" | "failed" | "suspicious">("all");
  const [seededDemo, setSeededDemo] = useState(false);

  // ── Seed demo data on first load ──────────────────────────────────────────
  const seedDemo = useCallback(async () => {
    if (seededDemo) return;
    setSeededDemo(true);
    try {
      // Record the current browser session
      await fetch("/api/activity/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "demo-user", status: "success", isCurrent: true }),
      });
    } catch { /* ignore */ }
  }, [seededDemo]);

  // ── Fetch real activity ───────────────────────────────────────────────────
  const fetchActivity = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/activity/login?userId=demo-user&limit=30");
      if (!res.ok) return;
      const data = await res.json();
      if (data.activity?.length) {
        setActivity(data.activity);
        setStats(data.stats);
      }
    } catch { /* use demo data */ }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => {
    seedDemo().then(() => fetchActivity());
    const iv = setInterval(() => fetchActivity(true), 15000);
    return () => clearInterval(iv);
  }, [seedDemo, fetchActivity]);

  // ── Logout other sessions ─────────────────────────────────────────────────
  const revokeOthers = async () => {
    setRevoking(true);
    setRevokeMsg("");
    try {
      const res = await fetch("/api/activity/logout-others", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "demo-user" }),
      });
      const data = await res.json();
      setRevokeMsg(data.message || "Done.");
      fetchActivity();
    } catch {
      setRevokeMsg("Failed to revoke sessions.");
    } finally {
      setRevoking(false);
      setTimeout(() => setRevokeMsg(""), 4000);
    }
  };

  const filtered = activity.filter((e) => {
    if (filter === "success")    return e.status === "success" && !e.isSuspicious;
    if (filter === "failed")     return e.status === "failed";
    if (filter === "suspicious") return e.isSuspicious;
    return true;
  });

  const suspiciousCount = activity.filter((e) => e.isSuspicious).length;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 920, margin: "0 auto", paddingBottom: 48 }}>

      {/* Back */}
      <Link href="/dashboard/settings" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13, marginBottom: 28, textDecoration: "none" }}
        className="hover:text-white transition-colors">
        <ArrowLeft size={15} /> Back to Security Settings
      </Link>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,rgba(124,58,237,.2),rgba(76,215,246,.1))", border: "1px solid rgba(124,58,237,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={20} style={{ color: "#a78bfa" }} />
            </div>
            <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 26, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              Login Activity
            </h1>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 460 }}>
            Review all devices and locations that have accessed your VaultProxy account. Managed like Google Account Security.
          </p>
        </div>

        <button
          onClick={() => fetchActivity()}
          disabled={loading}
          style={{ padding: "9px 16px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}
        >
          <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          {loading ? "Syncing…" : "Refresh"}
        </button>
      </div>

      {/* ── Suspicious alert banner ─────────────────────────────────────────── */}
      {suspiciousCount > 0 && (
        <div style={{ padding: "16px 20px", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 14, display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 24 }}>
          <AlertTriangle size={18} style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 4 }}>
              {suspiciousCount} Suspicious Login{suspiciousCount !== 1 ? "s" : ""} Detected
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
              We detected logins from unfamiliar devices or locations. Review the entries below and revoke any sessions you don&apos;t recognise.
            </p>
          </div>
          <button
            onClick={revokeOthers}
            disabled={revoking}
            style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", fontSize: 11, fontWeight: 800, cursor: "pointer", flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}
          >
            {revoking ? "Revoking…" : "Revoke All Others"}
          </button>
        </div>
      )}

      {revokeMsg && (
        <div style={{ padding: "12px 16px", marginBottom: 16, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 10, fontSize: 12, color: "#34d399", display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={14} /> {revokeMsg}
        </div>
      )}

      {/* ── Stats row ────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Logins",     value: stats.total,      icon: "🔑", color: "#a78bfa" },
          { label: "Failed Attempts",  value: stats.failed,     icon: "❌", color: "#f87171" },
          { label: "Suspicious",       value: stats.suspicious, icon: "⚠️", color: "#fbbf24" },
          { label: "Countries",        value: stats.countries,  icon: "🌍", color: "#4cd7f6" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "18px 20px", background: "var(--bg-card)", border: `1px solid ${s.color}18`, borderTop: `3px solid ${s.color}`, borderRadius: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--text-muted)", marginBottom: 6 }}>{s.label}</p>
                <div style={{ fontFamily: "var(--font-syne)", fontSize: 28, fontWeight: 900, color: s.value > 0 && s.label !== "Total Logins" && s.label !== "Countries" ? s.color : "var(--text-primary)" }}>{s.value}</div>
              </div>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {(["all", "success", "failed", "suspicious"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 16px", borderRadius: 99, fontSize: 11, fontWeight: 700,
              cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize",
              background: filter === f ? "rgba(124,58,237,0.15)" : "transparent",
              border: filter === f ? "1px solid rgba(124,58,237,0.4)" : "1px solid var(--border)",
              color: filter === f ? "#a78bfa" : "var(--text-muted)",
            }}
          >
            {f === "all" ? `All (${activity.length})` : f === "suspicious" ? `⚠️ Suspicious (${activity.filter(e => e.isSuspicious).length})` : f === "failed" ? `❌ Failed (${activity.filter(e => e.status === "failed").length})` : `✅ Successful (${activity.filter(e => e.status === "success" && !e.isSuspicious).length})`}
          </button>
        ))}
      </div>

      {/* ── Activity list ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 100px", padding: "12px 22px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)", gap: 16 }}>
          {["Device & Location", "Browser / OS", "Time", "Status", "Action"].map((h) => (
            <span key={h} style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--text-muted)" }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No records match this filter.</div>
        ) : (
          filtered.map((entry, i) => (
            <div
              key={entry.id}
              style={{
                display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 100px",
                padding: "18px 22px", gap: 16, alignItems: "center",
                borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                background: entry.isCurrent
                  ? "linear-gradient(90deg, rgba(124,58,237,0.06) 0%, transparent 100%)"
                  : entry.isSuspicious
                  ? "linear-gradient(90deg, rgba(248,113,113,0.04) 0%, transparent 100%)"
                  : "transparent",
                borderLeft: entry.isCurrent
                  ? "3px solid rgba(124,58,237,0.6)"
                  : entry.isSuspicious
                  ? "3px solid rgba(248,113,113,0.5)"
                  : "3px solid transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { if (!entry.isCurrent && !entry.isSuspicious) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = entry.isCurrent ? "linear-gradient(90deg, rgba(124,58,237,0.06) 0%, transparent 100%)" : entry.isSuspicious ? "linear-gradient(90deg, rgba(248,113,113,0.04) 0%, transparent 100%)" : "transparent"; }}
            >
              {/* Device & Location */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: entry.isSuspicious ? "rgba(248,113,113,0.1)" : "rgba(124,58,237,0.08)", border: `1px solid ${entry.isSuspicious ? "rgba(248,113,113,0.2)" : "rgba(124,58,237,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <DeviceIcon type={entry.deviceType} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                      {entry.city && entry.country ? `${entry.city}, ${entry.country}` : entry.country || "Unknown Location"}
                    </span>
                    <span style={{ fontSize: 14 }}>{countryFlag(entry.country)}</span>
                    {entry.isCurrent && (
                      <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 99, background: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Current</span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Globe size={10} style={{ color: "var(--text-muted)" }} />
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{entry.ip}</span>
                  </div>
                  {entry.isSuspicious && entry.riskReason && (
                    <div style={{ marginTop: 4, display: "flex", alignItems: "flex-start", gap: 4 }}>
                      <AlertTriangle size={10} style={{ color: "#fbbf24", flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 10, color: "#fbbf24", lineHeight: 1.3 }}>{entry.riskReason}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Browser / OS */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 2 }}>{entry.browser}</p>
                <p style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{entry.os}</p>
              </div>

              {/* Time */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{relativeTime(entry.timestamp)}</p>
                <p style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {/* Status badge */}
              <div>
                {entry.isSuspicious ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, fontSize: 10, fontWeight: 800, background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)", textTransform: "uppercase" }}>
                    <AlertTriangle size={9} /> Suspicious
                  </span>
                ) : entry.status === "success" ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, fontSize: 10, fontWeight: 800, background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)", textTransform: "uppercase" }}>
                    <CheckCircle2 size={9} /> Secure
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, fontSize: 10, fontWeight: 800, background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)", textTransform: "uppercase" }}>
                    ✕ Failed
                  </span>
                )}
              </div>

              {/* Action */}
              <div>
                {entry.isCurrent ? (
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "rgba(124,58,237,0.7)", fontWeight: 700 }}>This Session</span>
                ) : (
                  <button
                    onClick={revokeOthers}
                    style={{ padding: "5px 12px", borderRadius: 7, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <LogOut size={10} /> Revoke
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Security actions footer ─────────────────────────────────────────── */}
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Logout all others */}
        <div style={{ padding: "22px 24px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <LogOut size={18} style={{ color: "#f87171" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Log Out From All Devices</h3>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.5 }}>Terminate all other sessions except this one. Useful if your account was accessed without permission.</p>
            <button
              onClick={revokeOthers}
              disabled={revoking}
              style={{ padding: "9px 18px", borderRadius: 9, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", fontSize: 11, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em" }}
            >
              {revoking ? "Revoking…" : "Revoke All Other Sessions"}
            </button>
          </div>
        </div>

        {/* Security tips */}
        <div style={{ padding: "22px 24px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(76,215,246,0.08)", border: "1px solid rgba(76,215,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Shield size={18} style={{ color: "#4cd7f6" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Protect Your Account</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "🔐", text: "Enable Authenticator App 2FA", link: "/dashboard/settings/mfa" },
                { icon: "🔑", text: "Use a strong, unique password", link: "/dashboard/settings/password" },
                { icon: "⚠️", text: "Review suspicious logins above", link: undefined },
              ].map((tip) => (
                <div key={tip.text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13 }}>{tip.icon}</span>
                  {tip.link ? (
                    <Link href={tip.link} style={{ fontSize: 11, color: "#a78bfa", textDecoration: "none", fontWeight: 600 }} className="hover:underline">{tip.text}</Link>
                  ) : (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{tip.text}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Immutability note */}
      <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 18, fontFamily: "var(--font-mono)" }}>
        🔒 Login records are cryptographically stored and cannot be modified · Refresh every 15s automatically
      </p>
    </div>
  );
}
