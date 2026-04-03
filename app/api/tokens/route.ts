import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { listActiveConnections } from "@/lib/tokenVault";
import { PERMISSION_RULES } from "@/lib/permissions/permissionRules";

export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session) return NextResponse.json({ authenticated: false }, { status: 200 });

    const connections = await listActiveConnections(session.user.sub);

    return NextResponse.json({
      authenticated: true,
      connections,
      permissionRules: PERMISSION_RULES,
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
}
