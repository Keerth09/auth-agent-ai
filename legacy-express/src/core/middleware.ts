/**
 * middleware.ts — Express Middleware Stack
 *
 * Security decisions:
 * - helmet() sets secure HTTP headers (HSTS, CSP, etc.)
 * - CORS is restricted to the app's own origin in production
 * - Structured error responses include machine-readable 'code' field
 * - Stack traces are NEVER exposed in production responses
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { AppError } from './errors';

/** Security headers via Helmet */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

/** CORS — allows only the configured base URL in production */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.AUTH0_BASE_URL || 'http://localhost:3000',
    ];
    // Allow requests with no origin (same-origin, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

/** HTTP request logging */
export const requestLogger = morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
);

/** Require authenticated session — used as route middleware */
export function requireSession(req: Request, res: Response, next: NextFunction): void {
  if (!req.oidc || !req.oidc.isAuthenticated()) {
    res.status(401).json({
      error: 'UNAUTHENTICATED',
      message: 'Valid Auth0 session required. Please login at /auth/login',
    });
    return;
  }
  next();
}

/** Global error handler — always the last middleware registered */
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isProduction = process.env.NODE_ENV === 'production';

  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      // Expose stepUpUrl for step-up auth redirect
      ...('stepUpUrl' in err ? { stepUpUrl: (err as { stepUpUrl: string }).stepUpUrl } : {}),
      // Expose pendingActionId for approval flows
      ...('pendingActionId' in err ? { pendingActionId: (err as { pendingActionId: string }).pendingActionId } : {}),
    });
  } else {
    // Unexpected error — log stack, return generic 500
    console.error('[ERROR] Unexpected:', err);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      // Only expose details in development
      ...(isProduction ? {} : { detail: err.message }),
    });
  }
}

/** Handle 404 for unmatched routes */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
}
