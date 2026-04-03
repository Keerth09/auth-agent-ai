import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  session: {
    storeIdToken: true,
    rollingDuration: 60 * 60 * 24,    // 24 hours rolling
    absoluteDuration: 60 * 60 * 24 * 7 // 7 days absolute
  },
});
