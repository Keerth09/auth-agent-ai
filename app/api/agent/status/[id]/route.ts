import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getAgentRun } from "@/lib/agents/agentRunner";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth0.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const run = getAgentRun(params.id);
    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
    if (run.userId !== session.user.sub) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    return NextResponse.json({ run });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
