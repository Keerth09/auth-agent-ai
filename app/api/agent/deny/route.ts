import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { denyPendingAction } from "@/lib/agents/agentOrchestrator";

export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { actionId } = await req.json();
    if (!actionId) return NextResponse.json({ error: "ActionId required" }, { status: 400 });

    const result = await denyPendingAction(actionId, session.user.sub);
    return NextResponse.json({ message: "Action denied", action: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
