/**
 * VaultProxy Login Activity Engine
 * Tracks every login with device/location/risk data like Google Account Security.
 */

import { db } from "./database";
import { v4 as uuidv4 } from "uuid";

// ────────────────────────────────────────────────────────────────────────────
// Schema Migration — runs once on boot (idempotent)
// ────────────────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS login_activity (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL,
    ip           TEXT NOT NULL,
    country      TEXT,
    city         TEXT,
    device_type  TEXT NOT NULL,
    browser      TEXT NOT NULL,
    os           TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'success',
    is_current   INTEGER DEFAULT 0,
    is_suspicious INTEGER DEFAULT 0,
    risk_reason  TEXT,
    session_token TEXT,
    timestamp    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_login_activity_user
    ON login_activity(user_id, timestamp DESC);
`);

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
export interface LoginActivityEntry {
  id: string;
  userId: string;
  ip: string;
  country: string | null;
  city: string | null;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
  browser: string;
  os: string;
  status: "success" | "failed";
  isCurrent: boolean;
  isSuspicious: boolean;
  riskReason: string | null;
  sessionToken: string | null;
  timestamp: string;
}

// ────────────────────────────────────────────────────────────────────────────
// User-Agent parser (zero-dependency, regex-based)
// ────────────────────────────────────────────────────────────────────────────
export function parseUserAgent(ua: string): {
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
} {
  const lower = ua.toLowerCase();

  // Browser detection (order matters — more specific first)
  let browser = "Unknown";
  if (lower.includes("edg/") || lower.includes("edge/"))   browser = "Microsoft Edge";
  else if (lower.includes("opr/") || lower.includes("opera")) browser = "Opera";
  else if (lower.includes("brave"))                            browser = "Brave";
  else if (lower.includes("chrome") && !lower.includes("chromium")) browser = "Chrome";
  else if (lower.includes("chromium"))                         browser = "Chromium";
  else if (lower.includes("firefox"))                          browser = "Firefox";
  else if (lower.includes("safari") && !lower.includes("chrome")) browser = "Safari";
  else if (lower.includes("curl"))                             browser = "cURL";
  else if (lower.includes("postman"))                          browser = "Postman";

  // OS detection
  let os = "Unknown";
  if (lower.includes("windows nt 10"))      os = "Windows 10/11";
  else if (lower.includes("windows nt 6.3")) os = "Windows 8.1";
  else if (lower.includes("windows nt 6.2")) os = "Windows 8";
  else if (lower.includes("windows nt 6.1")) os = "Windows 7";
  else if (lower.includes("windows"))        os = "Windows";
  else if (lower.includes("mac os x 10_15") || lower.includes("mac os x 10.15")) os = "macOS Catalina";
  else if (lower.includes("mac os x 11") || lower.includes("mac os x 12") || lower.includes("mac os x 13") || lower.includes("mac os x 14")) os = "macOS";
  else if (lower.includes("mac os x"))       os = "macOS";
  else if (lower.includes("android"))        os = "Android";
  else if (lower.includes("iphone"))         os = "iOS (iPhone)";
  else if (lower.includes("ipad"))           os = "iOS (iPad)";
  else if (lower.includes("cros"))           os = "ChromeOS";
  else if (lower.includes("linux"))          os = "Linux";

  // Device type
  let deviceType: "desktop" | "mobile" | "tablet" | "unknown" = "desktop";
  if (lower.includes("ipad") || lower.includes("tablet") || (lower.includes("android") && !lower.includes("mobile"))) {
    deviceType = "tablet";
  } else if (lower.includes("mobi") || lower.includes("iphone") || lower.includes("android")) {
    deviceType = "mobile";
  } else if (lower.includes("bot") || lower.includes("curl") || lower.includes("postman")) {
    deviceType = "unknown";
  }

  return { browser, os, deviceType };
}

// ────────────────────────────────────────────────────────────────────────────
// IP extraction from request headers
// ────────────────────────────────────────────────────────────────────────────
export function extractIP(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

// ────────────────────────────────────────────────────────────────────────────
// Geolocation via ipapi.co (free, no key required, 30k req/month)
// ────────────────────────────────────────────────────────────────────────────
interface GeoResult {
  city: string | null;
  country: string | null;
}

export async function geolocateIP(ip: string): Promise<GeoResult> {
  // Skip for localhost / private IPs
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.")
  ) {
    return { city: "Localhost", country: "Local Network" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout
    const res = await fetch(`https://ipinfo.io/${ip}/json?token=772ab64da7614e`, {
      signal: controller.signal,
      headers: { "User-Agent": "VaultProxy/1.0" },
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error("geo failed");
    
    // ipinfo returns `country` as a 2-letter ISO code (e.g., 'US', 'IN')
    const data = await res.json() as { city?: string; country?: string; error?: boolean | object };
    if (data.error) throw new Error("geo error response");

    let countryName = data.country ?? null;
    if (countryName && countryName.length === 2) {
      try {
        const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        countryName = regionNames.of(countryName) || countryName;
      } catch {
        // Fallback to code if Intl parsing fails
      }
    }

    return {
      city: data.city ?? null,
      country: countryName,
    };
  } catch {
    return { city: null, country: null };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Risk detection
// ────────────────────────────────────────────────────────────────────────────
export function detectRisk(
  userId: string,
  ip: string,
  country: string | null,
  browser: string,
  os: string,
  status: "success" | "failed"
): { isSuspicious: boolean; riskReason: string | null } {
  const reasons: string[] = [];

  // Detect failed login
  if (status === "failed") {
    reasons.push("Failed authentication attempt");
  }

  // Detect multiple failed attempts in last 10 min
  const recentFailed = db.prepare(`
    SELECT COUNT(*) as count FROM login_activity
    WHERE user_id = ? AND status = 'failed'
    AND timestamp >= datetime('now', '-10 minutes')
  `).get(userId) as { count: number };
  if (recentFailed.count >= 3) {
    reasons.push(`${recentFailed.count} failed attempts in last 10 minutes`);
  }

  // New country
  if (country) {
    const knownCountry = db.prepare(`
      SELECT COUNT(*) as count FROM login_activity
      WHERE user_id = ? AND country = ? AND status = 'success'
    `).get(userId, country) as { count: number };
    if (knownCountry.count === 0) {
      reasons.push(`First login from ${country}`);
    }
  }

  // New browser+OS combo (new device signature)
  const knownDevice = db.prepare(`
    SELECT COUNT(*) as count FROM login_activity
    WHERE user_id = ? AND browser = ? AND os = ? AND status = 'success'
  `).get(userId, browser, os) as { count: number };
  if (knownDevice.count === 0 && status === "success") {
    reasons.push(`New device: ${browser} on ${os}`);
  }

  return {
    isSuspicious: reasons.length > 0,
    riskReason: reasons.length > 0 ? reasons.join(" · ") : null,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Write a new login activity record
// ────────────────────────────────────────────────────────────────────────────
export interface RecordLoginParams {
  userId: string;
  userAgent: string;
  ip: string;
  city: string | null;
  country: string | null;
  status: "success" | "failed";
  isCurrent?: boolean;
  sessionToken?: string;
}

export function recordLogin(p: RecordLoginParams): string {
  const id = uuidv4();
  const { browser, os, deviceType } = parseUserAgent(p.userAgent);
  const { isSuspicious, riskReason } = detectRisk(p.userId, p.ip, p.country, browser, os, p.status);

  db.prepare(`
    INSERT INTO login_activity
      (id, user_id, ip, country, city, device_type, browser, os, status,
       is_current, is_suspicious, risk_reason, session_token, timestamp)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, p.userId, p.ip,
    p.country ?? null, p.city ?? null,
    deviceType, browser, os,
    p.status,
    p.isCurrent ? 1 : 0,
    isSuspicious ? 1 : 0,
    riskReason ?? null,
    p.sessionToken ?? null,
    new Date().toISOString()
  );

  return id;
}

// ────────────────────────────────────────────────────────────────────────────
// Retrieve activity for a user (newest first)
// ────────────────────────────────────────────────────────────────────────────
interface LoginActivityRow {
  id: string;
  user_id: string;
  ip: string;
  country: string | null;
  city: string | null;
  device_type: string;
  browser: string;
  os: string;
  status: string;
  is_current: number;
  is_suspicious: number;
  risk_reason: string | null;
  session_token: string | null;
  timestamp: string;
}

function rowToEntry(r: LoginActivityRow): LoginActivityEntry {
  return {
    id: r.id,
    userId: r.user_id,
    ip: r.ip,
    country: r.country,
    city: r.city,
    deviceType: r.device_type as LoginActivityEntry["deviceType"],
    browser: r.browser,
    os: r.os,
    status: r.status as "success" | "failed",
    isCurrent: Boolean(r.is_current),
    isSuspicious: Boolean(r.is_suspicious),
    riskReason: r.risk_reason,
    sessionToken: r.session_token,
    timestamp: r.timestamp,
  };
}

export function getLoginActivity(userId: string, limit = 50): LoginActivityEntry[] {
  const rows = db.prepare(`
    SELECT * FROM login_activity
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(userId, limit) as LoginActivityRow[];
  return rows.map(rowToEntry);
}

export function getLoginActivityStats(userId: string) {
  const total      = (db.prepare(`SELECT COUNT(*) as c FROM login_activity WHERE user_id = ?`).get(userId) as { c: number }).c;
  const failed     = (db.prepare(`SELECT COUNT(*) as c FROM login_activity WHERE user_id = ? AND status = 'failed'`).get(userId) as { c: number }).c;
  const suspicious = (db.prepare(`SELECT COUNT(*) as c FROM login_activity WHERE user_id = ? AND is_suspicious = 1`).get(userId) as { c: number }).c;
  const countries  = (db.prepare(`SELECT COUNT(DISTINCT country) as c FROM login_activity WHERE user_id = ? AND country IS NOT NULL`).get(userId) as { c: number }).c;
  return { total, failed, suspicious, countries };
}

// ────────────────────────────────────────────────────────────────────────────
// Revoke all non-current sessions
// ────────────────────────────────────────────────────────────────────────────
export function revokeOtherSessions(userId: string): number {
  const info = db.prepare(`
    UPDATE login_activity
    SET is_current = 0, session_token = NULL
    WHERE user_id = ? AND is_current = 0
  `).run(userId);
  return info.changes;
}

export function markSessionCurrent(id: string): void {
  db.prepare(`UPDATE login_activity SET is_current = 1 WHERE id = ?`).run(id);
}
