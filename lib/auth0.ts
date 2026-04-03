import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  domain:       process.env.AUTH0_DOMAIN!,
  clientId:     process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  appBaseUrl:   process.env.AUTH0_BASE_URL!,

  session: {
    rolling:            true,
    absoluteDuration:   60 * 60 * 24 * 7,  // 7-day hard cap
    inactivityDuration: 60 * 60 * 24,      // expire after 24h of inactivity
    cookie: {
      sameSite: "lax",
      secure:   process.env.NODE_ENV === "production",
    },
  },

  authorizationParameters: {
    scope: "openid profile email offline_access",
  },
  signInReturnToPath: "/dashboard",
});
