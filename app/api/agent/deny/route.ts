import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { denyPendingAction } from "@/lib/agents/agentOrchestrator";

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

    // Deny the pending action via Orchestrator
    const action = await denyPendingAction(actionId, userId);

    return NextResponse.json({ 
      message: "Action denied. Agent task updated.", 
      actionId: action?.id 
    });
    
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[agent/deny] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
