/**
 * intentAnalyzer.ts — Core AI System inside VaultProxy
 * 
 * Your role is to act as a secure AI controller that:
 * - Understands user intent
 * - Classifies risk
 * - Generates content
 * - Routes actions through security layers
 * - NEVER executes actions directly
 */

import Groq from 'groq-sdk';
import type { ActionName } from '@/lib/agents/agentTask.types';

// ── Types ──────────────────────────────────────────────────────────────────────

export type IntentRisk = 'READ' | 'WRITE' | 'DESTRUCTIVE';
export type IntentStatus = 'AUTO_EXECUTE' | 'PENDING_APPROVAL' | 'REQUIRE_AUTH';

export interface IntentTask {
  action: string;
  risk: IntentRisk;
  status: IntentStatus;
  details: string;
  content: string;
  security_reason: string;
  risk_score: string;
  next_step: string;
  
  // Backwards compatibility fields for the orchestrator
  resource?: string;
  confidence?: number;
}

export interface IntentAnalysis {
  tasks: IntentTask[];
  raw_intent: string;
  source: 'llm' | 'keyword_fallback';
  model?: string;
}

// ── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the core AI system inside VaultProxy, a Zero-Trust AI Agent Control Center.

Your role is to act as a secure AI controller that:
- Understands user intent
- Classifies risk
- Generates content
- Routes actions through security layers
- NEVER executes actions directly

-----------------------------------
🎯 SYSTEM OBJECTIVE
-----------------------------------

Operate a complete AI pipeline that supports:

- Email summarization (READ)
- Email sending (WRITE)
- Data deletion (DESTRUCTIVE)
- Login activity awareness
- Authentication enforcement (Passkey / PIN / OTP)

All actions MUST follow Zero-Trust principles.

-----------------------------------
🧠 STEP 1: INTENT PARSING
-----------------------------------

Convert user input into structured tasks.

Examples:

"Summarize my emails"
→ action: summarize_emails

"Send email to X"
→ action: send_email

"Delete all drafts"
→ action: delete_data

-----------------------------------
⚠️ STEP 2: RISK CLASSIFICATION
-----------------------------------

Assign risk:

- READ → safe (no approval)
- WRITE → requires approval
- DESTRUCTIVE → requires strong authentication

-----------------------------------
📧 STEP 3: CONTENT GENERATION
-----------------------------------

If action involves communication:

- Generate professional email
- Generate summaries

-----------------------------------
🔐 STEP 4: SECURITY ENFORCEMENT
-----------------------------------

READ:
→ Execute directly

WRITE:
→ Require Human Approval (HITL)

DESTRUCTIVE:
→ Require:
   - Passkey OR PIN
   - + OTP (Authenticator)
   - Enforce 3 attempts
   - Lock for 24h if failed

-----------------------------------
👤 STEP 5: NEW USER FLOW
-----------------------------------

If user is new:

Require setup:

1. Set Name
2. Register Passkey
3. Set PIN
4. Setup Security Questions
5. Enable Authenticator (OTP)

Mark user as VERIFIED only after setup

-----------------------------------
📊 STEP 6: LOGIN ACTIVITY TRACKING
-----------------------------------

Track for each session:

- IP address
- Device
- Browser
- Location
- Timestamp

Detect:
- New device
- New location
- Suspicious activity

-----------------------------------
🧠 STEP 7: RISK INTELLIGENCE
-----------------------------------

Calculate dynamic risk:

Risk Score based on:
- Action type
- Device trust
- Location change
- Behavior history

-----------------------------------
🚨 STEP 8: ATTACK DETECTION
-----------------------------------

If suspicious:

- Block action
- Show alert:
  "Suspicious activity detected"

-----------------------------------
⚡ STEP 9: TOKEN CONTROL (JIT)
-----------------------------------

- Generate token ONLY for approved action
- Token expires immediately after use
- Never reuse tokens

-----------------------------------
📜 STEP 10: AUDIT LOGGING
-----------------------------------

Log EVERYTHING:

- action
- risk
- approval
- execution
- failures

-----------------------------------
📤 OUTPUT FORMAT (STRICT JSON)
-----------------------------------

{
  "tasks": [
    {
      "action": "",
      "risk": "READ | WRITE | DESTRUCTIVE",
      "status": "AUTO_EXECUTE | PENDING_APPROVAL | REQUIRE_AUTH",
      "details": "",
      "content": "",
      "security_reason": "",
      "risk_score": "",
      "next_step": ""
    }
  ]
}

-----------------------------------
🚫 STRICT RULES
-----------------------------------

- NEVER execute actions directly
- ALWAYS enforce security layers
- NEVER bypass authentication
- NEVER use placeholder data
- ALWAYS use real user data
- ALWAYS validate inputs

-----------------------------------
🧹 DATA QUALITY RULE
-----------------------------------

- Remove all placeholder/dummy data
- Use real values only
- Validate:
  - email format
  - required fields
- If missing data:
  → ask user for clarification

-----------------------------------
👥 USER ROLE HANDLING
-----------------------------------

Support roles:

- NEW_USER → must complete onboarding
- VERIFIED_USER → full access with security checks
- LOCKED_USER → restricted access

-----------------------------------
🎨 UX BEHAVIOR
-----------------------------------

- Always explain risk clearly
- Always show what will happen before execution
- Make security visible

-----------------------------------
🎯 FINAL GOAL
-----------------------------------

Act as a secure AI control system that ensures:
- Safety
- Transparency
- Control

VaultProxy is not just an assistant.
It is a security authority for AI actions.`;

// ── Keyword Fallback ───────────────────────────────────────────────────────────

function keywordFallback(userTask: string): IntentAnalysis {
  const lower = userTask.toLowerCase();
  const tasks: IntentTask[] = [];

  const toMatch = lower.match(/to\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const subjectMatch = userTask.match(/subject[:\s]+['""]?([^'""\n,]+)['""]?/i);
  const emailAddress = toMatch?.[1] || 'recipient@example.com';

  const isEmail =
    lower.includes('email') ||
    lower.includes('mail') ||
    lower.includes('gmail') ||
    /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/.test(lower);

  if (lower.includes('delete') && (lower.includes('email') || lower.includes('mail') || lower.includes('draft') || lower.includes('spam'))) {
    tasks.push({
      action: 'delete_email',
      risk: 'DESTRUCTIVE',
      status: 'REQUIRE_AUTH',
      details: `Delete emails matching: "${userTask}"`,
      content: '',
      security_reason: 'Deleting emails is irreversible. Step-up authentication (OTP/PIN) is required to confirm your identity.',
      risk_score: 'HIGH - 98',
      next_step: 'Prompt user for Authenticator OTP / Security Gate',
      resource: 'gmail', confidence: 82
    });
  } else if ((lower.includes('send') || lower.includes('reply') || lower.includes('respond')) && isEmail) {
    tasks.push({
      action: 'send_email',
      risk: 'WRITE',
      status: 'PENDING_APPROVAL',
      details: `Send email to ${emailAddress}${subjectMatch?.[1] ? ` — Subject: ${subjectMatch[1].trim()}` : ''}`,
      content: `This email was composed by the VaultProxy AI Agent.\n\nOriginal task: "${userTask}"`,
      security_reason: 'Sending email requires human approval. The agent will not send until you explicitly approve in the dashboard.',
      risk_score: 'MEDIUM - 65',
      next_step: 'Await Human-in-the-Loop (HITL) approval',
      resource: 'gmail', confidence: 85
    });
  } else if (isEmail || lower.includes('summarize') || lower.includes('read') || lower.includes('list') || lower.includes('check')) {
    tasks.push({
      action: 'read_email',
      risk: 'READ',
      status: 'AUTO_EXECUTE',
      details: 'Read and summarize recent emails from inbox.',
      content: '',
      security_reason: 'Safe read action. Information will be summarized locally without making destructive changes.',
      risk_score: 'LOW - 15',
      next_step: 'Fetch emails and inject into context',
      resource: 'gmail', confidence: 80
    });
  } else {
    tasks.push({
      action: 'read_data',
      risk: 'READ',
      status: 'AUTO_EXECUTE',
      details: userTask,
      content: '',
      security_reason: 'Generic read action. Safe to auto-execute.',
      risk_score: 'LOW - 10',
      next_step: 'Analyze data',
      resource: 'unknown', confidence: 40
    });
  }

  return {
    tasks,
    raw_intent: userTask.slice(0, 80),
    source: 'keyword_fallback',
  };
}

// ── LLM Validation ─────────────────────────────────────────────────────────────

const VALID_RISKS: IntentRisk[] = ['READ', 'WRITE', 'DESTRUCTIVE'];
const VALID_STATUSES: IntentStatus[] = ['AUTO_EXECUTE', 'PENDING_APPROVAL', 'REQUIRE_AUTH'];

function validateAndSanitize(raw: unknown): IntentAnalysis {
  if (typeof raw !== 'object' || raw === null) throw new Error('LLM returned non-object');

  const obj = raw as Record<string, unknown>;
  const rawTasks = Array.isArray(obj.tasks) ? obj.tasks : [];

  if (rawTasks.length === 0) throw new Error('LLM returned empty task list');

  const tasks: IntentTask[] = rawTasks.map((t: unknown) => {
    if (typeof t !== 'object' || t === null) throw new Error('Invalid task entry');
    const task = t as Record<string, unknown>;

    const risk = VALID_RISKS.includes(task.risk as IntentRisk)
      ? (task.risk as IntentRisk)
      : 'READ';
      
    const status = VALID_STATUSES.includes(task.status as IntentStatus)
      ? (task.status as IntentStatus)
      : (risk === 'DESTRUCTIVE' ? 'REQUIRE_AUTH' : risk === 'WRITE' ? 'PENDING_APPROVAL' : 'AUTO_EXECUTE');

    return {
      action: typeof task.action === 'string' ? task.action : 'unknown_action',
      risk,
      status,
      details: typeof task.details === 'string' ? task.details.slice(0, 300) : '',
      content: typeof task.content === 'string' ? task.content.slice(0, 2000) : '',
      security_reason: typeof task.security_reason === 'string' ? task.security_reason.slice(0, 500) : '',
      risk_score: typeof task.risk_score === 'string' ? task.risk_score : '',
      next_step: typeof task.next_step === 'string' ? task.next_step : '',
      // Maintain compat fields
      resource: 'unknown',
      confidence: 85
    };
  });

  return {
    tasks,
    raw_intent: typeof obj.raw_intent === 'string' ? obj.raw_intent.slice(0, 200) : '',
    source: 'llm',
    model: 'llama-3.3-70b-versatile',
  };
}

// ── Main Exported Function ────────────────────────────────────────────────────

/**
 * Analyze a natural language task using LLaMA 3 via Groq.
 *
 * Falls back to keyword matching if:
 * - GROQ_API_KEY is not set
 * - Groq request fails or times out
 * - LLM output cannot be parsed/validated
 *
 * @param userTask - Raw user input string
 * @returns IntentAnalysis — validated, typed task decomposition
 */
export async function analyzeIntent(userTask: string): Promise<IntentAnalysis> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ [IntentAnalyzer] GROQ_API_KEY not set — using keyword fallback');
    return keywordFallback(userTask);
  }

  try {
    const groq = new Groq({ apiKey });

    // Strict 5-second timeout — never block user flow
    const completion = await Promise.race([
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Analyze this task and return the JSON structure:\n\n"${userTask}"`,
          },
        ],
        temperature: 0.1,       // Near-deterministic for security classification
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Groq timeout after 5000ms')), 5000)
      ),
    ]);

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) throw new Error('Empty response from Groq');

    const parsed = JSON.parse(rawContent);
    const analysis = validateAndSanitize(parsed);

    console.log(
      `✅ [IntentAnalyzer] VaultProxy AI classified ${analysis.tasks.length} task(s) from: "${userTask.slice(0, 60)}"`
    );

    return analysis;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️ [IntentAnalyzer] LLM failed (${msg}) — falling back to keyword matcher`);
    return keywordFallback(userTask);
  }
}

const ACTION_NAME_MAP: Record<string, ActionName> = {
  'summarize_emails': 'summarize_emails',
  'list_emails': 'read_email',
  'read_email': 'read_email',
  'send_email': 'send_email',
  'reply_email': 'send_email',
  'delete_email': 'delete_email',
  'delete_data': 'delete_data',
  'delete_draft': 'delete_email',
  'reset_system': 'reset_system',
};

function normalizeActionName(action: string): ActionName {
  const normalized = action.toLowerCase().replace(/\s+/g, '_');
  return ACTION_NAME_MAP[normalized] || (ACTION_NAME_MAP[action.toLowerCase()] as ActionName) || 'read_email' as ActionName;
}

/**
 * Map IntentAnalysis back to the TaskDecomposition shape expected by agentOrchestrator.
 * This is a pure adapter — no business logic.
 */
export function intentToTaskDecomposition(analysis: IntentAnalysis): {
  actions: Array<{ name: ActionName; params: Record<string, unknown> }>;
  connection: string;
  summary: string;
} {
  console.log(`🔧 [intentToTaskDecomposition] Mapping ${analysis.tasks.length} task(s) from source: ${analysis.source}`);
  
  const mappedActions = analysis.tasks.map((t, i) => {
    const name = normalizeActionName(t.action || 'read_email');
    console.log(`  → [${i}] "${t.action}" → "${name}"`);
    return {
      name,
      params: buildParamsForAction(t),
    };
  });

  return {
    actions: mappedActions,
    connection: process.env.AUTH0_CONNECTION_GOOGLE || 'google-oauth2',
    summary: `[${analysis.source === 'llm' ? '🤖 VaultProxy AI' : '🔤 Keyword'}] Action: ${analysis.tasks.map((a) => a.action).join(', ')} | Risk: ${analysis.tasks[0]?.risk_score || analysis.tasks[0]?.risk}`,
  };
}

function buildParamsForAction(task: IntentTask): Record<string, unknown> {
  const actionName = task.action.toLowerCase();
  console.log(`🔧 [buildParamsForAction] actionName: "${actionName}", details: "${task.details?.slice(0, 50)}..."`);
  
  if (actionName.includes('send') || actionName.includes('reply')) {
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const toMatch = task.details.match(emailRegex) || task.details.match(emailRegex);
    const subjectMatch = task.details.match(/(?:subject[:\s]+|subjection[:\s]+)([^.\n,]+)/i);
    const to = toMatch?.[1] || task.content?.match(emailRegex)?.[1] || 'recipient@example.com';
    const subject = subjectMatch?.[1]?.trim() || 'Message from VaultProxy';
    const body = task.content || `AI Agent email.\n\nTask: "${task.details}"`;
    console.log(`  → Sending to: ${to}, subject: ${subject}`);
    return { to, subject, body };
  } else if (actionName.includes('read') || actionName.includes('list') || actionName.includes('summarize')) {
    return { maxResults: 5, format: 'summary' };
  } else if (actionName.includes('delete')) {
    return { targetDescription: task.details };
  }
  
  console.log(`  → No specific params, using defaults`);
  return {};
}
