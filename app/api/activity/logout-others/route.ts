/**
 * POST /api/activity/logout-others
 * Revokes all non-current sessions and returns the count revoked.
 */
import { NextRequest, NextResponse } from "next/server";
import { revokeOtherSessions } from "@/lib/loginActivity";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId: string = body.userId || "demo-user";

    const revoked = revokeOtherSessions(userId);

    return NextResponse.json({
      success: true,
      revoked,
      message: revoked > 0
        ? `Successfully terminated ${revoked} other session${revoked !== 1 ? "s" : ""}.`
        : "No other active sessions to terminate.",
    });
  } catch (err) {
    console.error("[Logout Others]", err);
    return NextResponse.json({ success: false, error: "Failed to terminate sessions" }, { status: 500 });
  }
}
