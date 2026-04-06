/**
 * GET  /api/activity/login  → list login history for current user
 * POST /api/activity/login  → record a new login event (called from auth middleware)
 */
import { NextRequest, NextResponse } from "next/server";
import {
  extractIP,
  geolocateIP,
  recordLogin,
  getLoginActivity,
  getLoginActivityStats,
} from "@/lib/loginActivity";

// ── GET: return login history ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    // In a real app pull userId from session; use a safe fallback for demo
    const userId = req.nextUrl.searchParams.get("userId") || "demo-user";
    const limit  = Math.min(Number(req.nextUrl.searchParams.get("limit") || "30"), 100);

    const activity = getLoginActivity(userId, limit);
    const stats    = getLoginActivityStats(userId);

    return NextResponse.json({ success: true, activity, stats });
  } catch (err) {
    console.error("[Activity GET]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch activity" }, { status: 500 });
  }
}

// ── POST: record a login event ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId : string = body.userId  || "demo-user";
    const status : "success" | "failed" = body.status === "failed" ? "failed" : "success";
    const isCurrent: boolean = body.isCurrent !== false;
    const sessionToken: string | undefined = body.sessionToken;

    const ip      = extractIP(req.headers);
    const ua      = req.headers.get("user-agent") || "Unknown";
    const { city, country } = await geolocateIP(ip);

    const id = recordLogin({
      userId,
      userAgent: ua,
      ip,
      city,
      country,
      status,
      isCurrent,
      sessionToken,
    });

    return NextResponse.json({ success: true, id, ip, city, country });
  } catch (err) {
    console.error("[Activity POST]", err);
    return NextResponse.json({ success: false, error: "Failed to record login" }, { status: 500 });
  }
}
