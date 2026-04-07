/**
 * agentOrchestrator.ts — Core Agent Orchestration Engine
 *
 * Security decisions:
 * - Every action passes through the permission engine before execution
 * - Token Vault is called FRESHLY per action — no token caching across actions
 * - Any action requiring approval is queued and never auto-executed
 * - All steps are logged to the audit trail
 * - Task decomposition powered by LLaMA 3 (Groq) with keyword fallback
 *
 * Flow:
 *   runAgent() → analyzeIntent (LLaMA 3 / fallback) → for each action:
 *     1. permission engine evaluation
 *     2. if allow → execute via connector → log success/failure
 *     3. if require_approval → queue pending action → log pending
 *     4. if require_step_up_auth → return step-up URL → log blocked
 *     5. if deny → log denial
 */

import { v4 as uuidv4 } from 'uuid';
import { evaluate, isImmediatelyExecutable, requiresApproval } from '@/lib/permissions/permissionEngine';
import { getTokenForConnection, maskToken } from '@/lib/tokenVault';
import { auditLog } from '@/lib/logs/auditLogger';
import {
  createAgentRun,
  updateAgentStatus,
  updateAgentActions,
  createPendingAction,
  getPendingAction,
  resolvePendingAction,
  listPendingActions,
} from '@/lib/agents/agentRunner';
import { readEmails, sendEmail, deleteEmail } from '@/lib/connectors/gmailConnector';
import {
  AgentTask,
  AgentAction,
  AgentRunStatus,
  ActionName,
  TaskDecomposition,
} from '@/lib/agents/agentTask.types';
import { AgentError, NotFoundError } from '@/lib/errors';
import { analyzeIntent, intentToTaskDecomposition } from '@/lib/intentAnalyzer';

// ── Task Decomposition ────────────────────────────────────────────────────────

/**
 * Decompose a natural language task into discrete agent actions.
 *
 * Powered by LLaMA 3-70B via Groq for semantic understanding.
 * Falls back to keyword matching automatically if Groq is unavailable.
 * The permission engine, approval flows, and audit logs are applied
 * identically regardless of which decomposition path ran.
 */
async function decomposeTask(task: string): Promise<TaskDecomposition> {
  const analysis = await analyzeIntent(task);

  if (analysis.tasks.length === 0) {
    throw new AgentError(
      `No actionable tasks identified in: "${task}". ` +
      'Try: read/summarize emails, send email to <address>, delete email.'
    );
  }

  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const extractedCount = parseInt((task.match(/\b(\d+)\b/) || [])[1]) || undefined;
  const extractedEmail = (task.match(emailRegex) || [])[1] || undefined;

  const decomposition = intentToTaskDecomposition(analysis);
  
  decomposition.actions.forEach(a => {
    if (extractedCount) {
      a.params = { ...a.params, maxResults: extractedCount };
    }
    if (extractedEmail && (a.name === 'send_email' || a.name === 'reply_email')) {
      a.params = { ...a.params, to: extractedEmail, recipient: extractedEmail };
    }
  });
  
  return decomposition;
}

// ── Action Execution ──────────────────────────────────────────────────────────

async function handleAIAction(
  action: AgentAction,
  userId: string,
  connection: string
): Promise<unknown> {
  // Fetch fresh token from Token Vault for each action
  console.log(`\n\n======================================================`);
  console.log(`🚀 [handleAIAction] PIPELINE STARTED`);
  console.log(`======================================================`);
  console.log(`🔑 [handleAIAction] Fetching token for connection: ${connection}`);
  const accessToken = await getTokenForConnection(userId, connection);
  const tokenFingerprint = maskToken(accessToken);
  console.log(`🔑 [handleAIAction] Token acquired, fingerprint: ${tokenFingerprint}`);

  try {
    let result: unknown;
    console.log(`\n⚙️ [handleAIAction] EXECUTING ACTION: ${action.name}`);
    console.log(`📦 [handleAIAction] AI Output / Params:`, JSON.stringify(action.params, null, 2));

    switch (action.name) {
      case 'read_email':
      case 'list_emails': {
        const maxResults = (action.params.maxResults as number) || 5;
        console.log(`📧 [handleAIAction] Calling Gmail API -> readEmails(${maxResults})`);
        result = await readEmails(accessToken, maxResults);
        console.log(`✅ [handleAIAction] Response: Read ${Array.isArray(result) ? result.length : 0} emails`);
        break;
      }
      case 'summarize_emails': {
        const maxResults = (action.params.maxResults as number) || 5;
        console.log(`🧠 [handleAIAction] Calling summarize function -> fetching ${maxResults} emails`);
        const emails = await readEmails(accessToken, maxResults);
        
        console.log(`🧠 [handleAIAction] Summarizing ${emails.length} emails...`);
        if (emails.length === 0) {
          result = "No emails found to summarize.";
        } else {
          // Return the array directly so the Route Handler gracefully formats it onto the dashboard
          result = emails.map(e => ({
            from: e.from,
            subject: e.subject,
            snippet: e.snippet.slice(0, 100) + '...'
          }));
        }
        console.log(`✅ [handleAIAction] Response: Summarized ${emails.length} emails`);
        break;
      }
      case 'send_email': {
        // Supporting both "recipient" and "to" variants from AI output
        const to = (action.params.recipient as string) || (action.params.to as string);
        const subject = action.params.subject as string;
        const body = action.params.body as string;
        
        console.log(`📤 [handleAIAction] Calling Gmail API -> sendEmail(to: ${to})`);
        result = await sendEmail(accessToken, to, subject, body);
        console.log(`✅ [handleAIAction] Response: Email sent successfully, ID: ${(result as { messageId?: string })?.messageId || 'N/A'}`);
        break;
      }
      case 'delete_email':
      case 'delete_data': {
        console.log(`🗑️ [handleAIAction] Calling delete function...`);
        const maxResults = 1;
        const messages = await readEmails(accessToken, maxResults);
        if (messages.length > 0) {
          console.log(`🗑️ [handleAIAction] Targeting data ID: ${messages[0].id} for deletion`);
          result = await deleteEmail(accessToken, messages[0].id);
          console.log(`✅ [handleAIAction] Response: Data deleted successfully.`);
        } else {
          console.log(`⚠️ [handleAIAction] Response: No data found to delete.`);
          result = { status: 'no_data_found' };
        }
        break;
      }
      default:
        console.error(`❌ [handleAIAction] No routing logic implemented for action: ${action.name}`);
        throw new AgentError(`No connector implemented for action: ${action.name}`);
    }

    await auditLog({
      id: uuidv4(),
      userId,
      agentId: action.id,
      action: action.name,
      tokenFingerprint,
      scopes: getScopesForAction(action.name),
      decision: 'allow',
      status: 'success',
      metadata: { connection },
    });

    console.log(`🏁 [handleAIAction] PIPELINE COMPLETED SUCCESSFULLY\n======================================================\n`);
    return result;
  } catch (err: unknown) {
    console.error(`❌ [handleAIAction] Error executing action:`, err);
    await auditLog({
      id: uuidv4(),
      userId,
      agentId: action.id,
      action: action.name,
      tokenFingerprint,
      decision: 'allow',
      status: 'failed',
      metadata: {
        connection,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }
}

function getScopesForAction(action: string): string {
  const scopeMap: Record<string, string> = {
    read_email: 'https://www.googleapis.com/auth/gmail.readonly',
    list_emails: 'https://www.googleapis.com/auth/gmail.readonly',
    summarize_emails: 'https://www.googleapis.com/auth/gmail.readonly',
    send_email: 'https://www.googleapis.com/auth/gmail.send',
    reply_email: 'https://www.googleapis.com/auth/gmail.send',
    delete_email: 'https://www.googleapis.com/auth/gmail.modify',
    delete_data: 'https://www.googleapis.com/auth/gmail.modify',
  };
  return scopeMap[action] || 'unknown';
}

// ── Main Orchestrator ─────────────────────────────────────────────────────────

/**
 * Run an agent task for a user.
 *
 * This function:
 * 1. Creates an agent run record
 * 2. Decomposes the task into actions
 * 3. Evaluates each action through the permission engine
 * 4. Executes allowed actions, queues actions needing approval
 * 5. Returns the run record (which may be in waiting_approval state)
 */
export async function runAgent(
  task: string,
  userId: string
): Promise<AgentTask> {

  // 1. Create run record
  const run = createAgentRun(userId, task);
  updateAgentStatus(run.id, 'running');

  await auditLog({
    id: uuidv4(),
    userId,
    agentId: run.id,
    action: 'agent_start',
    decision: 'info',
    status: 'pending',
    metadata: { task },
  });

  try {
    // 2. Decompose task via LLaMA 3 / keyword fallback
    console.log(`🧠 [runAgent] Decomposing task: "${task}"`);
    const decomposition = await decomposeTask(task);
    console.log(`📋 [runAgent] Decomposed to ${decomposition.actions.length} action(s): ${decomposition.actions.map(a => a.name).join(', ')}`);

    // 3. Build action list with permission evaluations
    const actions: AgentAction[] = decomposition.actions.map((a) => ({
      id: uuidv4(),
      name: a.name as ActionName,
      params: a.params,
      status: 'pending',
    }));

    updateAgentActions(run.id, actions);

    let hasWaiting = false;
    let hasFailed = false;
    let completedCount = 0;

    // 4. Process each action
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const permResult = evaluate(action.name, userId);

      action.permissionDecision = permResult.decision;
      action.permissionReason = permResult.reason;

      // Log permission decision for every action
      await auditLog({
        id: uuidv4(),
        userId,
        agentId: run.id,
        action: action.name,
        decision: permResult.decision,
        status: 'pending',
        metadata: {
          rule: permResult.rule.id,
          reason: permResult.reason,
          riskLevel: permResult.rule.riskLevel,
        },
      });

      if (isImmediatelyExecutable(permResult.decision)) {
        // ── ALLOW: Execute immediately ──────────────────────────────────────
        console.log(`⚡ [runAgent] Executing action: ${action.name} with params:`, action.params);
        action.status = 'running';
        updateAgentActions(run.id, actions);

        try {
          action.result = await handleAIAction(action, userId, decomposition.connection);
          console.log(`✅ [runAgent] Action completed: ${action.name}`);
          action.status = 'completed';
          completedCount++;
        } catch (err: unknown) {
          console.log(`❌ [runAgent] Action failed: ${action.name} - ${err instanceof Error ? err.message : String(err)}`);
          action.error = err instanceof Error ? err.message : String(err);
          action.status = 'failed';
          hasFailed = true;
        }

      } else if (requiresApproval(permResult.decision)) {
        // ── REQUIRE_APPROVAL: Queue for human review ────────────────────────
        const pending = createPendingAction(run.id, userId, action.name, action.params);

        await auditLog({
          id: uuidv4(),
          userId,
          agentId: run.id,
          action: action.name,
          decision: 'require_approval',
          status: 'pending',
          metadata: {
            pendingActionId: pending.id,
            reason: permResult.reason,
          },
        });

        action.status = 'requires_approval';
        // Store pendingActionId for lookup
        action.params = { ...action.params, _pendingActionId: pending.id };
        hasWaiting = true;

      } else if (permResult.decision === 'require_step_up_auth') {
        // ── REQUIRE_STEP_UP_AUTH: Block with re-auth URL ────────────────────
        action.status = 'requires_step_up';
        action.error = permResult.reason;
        action.params = { ...action.params, _stepUpUrl: permResult.stepUpUrl };

        await auditLog({
          id: uuidv4(),
          userId,
          agentId: run.id,
          action: action.name,
          decision: 'require_step_up_auth',
          status: 'failed',
          metadata: {
            stepUpUrl: permResult.stepUpUrl,
            reason: permResult.reason,
          },
        });

        hasFailed = true;

      } else {
        // ── DENY ────────────────────────────────────────────────────────────
        action.status = 'denied';
        action.error = permResult.reason;
        hasFailed = true;
      }

      actions[i] = action;
      updateAgentActions(run.id, actions);
    }

    // 5. Determine final status
    let finalStatus: AgentRunStatus = hasWaiting
      ? 'waiting_approval'
      : hasFailed && completedCount === 0
      ? 'failed'
      : hasFailed
      ? 'partially_completed'
      : 'completed';

    // If any action required step-up, that's the primary status
    if (actions.some(a => a.status === 'requires_step_up')) {
       finalStatus = 'step_up_required';
    }

    const result = {
      summary:
        finalStatus === 'waiting_approval'
          ? 'Agent paused — awaiting human approval for one or more actions.'
          : finalStatus === 'completed'
          ? `Task completed. ${completedCount} action(s) executed successfully.`
          : `Task partially completed. ${completedCount} action(s) succeeded.`,
      actionsCompleted: completedCount,
      actionsFailed: actions.filter((a) => a.status === 'failed' || a.status === 'denied').length,
      actionsPending: actions.filter((a) => a.status === 'requires_approval').length,
      data: actions
        .filter((a) => a.result !== undefined)
        .map((a) => ({ action: a.name, result: a.result })),
    };

    updateAgentStatus(run.id, finalStatus, { result, actions });

    await auditLog({
      id: uuidv4(),
      userId,
      agentId: run.id,
      action: 'agent_complete',
      decision: 'info',
      status: finalStatus === 'completed' ? 'success' : finalStatus === 'failed' ? 'failed' : 'pending',
      metadata: { finalStatus, completedCount },
    });

    return { ...run, status: finalStatus, actions, result };

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    updateAgentStatus(run.id, 'failed', { error: errMsg });

    await auditLog({
      id: uuidv4(),
      userId,
      agentId: run.id,
      action: 'agent_error',
      decision: 'error',
      status: 'failed',
      metadata: { error: errMsg },
    });

    throw err;
  }
}

/**
 * Execute an approved pending action.
 * Called when user POSTs to /agent/approve
 */
export async function executeApprovedAction(
  actionId: string,
  userId: string
): Promise<{ result: unknown; action: ReturnType<typeof getPendingAction> }> {

  const pending = getPendingAction(actionId);
  if (!pending) throw new NotFoundError(`Pending action ${actionId}`);
  if (pending.userId !== userId) throw new AgentError('Cannot approve action for another user.');
  if (pending.status !== 'pending') {
    throw new AgentError(`Action already resolved: ${pending.status}`);
  }

  // Re-evaluate permission — must still require_approval (sanity check)
  const permResult = evaluate(pending.actionName, userId);
  if (permResult.decision === 'deny') {
    resolvePendingAction(actionId, 'denied');
    throw new AgentError(`Action ${pending.actionName} is no longer permitted.`);
  }

  // Mark as approved
  resolvePendingAction(actionId, 'approved');

  const connection = process.env.AUTH0_CONNECTION_GOOGLE || 'google-oauth2';
  const accessToken = await getTokenForConnection(userId, connection);
  const tokenFingerprint = maskToken(accessToken);

  // Execute the action
  const agentAction: AgentAction = {
    id: uuidv4(),
    name: pending.actionName as ActionName,
    params: pending.actionData,
    status: 'running',
    permissionDecision: 'allow', // Human approved
    permissionReason: 'Human-approved',
  };

  try {
    const result = await handleAIAction(agentAction, userId, connection);

    await auditLog({
      id: uuidv4(),
      userId,
      agentId: pending.runId,
      action: pending.actionName,
      tokenFingerprint,
      decision: 'allow',
      status: 'success',
      metadata: { approvedActionId: actionId, humanApproved: true },
    });

    // Update the parent run to completed if no more pending actions
    const remaining = listPendingActions(userId).filter(p => p.runId === pending.runId);
    if (remaining.length === 0) {
      updateAgentStatus(pending.runId, 'completed');
    }

    return { result, action: pending };
  } catch (err: unknown) {
    await auditLog({
      id: uuidv4(),
      userId,
      agentId: pending.runId,
      action: pending.actionName,
      tokenFingerprint,
      decision: 'allow',
      status: 'failed',
      metadata: {
        approvedActionId: actionId,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }
}

/**
 * Deny a pending action.
 */
export async function denyPendingAction(
  actionId: string,
  userId: string
): Promise<ReturnType<typeof getPendingAction>> {
  const pending = getPendingAction(actionId);
  if (!pending) throw new NotFoundError(`Pending action ${actionId}`);
  if (pending.userId !== userId) throw new AgentError('Cannot deny action for another user.');
  if (pending.status !== 'pending') {
    throw new AgentError(`Action already resolved: ${pending.status}`);
  }

  resolvePendingAction(actionId, 'denied');

  await auditLog({
    id: uuidv4(),
    userId,
    agentId: pending.runId,
    action: pending.actionName,
    decision: 'deny',
    status: 'denied',
    metadata: { deniedActionId: actionId, humanDenied: true },
  });

  return getPendingAction(actionId);
}
