/**
 * agentRoutes.ts — Agent API Routes
 *
 * POST /agent/run         → Submit a task
 * GET  /agent/status/:id  → Poll run status
 * GET  /agent/pending     → List all pending actions for user
 * POST /agent/approve     → Approve a pending action
 * POST /agent/deny        → Deny a pending action
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requireSession } from '../core/middleware';
import { getCurrentUserId } from '../auth/auth0Client';
import { runAgent, executeApprovedAction, denyPendingAction } from '../agents/agentOrchestrator';
import { getAgentRun, listAgentRuns, listPendingActions } from '../agents/agentRunner';
import { ValidationError, NotFoundError } from '../core/errors';

const router = Router();

// All agent routes require an authenticated session
router.use(requireSession);

/**
 * POST /agent/run
 * Submit a task for the agent to execute.
 *
 * Body: { task: string }
 * Returns: AgentTask (may be in 'waiting_approval' state)
 */
router.post('/run', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { task } = req.body as { task?: string };

    if (!task || typeof task !== 'string' || task.trim().length === 0) {
      throw new ValidationError('Request body must include a non-empty "task" string.');
    }

    if (task.length > 1000) {
      throw new ValidationError('Task description must be 1000 characters or fewer.');
    }

    const userId = getCurrentUserId(req);
    const result = await runAgent(task.trim(), userId, req);

    res.status(result.status === 'waiting_approval' ? 202 : 200).json({
      success: true,
      run: result,
      message:
        result.status === 'waiting_approval'
          ? 'Agent paused — one or more actions require your approval.'
          : result.status === 'completed'
          ? 'Agent task completed successfully.'
          : `Agent task status: ${result.status}`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /agent/status/:id
 * Poll the status of a specific agent run.
 */
router.get('/status/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getCurrentUserId(req);
    const run = getAgentRun(req.params.id);

    if (!run || run.userId !== userId) {
      throw new NotFoundError(`Agent run ${req.params.id}`);
    }

    res.json({ success: true, run });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /agent/runs
 * List recent agent runs for the authenticated user.
 */
router.get('/runs', (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getCurrentUserId(req);
    const runs = listAgentRuns(userId, 20);
    res.json({ success: true, runs });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /agent/pending
 * List pending actions awaiting human approval.
 */
router.get('/pending', (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getCurrentUserId(req);
    const pending = listPendingActions(userId);
    res.json({ success: true, pending });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /agent/approve
 * Approve a pending action and execute it.
 *
 * Body: { actionId: string }
 * Returns: execution result
 */
router.post('/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { actionId } = req.body as { actionId?: string };

    if (!actionId || typeof actionId !== 'string') {
      throw new ValidationError('Request body must include "actionId".');
    }

    const userId = getCurrentUserId(req);
    const { result, action } = await executeApprovedAction(actionId, userId, req);

    res.json({
      success: true,
      message: `Action '${action?.actionName}' approved and executed successfully.`,
      result,
      action,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /agent/deny
 * Deny a pending action.
 *
 * Body: { actionId: string }
 */
router.post('/deny', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { actionId } = req.body as { actionId?: string };

    if (!actionId || typeof actionId !== 'string') {
      throw new ValidationError('Request body must include "actionId".');
    }

    const userId = getCurrentUserId(req);
    const action = await denyPendingAction(actionId, userId);

    res.json({
      success: true,
      message: `Action '${action?.actionName}' denied.`,
      action,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
