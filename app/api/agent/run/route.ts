import { NextResponse } from "next/server";
import { z } from "zod";
import { auth0 } from "@/lib/auth0";

import { runAgent } from "@/lib/agents/agentOrchestrator";
import { StepUpAuthRequired } from "@/lib/errors";

const RunTaskSchema = z.object({
  task: z.string().min(1).max(500),
});

/**
 * POST endpoint enforcing 10-layer protocol for all incoming user agent instructions.
 * Unified via the Agent Orchestrator.
 */
export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "A valid session is required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = RunTaskSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Invalid task input." },
        { status: 400 }
      );
    }

    const { task } = parseResult.data;
    const userId = session.user.sub as string;

    // Execute via Orchestrator
    const run = await runAgent(task, userId);

    // Map result for frontend
    let resultText = run.result?.summary || run.status;
    
    // Concatenate actual data (e.g. email contents) into the result text
    const resultData = run.result?.data;
    if (resultData && resultData.length > 0) {
      const dataResults = (resultData as Array<{ action: string; result: unknown }>).map((d) => {
        if (Array.isArray(d.result)) {
           return (d.result as Array<{ from?: string; subject?: string; snippet?: string }>).map((item) => 
             `[${d.action}] ${item.from || "System"}: ${item.subject || "No Subject"}\n   ${item.snippet || ""}`
           ).join("\n\n");
        }
        return `[${d.action}] ${JSON.stringify(d.result)}`;
      }).join("\n\n---\n\n");
      
      resultText = `${resultText}\n\n${dataResults}`;
    }

    const response: {
      status: string;
      result: string;
      actionId: string;
      fingerprint?: string;
      message?: string;
    } = {
      status: run.status,
      result: resultText,
      actionId: run.id,
      fingerprint: run.tokenFingerprint,
    };

    // If waiting for approval, highlight it
    if (run.status === "waiting_approval") {
      response.message = "This action requires human approval.";
    }

    // If step-up required, extract the URL from the actions
    if (run.status === "step_up_required") {
       const stepUpAction = run.actions.find(a => a.status === 'requires_step_up');
       if (stepUpAction && stepUpAction.params?._stepUpUrl) {
         return NextResponse.json({
           status: "step_up_required",
           authUrl: stepUpAction.params._stepUpUrl as string,
           message: "Step-up authentication is required for this destructive action.",
           actionId: run.id
         });
       }
    }

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error(`❌ Agent Route Error:`, error);
    
    // Handle specific security flow errors
    if (error instanceof StepUpAuthRequired) {
       return NextResponse.json({
         status: "step_up_required",
         authUrl: error.stepUpUrl,
         message: error.message
       });
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to execute agent task.";
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: errorMessage },
      { status: 500 }
    );
  }
}
