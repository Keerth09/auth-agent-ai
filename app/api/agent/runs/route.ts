import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { listAgentRuns } from "@/lib/agents/agentRunner";

export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const runs = listAgentRuns(session.user.sub);
    return NextResponse.json({ runs });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
}
