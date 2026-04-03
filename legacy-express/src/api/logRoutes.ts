/**
 * logRoutes.ts — Audit Log API Routes
 *
 * GET /logs — Query audit logs
 *
 * Security: Users can only query THEIR OWN logs unless they have admin role.
 * The permission engine ensures this — no cross-user log access.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requireSession } from '../core/middleware';
import { getCurrentUserId } from '../auth/auth0Client';
import { getAuditLogs, getAuditLogCount } from '../logs/auditLogger';

const router = Router();

router.use(requireSession);

/**
 * GET /logs
 * Returns audit logs for the authenticated user.
 *
 * Query params:
 *   action    — filter by action name
 *   status    — filter by status (success|failed|pending|revoked)
 *   decision  — filter by permission decision
 *   agentId   — filter by agent run ID
 *   limit     — max results (default 50, max 500)
 *   offset    — pagination offset
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getCurrentUserId(req);

    const filters = {
      userId, // Always scope to current user — security boundary
      action: req.query.action as string | undefined,
      status: req.query.status as string | undefined,
      decision: req.query.decision as string | undefined,
      agentId: req.query.agentId as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
    };

    const logs = getAuditLogs(filters);
    const total = getAuditLogCount({ userId, action: filters.action, status: filters.status });

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset || 0) + logs.length < total,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
