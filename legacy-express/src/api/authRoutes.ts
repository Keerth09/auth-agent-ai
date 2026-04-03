/**
 * authRoutes.ts — Authentication API Routes
 *
 * Routes handled by express-openid-connect automatically:
 *   GET /auth/login    → redirects to Auth0 Universal Login
 *   GET /auth/callback → handles Auth0 callback, creates session
 *   GET /auth/logout   → clears session, redirects to Auth0 logout
 *
 * We add:
 *   GET /auth/me       → returns current user profile (requires session)
 *   GET /auth/status   → returns auth state (no session required)
 */

import { Router, Request, Response } from 'express';
import { requireSession } from '../core/middleware';
import { getSafeUserProfile, getCurrentUserId } from '../auth/auth0Client';

const router = Router();

/**
 * GET /auth/me — Returns the authenticated user's profile.
 * Security: Never returns token data, only public profile fields.
 */
router.get('/me', requireSession, (req: Request, res: Response) => {
  const profile = getSafeUserProfile(req);
  res.json({
    authenticated: true,
    user: profile,
  });
});

/**
 * GET /auth/status — Returns auth state without requiring session.
 * Used by the frontend to determine if login is needed.
 */
router.get('/status', (req: Request, res: Response) => {
  if (req.oidc?.isAuthenticated()) {
    const profile = getSafeUserProfile(req);
    res.json({
      authenticated: true,
      user: {
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
      },
    });
  } else {
    res.json({
      authenticated: false,
      loginUrl: '/auth/login',
    });
  }
});

export default router;
