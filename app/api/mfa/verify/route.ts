/**
 * POST /api/mfa/verify
 * Verifies a 6-digit TOTP token with lockout protection.
 * Body: { email: string, token: string, context?: "setup" | "auth" }
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyTOTP, getLockoutStatus } from "@/lib/totp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email: string = body.email?.trim() || "user@vaultproxy.local";
    const token: string = String(body.token ?? "").trim();
    const context: string = body.context ?? "auth";

    if (!token) {
      return NextResponse.json(
        { success: false, error: "OTP token is required." },
        { status: 400 }
      );
    }

    const result = verifyTOTP(email, token);

    if (result.success) {
      return NextResponse.json({
        success: true,
        context,
        message: context === "setup"
          ? "Authenticator app linked successfully to VaultProxy."
          : "MFA verified. Access granted.",
      });
    }

    const status = result.lockedUntil ? 423 : 401;
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        attemptsLeft: result.attemptsLeft,
        lockedUntil: result.lockedUntil ?? null,
      },
      { status }
    );
  } catch (err) {
    console.error("[MFA Verify]", err);
    return NextResponse.json(
      { success: false, error: "Verification failed due to a server error." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mfa/verify?email=...
 * Returns lockout status for a given user.
 */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") || "user@vaultproxy.local";
  const lockout = getLockoutStatus(email);
  return NextResponse.json({ lockout });
}
