/**
 * auth0Client.ts — Auth0 Express OpenID Connect Configuration
 *
 * Security decisions:
 * - Uses express-openid-connect which handles PKCE, state, nonce automatically
 * - httpOnly + secure cookies (enabled in production)
 * - idTokenSigningAlg enforced to RS256 (asymmetric — Auth0 default)
 * - Routes: /auth/login, /auth/callback, /auth/logout are auto-mounted
 */

import { ConfigParams } from 'express-openid-connect';

/**
 * Auth0 middleware configuration.
 * This is passed to the `auth()` middleware from express-openid-connect.
 */
export function getAuth0Config(): ConfigParams {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  const baseUrl = process.env.AUTH0_BASE_URL;
  const callbackUrl = process.env.AUTH0_CALLBACK_URL;
  const sessionSecret = process.env.SESSION_SECRET;

  // All required variables must be present at startup
  if (!domain || !clientId || !clientSecret || !baseUrl || !callbackUrl || !sessionSecret) {
    throw new Error(
      'Missing required Auth0 environment variables. Check .env.example for all required fields.'
    );
  }

  return {
    authRequired: false, // We handle per-route auth with requireSession middleware
    auth0Logout: true,
    secret: sessionSecret,
    baseURL: baseUrl,
    clientID: clientId,
    clientSecret: clientSecret,
    issuerBaseURL: `https://${domain}`,
    routes: {
      login: '/auth/login',
      callback: '/auth/callback',
      logout: '/auth/logout',
    },
    authorizationParams: {
      response_type: 'code',
      scope: process.env.AUTH0_SCOPE || 'openid profile email offline_access',
      // Request the Google connection to trigger Gmail OAuth
      connection: process.env.AUTH0_CONNECTION_GOOGLE || 'google-oauth2',
    },
    session: {
      rollingDuration: 86400,  // 24 hours rolling session
      absoluteDuration: 604800, // 7 days absolute max
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
      },
    },
    /**
     * afterCallback hook — runs after Auth0 callback.
     * We store the ID token in the session for use with Token Vault exchange.
     */
    afterCallback: (_req, _res, session) => {
      // The session is automatically managed by express-openid-connect
      // idToken is available at req.oidc.idToken for token exchange calls
      return session;
    },
  };
}

/**
 * Get the current user's Auth0 sub (user ID) from the OIDC session.
 * This is guaranteed to be present if requireSession middleware passed.
 */
import { Request } from 'express';

export function getCurrentUserId(req: Request): string {
  const userId = req.oidc?.user?.sub;
  if (!userId) {
    throw new Error('Cannot get user ID: no authenticated session');
  }
  return userId;
}

/**
 * Get the current user's ID token from session.
 * Used for Token Vault token exchange calls.
 */
export function getCurrentIdToken(req: Request): string {
  const idToken = req.oidc?.idToken;
  if (!idToken) {
    throw new Error(
      'Cannot get ID token: session exists but idToken is missing. ' +
      'Ensure offline_access scope is requested and session idToken is preserved.'
    );
  }
  return idToken;
}

/**
 * Get a sanitized user profile for API responses.
 * Never exposes internal Auth0 fields or token data.
 */
export function getSafeUserProfile(req: Request): {
  userId: string;
  name: string;
  email: string;
  picture: string;
} {
  const user = req.oidc?.user;
  return {
    userId: user?.sub || '',
    name: user?.name || user?.nickname || 'Unknown',
    email: user?.email || '',
    picture: user?.picture || '',
  };
}
