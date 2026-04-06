/**
 * proxy.ts — Auth0 Edge Middleware
 *
 * Next.js 16 renamed the "middleware" file convention to "proxy".
 * This file intercepts every request and delegates to Auth0's middleware
 * which handles:
 *   - /api/auth/login       → Redirect to Auth0 Universal Login
 *   - /api/auth/callback    → Exchange code for session cookie
 *   - /api/auth/logout      → Clear session + redirect
 *   - All other routes      → Validate/refresh session cookie
 *
 * Dashboard route protection is handled client-side in the dashboard
 * layout (app/dashboard/layout.tsx) via the /api/auth/status endpoint.
 */

import { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

export default async function proxy(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets:
     * - _next/static  (Next.js compiled assets)
     * - _next/image   (Image optimization endpoint)
     * - favicon.ico   (Browser favicon)
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
