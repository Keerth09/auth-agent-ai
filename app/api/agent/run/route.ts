import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { runAgent } from "@/lib/agents/agentOrchestrator";

export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Session is null" }, { status: 401 });
    }
    console.log("[DEBUG] Session object keys:", Object.keys(session));
    if (session.idToken) console.log("[DEBUG] idToken exists"); 
    else console.log("[DEBUG] idToken is undefined");

    const { task } = await req.json();
    if (!task) {
      return NextResponse.json({ error: "Task is required" }, { status: 400 });
    }

    const userId = session.user.sub;
    const idToken = session.tokenSet?.idToken;

    if (!idToken) {
      return NextResponse.json({ error: "No ID token available in the session. Please re-login." }, { status: 401 });
    }

    const result = await runAgent(task, userId, idToken as string);

    return NextResponse.json({ run: result });
  } catch (err: unknown) {
    console.error("[API Agent Run] Error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { error: message },
      { status: typeof err === "object" && err !== null && "status" in err ? (err as { status: number }).status : 500 }
    );
  }
}
