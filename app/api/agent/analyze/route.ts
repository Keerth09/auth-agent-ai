/**
 * /api/agent/analyze — Live Intent Classification Endpoint
 *
 * Lightweight endpoint that calls LLaMA 3 (Groq) to classify
 * a user task BEFORE execution. Powers the live preview panel
 * on the Run Agent page. Does NOT execute any action.
 *
 * Security: Requires a valid session. Reads only — no side effects.
 */

import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { analyzeIntent } from '@/lib/intentAnalyzer';

export async function POST(req: Request) {
  try {
    // Auth guard
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'A valid session is required.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const task = typeof body?.task === 'string' ? body.task.trim() : '';

    if (!task || task.length < 3) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Task must be at least 3 characters.' },
        { status: 400 }
      );
    }

    if (task.length > 500) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Task must be under 500 characters.' },
        { status: 400 }
      );
    }

    const analysis = await analyzeIntent(task);

    return NextResponse.json({
      tasks: analysis.tasks,
      raw_intent: analysis.raw_intent,
      source: analysis.source,
      model: analysis.model ?? null,
    });
  } catch (error: unknown) {
    console.error('❌ [/api/agent/analyze] Error:', error);
    const message = error instanceof Error ? error.message : 'Intent analysis failed.';
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message },
      { status: 500 }
    );
  }
}
