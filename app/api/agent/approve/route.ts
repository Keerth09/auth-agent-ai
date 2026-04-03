import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getPendingActionById, resolvePendingAction, writeAuditLog } from "@/lib/database";
import { executeWithToken } from "@/lib/tokenVault";
import { sendEmail } from "@/lib/tools/gmail";

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
      return NextResponse.json({ error: "Pending action not found or already resolved" }, { status: 404 });
    }

    // Parse action data to know what to execute
    let task = "";
    let service = "";
    let action = "";
    
    if (pendingAction.action_data) {
      try {
        const parsed = JSON.parse(pendingAction.action_data);
        task = parsed.task || "";
        service = parsed.service || "";
        action = parsed.action || "";
      } catch (e) {
        console.error("Failed to parse action_data", e);
      }
    }

    let fingerprint = "none";
    let finalResult = "Action executed successfully (human-approved)";

    if (service === "gmail" && action === "send") {
      finalResult = await executeWithToken(userId, service, async (token: string) => {
        fingerprint = `...${token.slice(-4)}`;
        const targetEmail = session.user.email || "hello@vaultproxy.local";
        return await sendEmail(
          token, 
          targetEmail, 
          "Automated Response Requested", 
          `VaultProxy Automated Delivery.\nTask Prompted: "${task}"`
        );
      });
    }

    // Mark as approved AFTER execution succeeds
    resolvePendingAction(actionId, "approved");

    // Write audit log
    writeAuditLog({
      user_id: userId,
      action: `${pendingAction.action_name} (human-approved)`,
      token_fingerprint: fingerprint,
      decision: "allow",
      status: "success",
      metadata: JSON.stringify({ approvedActionId: actionId, humanApproved: true, result: finalResult }),
    });

    return NextResponse.json({ message: "Action approved and executing", result: finalResult, fingerprint });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[agent/approve] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
