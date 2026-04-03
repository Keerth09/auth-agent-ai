import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getPendingActionById, resolvePendingAction, writeAuditLog } from "@/lib/database";

export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { actionId } = body as { actionId?: string };
    if (!actionId) {
      return NextResponse.json({ error: "actionId is required" }, { status: 400 });
    }

    const userId = session.user.sub as string;

    const pendingAction = getPendingActionById(actionId, userId);
    if (!pendingAction) {
      return NextResponse.json(
        { error: "Pending action not found or already resolved" },
        { status: 404 }
      );
    }

    // Mark as denied
    resolvePendingAction(actionId, "denied");

    // Write audit log
    writeAuditLog({
      user_id: userId,
      action: `${pendingAction.action_name} (human-denied)`,
      decision: "deny",
      status: "failed",
      metadata: JSON.stringify({ deniedActionId: actionId, humanDenied: true }),
    });

    return NextResponse.json({ message: "Action denied. Agent notified.", actionId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[agent/deny] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
