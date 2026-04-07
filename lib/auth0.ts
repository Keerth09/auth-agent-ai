import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * Auth0 SDK Client
 *
 * IMPORTANT: `appBaseUrl` is intentionally NOT set here.
 * The SDK auto-detects it from the incoming request's `Host` header at
 * runtime. This means the same server works on localhost AND on any
 * other machine on the LAN without a "Callback URL mismatch" from Auth0.
 *
 * Auth0 Dashboard → Applications → Settings MUST include ALL allowed origins:
 *   Allowed Callback URLs:
 *     http://localhost:3000/api/auth/callback,
 *     http://192.168.29.111:3000/api/auth/callback
 *   Allowed Logout URLs:
 *     http://localhost:3000,
 *     http://192.168.29.111:3000
 *   Allowed Web Origins:
 *     http://localhost:3000,
 *     http://192.168.29.111:3000
 *
 * Replace 192.168.29.111 with your machine's actual LAN IP.
 */
export const auth0 = new Auth0Client({
  domain:       process.env.AUTH0_DOMAIN!,
  clientId:     process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  secret:       process.env.AUTH0_SECRET!,
  // No appBaseUrl — SDK infers from Host header per-request ✓

  session: {
    rolling:            true,
    absoluteDuration:   60 * 60 * 24 * 7,
    inactivityDuration: 60 * 60 * 24,
    cookie: {
      sameSite: "lax",
      secure:   process.env.NODE_ENV === "production",
    },
  },

  authorizationParameters: {
    scope: "openid profile email offline_access",
  },

  signInReturnToPath: "/dashboard",

  // Routes must match links throughout the app and what proxy.ts handles
  routes: {
    login:    "/api/auth/login",
    logout:   "/api/auth/logout",
    callback: "/api/auth/callback",
  },
});
