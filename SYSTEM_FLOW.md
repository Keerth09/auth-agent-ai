# VaultProxy — Agent Control Center System Flow

## The Problem
Normally, AI agents hold credentials (like Google tokens) in their own memory forever. If the agent gets confused or compromised, it has permanent, unrestricted access to your data.

## The VaultProxy Solution
**"User tells the AI agent to do something. VaultProxy checks: is this allowed? If yes → fetch token from Auth0 Vault → do it → discard token. If risky → ask human first. If dangerous → verify identity first. Everything logged. Nothing stored. User always in control."**

Every request passes through an isolated process where credentials are held exclusively for one execution and strictly monitored by our comprehensive authorization pipeline.

---

## Complete Data Flow Diagram

```text
USER
 │
 │ types text ("Summarize my 5 latest emails")
 ▼
FRONTEND (Next.js)
 │
 │ POST /api/agent/run + HTTP-only JWT cookie
 ▼
MIDDLEWARE (middleware.ts)
 │ auth0.middleware() — verify logged-in session
 │ Rate limit checks (10 req/min/user)
 ▼
API ROUTE (app/api/agent/run/route.ts)
 │ Input Validation using Zod
 │ Contextual Intent Parsing
 ▼
PERMISSION ENGINE (lib/permissions/index.ts)
 │ classify risk: READ / WRITE / DESTRUCTIVE
 ▼
 ├── READ (Fast path) ──────────────────────┐
 │                                          │
 ▼                                          │
AUTH0 TOKEN VAULT (lib/tokenVault.ts)       │
 │ withTokenForConnection()                 │
 │ dynamically mint scoped, temporary token │
 ▼                                          │
GMAIL TOOL (lib/tools/gmail.ts)             │
 │ executes against external API            │
 │ token discarded instantly                │
 ▼                                          │
AUDIT LOGGER (lib/database.ts)              │
 │ logs: action, risk, fingerprint          │
 ▼                                          │
FRONTEND ←──────────────────────────────────┘
 shows final summary

 ├── WRITE (Human in loop) ─────────────────┐
 │   pause agent                            │
 │   log: pending_approval                  │
 │   notify user → approval queue           │
 │   user clicks Approve → executes task    │
 └──────────────────────────────────────────┘

 ├── DESTRUCTIVE (Hard check) ───────────────┐
 │   pause agent                             │
 │   trigger Auth0 step-up MFA challenge     │
 │   user verifies hardware key or face ID   │
 │   execute task securely                   │
 └───────────────────────────────────────────┘
```

---

## 🔒 10-Layer Security Pipeline

VaultProxy passes every single command through our rigorous 10-layer protection mechanism:

1. **HTTPS only**: All traffic encrypted transit.
2. **Auth0 Middleware**: Ensures guaranteed session validity before touching business logic.
3. **HTTP-only cookies**: Tokens cannot be scraped via XSS (No LocalStorage usage).
4. **Rate limiting**: Enforced rate limits preventing agent DDoS attacks.
5. **Input Validation (Zod)**: Strictly formats the agent task input.
6. **Permission Engine**: Action classification logic (Risk levels limit blast radius).
7. **Token Isolation (Vault)**: Tokens exist *only* via `withTokenForConnection`, never in agent memory.
8. **Granular Scopes**: Mints tokens to do precisely ONE thing.
9. **Immutable Audit Logging**: Every `task`, `risk` classification, and token `fingerprint` locked into local SQLite.
10. **Instant Revocation**: Complete user-controlled session revocation at any moment directly from the Identity Provider.
