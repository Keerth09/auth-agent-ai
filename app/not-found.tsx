"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Shield, Terminal, BarChart2, Home, RefreshCw } from "lucide-react";

/* ─── Pure client-only animated components ────────────────────────────────── */

function PulsingOrb({ color, size, style }: { color: string; size: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        filter: `blur(${size * 0.5}px)`,
        opacity: 0.15,
        animation: "float 6s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

function TypewriterLine({ text, delay = 0, color = "#94a3b8" }: { text: string; delay?: number; color?: string }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setStarted(true);
    }, delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 28);
    return () => clearInterval(timer);
  }, [started, text]);

  return (
    <span style={{ color, display: "block", minHeight: "1.4em", fontFamily: "monospace", fontSize: "13px" }}>
      {displayed}
      {started && displayed.length < text.length && (
        <span style={{ opacity: 0.7, animation: "blink 0.8s step-end infinite" }}>█</span>
      )}
    </span>
  );
}

function CounterNumber({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(undefined);

  useEffect(() => {
    const start = Date.now();
    const duration = 1200;
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target]);

  return <>{count}</>;
}

/* ─── Main 404 Component ───────────────────────────────────────────────────── */

const LINKS = [
  { href: "/dashboard",       icon: Shield,   label: "Control Center", desc: "Security oversight",     accent: "#a78bfa" },
  { href: "/dashboard/run",   icon: Terminal, label: "Agent Terminal",  desc: "Execute agent tasks",    accent: "#4cd7f6" },
  { href: "/dashboard/audit", icon: BarChart2,label: "Audit Ledger",   desc: "Forensic logs",          accent: "#fb923c" },
];

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#060610",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "24px",
      }}
    >
      {/* ── Background orbs ─────────────────────────────────────────────── */}
      <div style={{ position: "absolute", top: "-10%", left: "-5%", zIndex: 0 }}>
        <PulsingOrb color="#7c3aed" size={500} />
      </div>
      <div style={{ position: "absolute", bottom: "-10%", right: "-5%", zIndex: 0 }}>
        <PulsingOrb color="#0891b2" size={400} style={{ animationDelay: "-3s" }} />
      </div>

      {/* ── Subtle grid ─────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        backgroundImage: "radial-gradient(rgba(139,92,246,0.08) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "900px" }}>

        {/* Top badge */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "48px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "10px",
            padding: "8px 20px", borderRadius: "99px",
            border: "1px solid rgba(239,68,68,0.35)",
            background: "rgba(239,68,68,0.07)",
            backdropFilter: "blur(12px)",
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#ef4444", boxShadow: "0 0 10px #ef4444",
              display: "inline-block",
              animation: "blink 1.4s ease-in-out infinite",
            }} />
            <span style={{ fontSize: "11px", letterSpacing: "2.5px", fontWeight: 700, color: "#f87171", textTransform: "uppercase" }}>
              Security Perimeter — Access Denied
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>

          {/* Left: 404 visual */}
          <div style={{ textAlign: "center" }}>
            {/* Giant number */}
            <div style={{
              fontSize: "clamp(140px, 18vw, 220px)",
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-6px",
              background: "linear-gradient(135deg, #ffffff 20%, rgba(139,92,246,0.6) 80%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "none",
              fontFamily: "'Syne', 'Inter', sans-serif",
              marginBottom: "8px",
              userSelect: "none",
            }}>
              {mounted ? <CounterNumber target={404} /> : "404"}
            </div>

            {/* Label */}
            <p style={{
              fontSize: "13px",
              color: "#64748b",
              letterSpacing: "3px",
              textTransform: "uppercase",
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              marginBottom: "32px",
            }}>
              Node Not Found
            </p>

            {/* Stat pills */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              {[
                { label: "Threat Level", value: "HIGH", color: "#ef4444" },
                { label: "Status",       value: "404",  color: "#a78bfa" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  padding: "8px 18px", borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${color}33`,
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "10px", color: "#64748b", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color, fontFamily: "monospace" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Terminal + navigation */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Terminal block */}
            <div style={{
              background: "#0a0a14",
              border: "1px solid rgba(139,92,246,0.2)",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}>
              {/* Title bar */}
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(255,255,255,0.02)",
              }}>
                {["#ef4444", "#f59e0b", "#10b981"].map((c) => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.6 }} />
                ))}
                <span style={{ marginLeft: 8, fontSize: "11px", color: "#475569", letterSpacing: "1px", fontFamily: "monospace" }}>
                  vaultproxy-shell — bash
                </span>
              </div>

              {/* Terminal lines */}
              <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {mounted ? (
                  <>
                    <TypewriterLine text="$ route.resolve --path=current" delay={0}    color="#94a3b8" />
                    <TypewriterLine text="✗ ERROR: 404 — Route not in security mesh"   delay={900}  color="#f87171" />
                    <TypewriterLine text="→ Access attempt logged to audit ledger"      delay={1900} color="#f59e0b" />
                    <TypewriterLine text="⚡ Redirecting to safe zone..."               delay={2900} color="#4cd7f6" />
                  </>
                ) : (
                  <span style={{ color: "#475569", fontFamily: "monospace", fontSize: "13px" }}>Initializing...</span>
                )}
              </div>
            </div>

            {/* Navigation links */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {LINKS.map(({ href, icon: Icon, label, desc, accent }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 18px",
                    borderRadius: "12px",
                    border: `1px solid rgba(255,255,255,0.06)`,
                    background: "rgba(255,255,255,0.02)",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                    backdropFilter: "blur(8px)",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = `${accent}14`;
                    el.style.borderColor = `${accent}44`;
                    el.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "rgba(255,255,255,0.02)";
                    el.style.borderColor = "rgba(255,255,255,0.06)";
                    el.style.transform = "none";
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: "10px",
                    background: `${accent}18`,
                    border: `1px solid ${accent}33`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={18} color={accent} />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0", fontFamily: "'Inter', sans-serif" }}>{label}</div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{desc}</div>
                  </div>
                  <div style={{ marginLeft: "auto", color: "#334155", fontSize: "18px" }}>›</div>
                </Link>
              ))}
            </div>

            {/* Return home */}
            <div style={{ display: "flex", gap: "10px" }}>
              <Link
                href="/"
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "8px", padding: "13px",
                  borderRadius: "12px", border: "1px solid rgba(139,92,246,0.3)",
                  background: "rgba(139,92,246,0.12)",
                  color: "#a78bfa", textDecoration: "none",
                  fontSize: "13px", fontWeight: 600, fontFamily: "'Inter', sans-serif",
                  letterSpacing: "0.5px", transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.22)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.12)"; }}
              >
                <Home size={15} />
                Return Home
              </Link>
              <button
                onClick={() => window.history.back()}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "8px", padding: "13px",
                  borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  color: "#64748b", cursor: "pointer",
                  fontSize: "13px", fontWeight: 500, fontFamily: "'Inter', sans-serif",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
              >
                <RefreshCw size={15} />
                Go Back
              </button>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800;900&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes float {
          0%,100%{transform:translateY(0px)}
          50%{transform:translateY(-20px)}
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 640px) {
          .grid-two { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
