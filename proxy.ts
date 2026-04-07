import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

/**
 * VaultProxy — Next.js Middleware (proxy.ts)
 *
 * Route decision tree:
 *   OPTIONS         → 200 (CORS preflight)
 *   /api/auth/*     → auth0.middleware  (handles login / callback / logout)
 *   /api/*          → NextResponse.next()  (Route Handlers own their auth)
 *   everything else → auth0.middleware  (enforces session, redirects if missing)
 */

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── CORS preflight ──────────────────────────────────────────────────────
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // ── Auth0 routes — MUST go through auth0.middleware ─────────────────────
  // The SDK handles /api/auth/login, /api/auth/callback, /api/auth/logout
  if (pathname.startsWith("/api/auth/")) {
    return await auth0.middleware(request);
  }

  // ── Data API routes — bypass auth middleware entirely ───────────────────
  // Route Handlers return 401 JSON themselves when session is missing.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ── All page routes — enforce session via auth0.middleware ───────────────
  return await auth0.middleware(request);
}
