import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

/**
 * VaultProxy — Next.js Middleware (proxy.ts)
 *
 * Route decision tree:
 *   OPTIONS          → 200 (CORS preflight)
 *   _next/* internal → pass through (RSC payloads, HMR, prefetch)
 *   /api/auth/*      → auth0.middleware (login / callback / logout)
 *   /api/*           → pass through (Route Handlers own their auth)
 *   /dashboard/*     → auth0.middleware (protected — redirects if no session)
 *   / (landing page) → pass through (public)
 *   everything else  → pass through (public)
 */

export const config = {
  // Only run on paths that aren't Next.js static assets
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ── 1. Skip Next.js RSC / prefetch / HMR internals ─────────────────────
  // These are browser-internal requests from Turbopack; auth middleware must
  // never intercept them — doing so causes "Load failed" errors on the client.
  if (
    search.includes("_rsc") ||
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-Prefetch") === "1" ||
    request.headers.get("Next-Router-State-Tree") !== null ||
    pathname.startsWith("/_next/")
  ) {
    return NextResponse.next();
  }

  // ── 2. CORS preflight ───────────────────────────────────────────────────
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

  // ── 3. Auth0 SDK routes ─────────────────────────────────────────────────
  // The SDK handles /api/auth/login, /api/auth/callback, /api/auth/logout
  if (pathname.startsWith("/api/auth/")) {
    return await auth0.middleware(request);
  }

  // ── 4. Data API routes — Route Handlers own their auth ──────────────────
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ── 5. Protected pages: /dashboard/* ────────────────────────────────────
  // auth0.middleware will redirect to /api/auth/login if no valid session.
  if (pathname.startsWith("/dashboard")) {
    return await auth0.middleware(request);
  }

  // ── 6. Public routes (landing page, etc.) ───────────────────────────────
  return NextResponse.next();
}
