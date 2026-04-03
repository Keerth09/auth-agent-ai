import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getAuditStats } from "@/lib/database";

export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub as string;
    
    // Abstracted to the database module to respect module boundaries and the new DB schema
    const stats = getAuditStats(userId);

    return NextResponse.json(
      {
        credentialsProtected: stats.credentialsProtected,
        actionsApproved: stats.actionsApproved,
        pendingApproval: stats.pendingApproval,
        mfaTriggers: stats.mfaTriggers,
        recentActions: stats.recentActions,
      },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
}
