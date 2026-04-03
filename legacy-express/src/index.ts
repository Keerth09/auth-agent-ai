/**
 * index.ts — Application Entry Point
 *
 * Bootstraps the Express app with:
 * - Environment variable validation
 * - Security middleware (Helmet, CORS)
 * - Auth0 OIDC middleware
 * - Database initialization
 * - API routes
 * - Static file serving (the premium UI)
 * - Global error handling
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { auth } from 'express-openid-connect';

import { initDatabase } from './core/database';
import {
  securityHeaders,
  corsMiddleware,
  requestLogger,
  globalErrorHandler,
  notFoundHandler,
} from './core/middleware';
import { getAuth0Config } from './auth/auth0Client';

import authRoutes from './api/authRoutes';
import agentRoutes from './api/agentRoutes';
import logRoutes from './api/logRoutes';
import tokenRoutes from './api/tokenRoutes';

// ── Startup Validation ────────────────────────────────────────────────────────

const REQUIRED_ENV_VARS = [
  'AUTH0_DOMAIN',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
  'AUTH0_CALLBACK_URL',
  'AUTH0_BASE_URL',
  'SESSION_SECRET',
  'AUTH0_M2M_CLIENT_ID',
  'AUTH0_M2M_CLIENT_SECRET',
  'AUTH0_M2M_AUDIENCE',
];

const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error('❌  Missing required environment variables:');
  missing.forEach((v) => console.error(`   - ${v}`));
  console.error('\nCopy .env.example to .env and fill in your Auth0 credentials.');
  process.exit(1);
}

// ── Initialize Database ──────────────────────────────────────────────────────

initDatabase();

// ── Build Express App ─────────────────────────────────────────────────────────

const app = express();

// Security headers first
app.use(securityHeaders);
app.use(corsMiddleware);

// Logging
app.use(requestLogger);

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Auth0 OIDC (mounts /auth/login, /auth/callback, /auth/logout automatically)
app.use(auth(getAuth0Config()));

// ── API Routes ────────────────────────────────────────────────────────────────

app.use('/auth', authRoutes);
app.use('/agent', agentRoutes);
app.use('/logs', logRoutes);
app.use('/tokens', tokenRoutes);

/**
 * Health check endpoint — no auth required.
 * Returns service status and configuration summary.
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Agent Control Center',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    auth: {
      domain: process.env.AUTH0_DOMAIN,
      connection: process.env.AUTH0_CONNECTION_GOOGLE || 'google-oauth2',
    },
  });
});

// ── Static UI ─────────────────────────────────────────────────────────────────

// Serve the premium UI from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// SPA fallback — return index.html for all non-API routes
app.get(/^(?!\/auth|\/agent|\/logs|\/tokens|\/health).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── Error Handling ────────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(globalErrorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         Agent Control Center (ACC) — v1.0.0             ║');
  console.log('║         Authorized AI Agents via Auth0 Token Vault      ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  🚀  Server:    http://localhost:${PORT}                    ║`);
  console.log(`║  🔐  Auth0:     ${process.env.AUTH0_DOMAIN?.padEnd(35)}║`);
  console.log(`║  🔌  Connect:   ${(process.env.AUTH0_CONNECTION_GOOGLE || 'google-oauth2').padEnd(35)}║`);
  console.log(`║  💾  Database:  ${(process.env.DB_PATH || ':memory:').padEnd(35)}║`);
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  Endpoints:                                              ║');
  console.log('║   GET  /auth/login      → Login via Auth0               ║');
  console.log('║   POST /agent/run       → Run agent task                ║');
  console.log('║   POST /agent/approve   → Approve pending action        ║');
  console.log('║   POST /agent/deny      → Deny pending action           ║');
  console.log('║   GET  /logs            → Audit log feed                ║');
  console.log('║   GET  /tokens          → Token connection status       ║');
  console.log('║   POST /tokens/revoke   → Revoke connection             ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
});

export default app;
