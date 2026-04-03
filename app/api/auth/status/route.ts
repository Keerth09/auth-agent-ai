import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        name: session.user.name,
        email: session.user.email,
        picture: session.user.picture,
        sub: session.user.sub,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
