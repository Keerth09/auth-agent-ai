/**
 * POST /api/mfa/setup
 * Generates a new TOTP secret and returns the QR code data URI + base32 key.
 * Body: { email: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { generateTOTPSecret, generateQRCodeDataURL } from "@/lib/totp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email: string = body.email?.trim() || "user@vaultproxy.local";

    const { base32, otpauthUrl } = generateTOTPSecret(email);
    const qrCodeDataURL = await generateQRCodeDataURL(otpauthUrl);

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataURL,
      base32,
      otpauthUrl,
      message: "Scan this QR code with Google or Microsoft Authenticator",
    });
  } catch (err) {
    console.error("[MFA Setup]", err);
    return NextResponse.json({ success: false, error: "Failed to generate TOTP secret" }, { status: 500 });
  }
}

/**
 * GET /api/mfa/setup?email=...
 * Returns current TOTP setup status for a user.
 */
import { getTOTPRecord, getLockoutStatus } from "@/lib/totp";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") || "user@vaultproxy.local";
  const record = getTOTPRecord(email);
  const lockout = getLockoutStatus(email);

  return NextResponse.json({
    configured: !!record,
    verified: record?.verified ?? false,
    lockout,
  });
}
