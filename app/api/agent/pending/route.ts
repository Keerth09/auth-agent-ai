import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { listPendingActions } from "@/lib/agents/agentRunner";

export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pending = listPendingActions(session.user.sub);
    return NextResponse.json({ pending });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
