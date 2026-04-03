import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { revokeConnection } from "@/lib/tokenVault";

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { connection } = body as { connection?: string };
    if (!connection) {
      return NextResponse.json(
        { error: "connection name is required" },
        { status: 400 }
      );
    }

    const userId = session.user.sub as string;
    const { revokedGrantIds } = await revokeConnection(userId, connection);

    return NextResponse.json({
      message: `Connection '${connection}' revoked successfully`,
      revokedGrantIds,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[tokens/revoke] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
