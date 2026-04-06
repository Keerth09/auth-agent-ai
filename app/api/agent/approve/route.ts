import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { executeApprovedAction } from "@/lib/agents/agentOrchestrator";

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

    // Execute the approved action via Orchestrator
    const { result, action } = await executeApprovedAction(actionId, userId);

    if (!action) {
      return NextResponse.json({ error: "Action execution failed" }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Action approved and executed successfully", 
      result,
      actionName: action.actionName
    });
    
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[agent/approve] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
