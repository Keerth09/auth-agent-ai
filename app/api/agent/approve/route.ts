import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { executeApprovedAction } from "@/lib/agents/agentOrchestrator";

export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { actionId } = await req.json();
    if (!actionId) return NextResponse.json({ error: "ActionId required" }, { status: 400 });

    const userId = session.user.sub;
    const idToken = session.tokenSet?.idToken;

    if (!idToken) return NextResponse.json({ error: "No ID token available" }, { status: 401 });

    const result = await executeApprovedAction(actionId, userId, idToken as string);
    return NextResponse.json({ message: "Action approved and executed", result });
  } catch (err: unknown) {
    console.error("[API Approve] Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: typeof err === "object" && err !== null && "status" in err ? (err as { status: number }).status : 500 });
  }
}
