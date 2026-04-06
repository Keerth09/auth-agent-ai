/**
 * VaultProxy TOTP Engine
 * Handles TOTP secret lifecycle, QR generation, and verification with lockout.
 */
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export const TOTP_ISSUER = "VaultProxy";
export const MAX_ATTEMPTS = 3;
export const LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
export const TOTP_WINDOW = 1; // allow ±30s drift

// ────────────────────────────────────────────────────────────────────────────
// In-memory lockout store (replace with Redis/DB in production)
// ────────────────────────────────────────────────────────────────────────────
interface LockoutEntry {
  attempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}
const lockoutStore = new Map<string, LockoutEntry>();

// ────────────────────────────────────────────────────────────────────────────
// In-memory TOTP secret store (replace with encrypted DB column in production)
// ────────────────────────────────────────────────────────────────────────────
interface TOTPRecord {
  base32: string;
  otpauthUrl: string;
  verified: boolean;  // true after user completes first verification
  createdAt: number;
}
const secretStore = new Map<string, TOTPRecord>();

// ────────────────────────────────────────────────────────────────────────────
// Generate a new TOTP secret for a user
// ────────────────────────────────────────────────────────────────────────────
export function generateTOTPSecret(userEmail: string): {
  base32: string;
  otpauthUrl: string;
} {
  const secret = speakeasy.generateSecret({
    name: `${TOTP_ISSUER}:${userEmail}`,
    issuer: TOTP_ISSUER,
    length: 20,
  });

  const record: TOTPRecord = {
    base32: secret.base32,
    otpauthUrl: secret.otpauth_url!,
    verified: false,
    createdAt: Date.now(),
  };
  secretStore.set(userEmail, record);

  return {
    base32: secret.base32,
    otpauthUrl: secret.otpauth_url!,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Convert otpauth URL to a base64 QR code data URI
// ────────────────────────────────────────────────────────────────────────────
export async function generateQRCodeDataURL(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: "H",
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    width: 300,
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Retrieve stored secret for a user (null if not set up)
// ────────────────────────────────────────────────────────────────────────────
export function getTOTPRecord(userEmail: string): TOTPRecord | null {
  return secretStore.get(userEmail) ?? null;
}

// ────────────────────────────────────────────────────────────────────────────
// Verify OTP with lockout logic
// ────────────────────────────────────────────────────────────────────────────
export interface VerifyResult {
  success: boolean;
  error?: string;
  attemptsLeft?: number;
  lockedUntil?: number;
}

export function verifyTOTP(userEmail: string, token: string): VerifyResult {
  // ── 1. Lockout check ──────────────────────────────────────────────────────
  const lockout = lockoutStore.get(userEmail) ?? { attempts: 0, lockedUntil: null, lastAttempt: 0 };

  if (lockout.lockedUntil && Date.now() < lockout.lockedUntil) {
    return {
      success: false,
      error: "Account temporarily locked due to too many failed attempts.",
      lockedUntil: lockout.lockedUntil,
      attemptsLeft: 0,
    };
  }

  // Reset lockout if cooldown has passed
  if (lockout.lockedUntil && Date.now() >= lockout.lockedUntil) {
    lockoutStore.delete(userEmail);
  }

  // ── 2. Retrieve secret ────────────────────────────────────────────────────
  const record = secretStore.get(userEmail);
  if (!record) {
    return { success: false, error: "TOTP not configured for this user." };
  }

  // ── 3. Sanitise token ─────────────────────────────────────────────────────
  const cleanToken = token.replace(/\s+/g, "").slice(0, 6);
  if (!/^\d{6}$/.test(cleanToken)) {
    return { success: false, error: "OTP must be exactly 6 digits." };
  }

  // ── 4. TOTP verification ──────────────────────────────────────────────────
  const verified = speakeasy.totp.verify({
    secret: record.base32,
    encoding: "base32",
    token: cleanToken,
    window: TOTP_WINDOW,
  });

  if (verified) {
    // Mark secret as confirmed and reset lockout
    record.verified = true;
    secretStore.set(userEmail, record);
    lockoutStore.delete(userEmail);
    return { success: true };
  }

  // ── 5. Failed attempt – update lockout ────────────────────────────────────
  const newAttempts = (lockout.attempts ?? 0) + 1;
  const isNowLocked = newAttempts >= MAX_ATTEMPTS;

  lockoutStore.set(userEmail, {
    attempts: newAttempts,
    lockedUntil: isNowLocked ? Date.now() + LOCKOUT_DURATION_MS : null,
    lastAttempt: Date.now(),
  });

  if (isNowLocked) {
    return {
      success: false,
      error: "Too many failed attempts. Account locked for 24 hours.",
      attemptsLeft: 0,
      lockedUntil: Date.now() + LOCKOUT_DURATION_MS,
    };
  }

  return {
    success: false,
    error: "Invalid OTP. Please try again.",
    attemptsLeft: MAX_ATTEMPTS - newAttempts,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Remove TOTP setup for a user (for "reset MFA" flows)
// ────────────────────────────────────────────────────────────────────────────
export function removeTOTP(userEmail: string): void {
  secretStore.delete(userEmail);
  lockoutStore.delete(userEmail);
}

// ────────────────────────────────────────────────────────────────────────────
// Check if TOTP is enabled and verified for a user
// ────────────────────────────────────────────────────────────────────────────
export function isTOTPEnabled(userEmail: string): boolean {
  const record = secretStore.get(userEmail);
  return !!record?.verified;
}

// ────────────────────────────────────────────────────────────────────────────
// Get lockout status (for UI display)
// ────────────────────────────────────────────────────────────────────────────
export function getLockoutStatus(userEmail: string): { locked: boolean; attemptsLeft: number; lockedUntil: number | null } {
  const lockout = lockoutStore.get(userEmail);
  if (!lockout) return { locked: false, attemptsLeft: MAX_ATTEMPTS, lockedUntil: null };

  const isLocked = !!lockout.lockedUntil && Date.now() < lockout.lockedUntil;
  return {
    locked: isLocked,
    attemptsLeft: isLocked ? 0 : MAX_ATTEMPTS - lockout.attempts,
    lockedUntil: lockout.lockedUntil,
  };
}
