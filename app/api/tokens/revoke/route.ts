import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { revokeConnection } from "@/lib/tokenVault";

export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { connection } = await req.json();
    if (!connection) return NextResponse.json({ error: "Connection name required" }, { status: 400 });

    const result = await revokeConnection(session.user.sub, connection);

    return NextResponse.json({
      message: `Connection '${connection}' revoked. Access tokens invalidated.`,
      ...result,
      securityNote: "Local cache updated. Auth0 Grant deleted. Subsequent requests will return 401.",
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
}
