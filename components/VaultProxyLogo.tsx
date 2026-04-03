"use client";

import { useState } from "react";

interface VaultProxyLogoProps {
  /** "nav" = small navbar lockup, "sidebar" = dashboard sidebar lockup */
  variant?: "nav" | "sidebar";
  /** link wraps the logo — pass false if you don't want an anchor */
  href?: string;
}

/**
 * VaultProxy brand lockup — SVG icon + wordmark.
 * Fully vector, no external assets. Matches design-system tokens.
 */
export default function VaultProxyLogo({
  variant = "nav",
  href = "/",
}: VaultProxyLogoProps) {
  const [hovered, setHovered] = useState(false);

  const isSidebar = variant === "sidebar";

  /* ─── sizing ─────────────────────────────────────────────────── */
  const iconSize = isSidebar ? 32 : 24;
  const fontSize = isSidebar ? 17 : 15;
  const gap = isSidebar ? 10 : 8;

  /* ─── dynamic styles ─────────────────────────────────────────── */
  const wrapperStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap,
    cursor: "pointer",
    opacity: hovered ? 1 : 0.92,
    transform: hovered ? "scale(1.02)" : "scale(1)",
    transition: "opacity 200ms ease, transform 200ms ease",
    textDecoration: "none",
    userSelect: "none",
  };

  const iconGlowStyle: React.CSSProperties = {
    filter: hovered
      ? "drop-shadow(0 0 8px rgba(124,58,237,0.9)) drop-shadow(0 0 16px rgba(124,58,237,0.5))"
      : "drop-shadow(0 0 4px rgba(124,58,237,0.4))",
    transition: "filter 200ms ease",
  };

  const wordmarkStyle: React.CSSProperties = {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    background: "linear-gradient(135deg, #ffffff 20%, #a78bfa 60%, #f59e0b 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    lineHeight: 1,
  };

  const badge = isSidebar ? (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "rgba(167,139,250,0.6)",
        marginTop: 3,
        fontFamily: "'Syne', monospace",
      }}
    >
      Zero-Trust · v2
    </div>
  ) : null;

  const Content = (
    <span
      style={wrapperStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="img"
      aria-label="VaultProxy"
    >
      {/* ── Geometric Vault Icon ─────────────────────────────────── */}
      <span style={iconGlowStyle}>
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="vp-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="55%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="vp-stroke-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Outer hexagonal shield */}
          <path
            d="M16 2L28 8V18C28 25 16 30 16 30C16 30 4 25 4 18V8L16 2Z"
            fill="url(#vp-icon-grad)"
            fillOpacity="0.15"
            stroke="url(#vp-stroke-grad)"
            strokeWidth="1.2"
          />

          {/* Inner vault door circle */}
          <circle
            cx="16"
            cy="16"
            r="6"
            stroke="url(#vp-stroke-grad)"
            strokeWidth="1.4"
            fill="none"
          />

          {/* Dial ticks on vault */}
          <line x1="16" y1="10" x2="16" y2="12" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="22" y1="16" x2="20" y2="16" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="16" y1="22" x2="16" y2="20" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="10" y1="16" x2="12" y2="16" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" />

          {/* Center lock dot */}
          <circle cx="16" cy="16" r="2" fill="url(#vp-icon-grad)" />

          {/* Corner accent lines — engineered feel */}
          <path d="M6 9L4 8" stroke="#7C3AED" strokeWidth="1" strokeOpacity="0.6" strokeLinecap="round" />
          <path d="M26 9L28 8" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.6" strokeLinecap="round" />
        </svg>
      </span>

      {/* ── Wordmark ────────────────────────────────────────────── */}
      <span>
        {isSidebar ? (
          <>
            <div style={wordmarkStyle}>VaultProxy</div>
            {badge}
          </>
        ) : (
          <span style={wordmarkStyle}>VaultProxy</span>
        )}
      </span>
    </span>
  );

  if (href) {
    return (
      <a href={href} style={{ textDecoration: "none" }}>
        {Content}
      </a>
    );
  }

  return Content;
}
