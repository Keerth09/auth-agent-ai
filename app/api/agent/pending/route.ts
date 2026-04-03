import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getPendingActions } from "@/lib/database";

export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub as string;
    const rawPending = getPendingActions(userId);

    // Parse action_data JSON safely
    const pending = rawPending.map((row) => ({
      ...row,
      action_data: (() => {
        try { return row.action_data ? JSON.parse(row.action_data) : null; }
        catch { return row.action_data; }
      })(),
    }));

    return NextResponse.json(
      { pending },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
