/**
 * VaultProxy Agent Execution Endpoint
 * Complete Next.js server route connecting intent parsing, permission checks, logging,
 * and authenticated zero-trust token retrieval.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth0 } from "@/lib/auth0";

import { parseIntent } from "@/lib/intentParser";
import { evaluatePermission } from "@/lib/permissions";
import { logAgentRun, updateAgentRun, createPendingAction } from "@/lib/database";
import { executeWithToken } from "@/lib/tokenVault";
import { summarizeEmails } from "@/lib/tools/gmail";

function getStepUpAuthUrl() {
  const domain = process.env.AUTH0_ISSUER_BASE_URL || "https://example.auth0.com";
  const clientId = process.env.AUTH0_CLIENT_ID;
  const baseUrl = process.env.AUTH0_BASE_URL || "http://localhost:3000";
  
  return `${domain}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${baseUrl}/auth/callback&scope=openid%20profile%20email&acr_values=http://schemas.openid.net/pape/policies/2007/06/multi-factor`;
}

const RunTaskSchema = z.object({
  task: z.string().min(1).max(500),
});

/**
 * POST endpoint enforcing 10-layer protocol for all incoming user agent instructions.
 */
export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    // LAYER 2: Ensure valid session enforcement barrier
    const session = await auth0.getSession();
    
    if (!session || !session.user) {
      console.log(`⚠️ Blocked unauthorized API route call`);
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "A valid session is required.", retryable: false },
        { status: 401 }
      );
    }
    const userId = session.user.sub;

    // LAYER 5: Input structural validation
    const bodyText = await req.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "Invalid JSON body format.", retryable: false },
        { status: 400 }
      );
    }

    const parseResult = RunTaskSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Task must be a string up to 500 characters", retryable: false },
        { status: 400 }
      );
    }
    const { task } = parseResult.data;

    // LAYER 6: Intent Parsing & Permission Engine
    const { service, action } = parseIntent(task);
    const { risk, requiresApproval, requiresMFA } = evaluatePermission(service, action);

    // LAYER 9: Initial immutable context logging
    const logId = logAgentRun({
      userId,
      task,
      service,
      action,
      risk: risk as string,
      status: "evaluating_permissions",
      mfaTriggered: requiresMFA,
      approvalRequired: requiresApproval,
    });

    // --- DESTRUCTIVE FLOW ---
    if (requiresMFA) {
      updateAgentRun(logId, { status: "step_up_required", durationMs: Date.now() - startTime });
      return NextResponse.json({
        status: "step_up_required",
        authUrl: getStepUpAuthUrl(),
        message: "This action is destructive and requires multi-factor authentication."
      });
    }

    // --- WRITE FLOW ---
    if (requiresApproval) {
      updateAgentRun(logId, { status: "pending_approval", durationMs: Date.now() - startTime });
      createPendingAction({
        run_id: logId,
        user_id: userId,
        action_name: `${service.toUpperCase()}: ${action.toUpperCase()}`,
        action_data: JSON.stringify({ task, service, action })
      });
      return NextResponse.json({
        status: "pending_approval",
        actionId: logId,
        message: "Waiting for your approval. Please navigate to the Approvals dashboard."
      });
    }

    // --- READ / SAFE FLOW ---
    updateAgentRun(logId, { status: "executing" });

    let finalResult = "Unknown service or action request detected.";
    let tokenFingerprint = "none";

    try {
      // Execute the task via Auth0 Token Vault execution abstraction
      if (service === "gmail" && action === "read") {
        finalResult = await executeWithToken(userId, service, async (token) => {
          // Identify scope reference string snippet
          tokenFingerprint = `...${token.slice(-4)}`;
          return await summarizeEmails(token, 5);
        });
      } else {
        throw new Error(`Execution environment tool for ${service}.${action} is currently undefined.`);
      }

      updateAgentRun(logId, {
        status: "completed",
        result: finalResult,
        tokenFingerprint,
        durationMs: Date.now() - startTime
      });
      
      console.log(`✅ Request fully processed seamlessly: [Log ID: ${logId}]`);

      return NextResponse.json({
        status: "completed",
        result: finalResult,
        fingerprint: tokenFingerprint,
        durationMs: Date.now() - startTime
      });

    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'name' in e && (e as { name: string }).name === 'FederatedConnectionAccessTokenError') {
         updateAgentRun(logId, { status: "denied", durationMs: Date.now() - startTime, result: "Access denied — connection revoked" });
         return NextResponse.json(
           { error: "ACCESS_DENIED", message: "Access denied — connection revoked.", retryable: false },
           { status: 403 }
         );
      }
      
      const errorMsg = e instanceof Error ? e.message : "Internal Tool Execution Error during secure wrapper attempt.";
      updateAgentRun(logId, { status: "failed", durationMs: Date.now() - startTime, result: errorMsg });
      
      return NextResponse.json(
        { error: "EXECUTION_FAILED", message: errorMsg, retryable: true },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error(`❌ Fatal unified execution endpoint error:`, error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: "An unexpected system-level error occurred.", retryable: true },
      { status: 500 }
    );
  }
}
