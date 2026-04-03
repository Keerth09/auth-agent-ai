# Agent Control Center (ACC)
### Authorized AI Agents using Auth0 Token Vault

> A production-grade system where every AI agent action is permission-checked, token-vaulted, and fully audited — built for the Auth0 for AI Agents hackathon.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       ACC Backend (Node.js + TypeScript)         │
│                                                                   │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │  Express │───▶│  Permission  │───▶│   Agent Orchestrator │   │
│  │   API    │    │   Engine     │    │  (task decomposition) │   │
│  └──────────┘    └──────────────┘    └──────────────────────┘   │
│       │                                         │                │
│       ▼                                         ▼                │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │  Auth0   │    │  Token Vault │    │   Gmail Connector    │   │
│  │  OIDC    │    │  (RFC 8693)  │    │  (read / send email) │   │
│  └──────────┘    └──────────────┘    └──────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │             SQLite Audit Log (append-only)                │   │
│  │   user_id · action · token_fingerprint · scopes ·        │   │
│  │   decision · status · timestamp                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Permission Decision Flow

```
Agent action → Permission Engine → allow?          → Execute (Token Vault)
                                 → require_approval? → Queue (human reviews)
                                 → require_step_up?  → Block (Auth0 re-auth URL)
                                 → deny?             → Reject (logged)
```

---

## Quick Start

### 1. Clone & Install

```bash
cd /path/to/VaultProxy
npm install
```

### 2. Configure Auth0

You need:
- **Regular Web App** — for user login (OIDC)
- **Machine-to-Machine App** — for Management API (grant revocation)
- **Google Social Connection** — with Token Vault enabled

#### Step-by-step Auth0 Setup

1. **Create Regular Web Application**
   - Auth0 Dashboard → Applications → Create Application → Regular Web App
   - Settings → Allowed Callback URLs: `http://localhost:3000/auth/callback`
   - Settings → Allowed Logout URLs: `http://localhost:3000`
   - Settings → Allowed Web Origins: `http://localhost:3000`
   - Copy `Client ID` and `Client Secret`

2. **Enable Google Social Connection with Token Vault**
   - Auth0 Dashboard → Authentication → Social → Google → Enable
   - Add your Google OAuth app credentials (Google Cloud Console → OAuth 2.0)
   - Required scopes: `email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send`
   - **CRITICAL**: Enable "Store Refresh Token" toggle (this is the Token Vault configuration)
   - Enable the connection for your Regular Web App

3. **Create Machine-to-Machine Application**
   - Auth0 Dashboard → Applications → Create Application → Machine to Machine
   - Authorize for: Auth0 Management API
   - Required scopes: `read:grants` `delete:grants` `read:users`
   - Copy `Client ID` and `Client Secret`

4. **Set Token Exchange Grant**
   - Your Regular Web App needs the `urn:ietf:params:oauth:grant-type:token-exchange` grant
   - Auth0 Dashboard → Applications → [Your App] → APIs → click the gear ⚙️ next to desired audience → enable "Allow Skipping User Consent"

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development
SESSION_SECRET=<openssl rand -hex 32>

AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=<regular-web-app-client-id>
AUTH0_CLIENT_SECRET=<regular-web-app-client-secret>
AUTH0_CALLBACK_URL=http://localhost:3000/auth/callback
AUTH0_BASE_URL=http://localhost:3000
AUTH0_SCOPE=openid profile email offline_access

AUTH0_M2M_CLIENT_ID=<m2m-app-client-id>
AUTH0_M2M_CLIENT_SECRET=<m2m-app-client-secret>
AUTH0_M2M_AUDIENCE=https://your-tenant.auth0.com/api/v2/

AUTH0_CONNECTION_GOOGLE=google-oauth2
DB_PATH=./data/acc.db
```

### 4. Run the Server

```bash
npm run dev
```

Visit: **http://localhost:3000**

---

## Demo Walkthrough (Strict 8-Step Demo)

| Step | Action | Expected |
|------|--------|----------|
| 1 | `GET /auth/login` | Redirects to Auth0 Universal Login |
| 2 | Login with Google | Gmail OAuth scopes granted, Token Vault stores refresh token |
| 3 | POST `/agent/run` `{"task":"summarize my last 5 emails"}` | Reads emails — permission: **allow** → `success` |
| 4 | `GET /logs` | Shows token fingerprint, `gmail.readonly` scope, `allow` decision |
| 5 | POST `/agent/run` `{"task":"send email to test@example.com"}` | Permission: **require_approval** → `202 waiting_approval` |
| 6 | POST `/agent/approve` `{"actionId":"<id>"}` | Email sent — logged as `human_approved: true` |
| 7 | POST `/tokens/revoke` `{"connection":"google-oauth2"}` | Auth0 grant deleted via Management API |
| 8 | POST `/agent/run` `{"task":"summarize emails"}` | Token Vault returns 401 — logged as `token_revoked: failed` |

---

## API Reference

### Auth
```bash
# Login (browser redirect)
GET http://localhost:3000/auth/login

# Current user
GET http://localhost:3000/auth/me

# Auth status (no session required)
GET http://localhost:3000/auth/status
```

### Agent
```bash
# Run a task
curl -X POST http://localhost:3000/agent/run \
  -H "Content-Type: application/json" \
  -b "cookies-from-browser" \
  -d '{"task": "Summarize my last 5 emails"}'

# Check status
curl http://localhost:3000/agent/status/<run-id>

# List pending approvals
curl http://localhost:3000/agent/pending

# Approve action
curl -X POST http://localhost:3000/agent/approve \
  -H "Content-Type: application/json" \
  -d '{"actionId": "<pending-action-id>"}'

# Deny action
curl -X POST http://localhost:3000/agent/deny \
  -H "Content-Type: application/json" \
  -d '{"actionId": "<pending-action-id>"}'
```

### Logs
```bash
# All audit logs
curl http://localhost:3000/logs

# Filter by action
curl "http://localhost:3000/logs?action=send_email"

# Filter by status
curl "http://localhost:3000/logs?status=failed"

# Filter by decision
curl "http://localhost:3000/logs?decision=require_approval"
```

### Tokens
```bash
# List connections
curl http://localhost:3000/tokens

# Revoke a connection
curl -X POST http://localhost:3000/tokens/revoke \
  -H "Content-Type: application/json" \
  -d '{"connection": "google-oauth2"}'
```

---

## Permission Rules

| Action | Decision | Risk | Reason |
|--------|----------|------|--------|
| `read_email` | ✅ Allow | Low | Read-only, safe |
| `list_emails` | ✅ Allow | Low | Read-only, safe |
| `send_email` | ⏸ Require Approval | Medium | Human must approve outbound |
| `reply_email` | ⏸ Require Approval | Medium | Human must approve outbound |
| `delete_email` | 🔐 Step-Up Auth | High | Irreversible action |
| `delete_data` | 🔐 Step-Up Auth | Critical | Irreversible action |
| `revoke_token` | 🔐 Step-Up Auth | High | Affects all agent operations |
| `exfiltrate_data` | ❌ Deny | Critical | Explicitly prohibited |
| `*` (unknown) | ❌ Deny | High | Deny by default |

---

## Security Architecture

### Token Vault — How It Works
1. User logs in via Auth0 + Google OAuth
2. Auth0 stores the Google refresh token in Token Vault (never touches our app)
3. When agent needs Gmail access:
   ```
   Our backend → Token Exchange (RFC 8693) → Auth0 → Short-lived Gmail token
   ```
4. Agent uses token to call Gmail API
5. Token expires naturally — no long-lived secrets anywhere

### Revocation Mechanism
- **Standard**: `DELETE /api/v2/grants/{id}` via Auth0 Management API
- **Effect**: New Token Vault requests fail immediately with 401
- **Note**: Already-issued tokens remain valid until natural expiry (~1hr)
- **Local cache**: Revocation is recorded in SQLite for fast-fail without Management API round-trip

### Audit Trail Guarantees
- Every action logged **before and after** execution
- Permission decisions logged with rule ID and reason
- Token fingerprints logged (first 8 + last 4 chars) — never full tokens
- Logs are append-only (no UPDATE/DELETE on audit_logs table)

---

## Project Structure

```
VaultProxy/
├── src/
│   ├── auth/
│   │   ├── auth0Client.ts        # Auth0 OIDC session management
│   │   ├── tokenVault.ts         # Token Exchange (RFC 8693) + revocation
│   │   └── managementClient.ts   # Auth0 Management API (grant CRUD)
│   ├── agents/
│   │   ├── agentTask.types.ts    # Core domain types
│   │   ├── agentRunner.ts        # State machine + SQLite repository
│   │   └── agentOrchestrator.ts  # Main orchestration engine
│   ├── permissions/
│   │   ├── permissionRules.ts    # Static rule definitions
│   │   └── permissionEngine.ts   # Rule evaluation engine
│   ├── connectors/
│   │   └── gmailConnector.ts     # Gmail API connector
│   ├── logs/
│   │   ├── auditLog.types.ts     # Type definitions
│   │   └── auditLogger.ts        # Append-only audit log service
│   ├── api/
│   │   ├── authRoutes.ts         # /auth/*
│   │   ├── agentRoutes.ts        # /agent/*
│   │   ├── logRoutes.ts          # /logs
│   │   └── tokenRoutes.ts        # /tokens/*
│   ├── core/
│   │   ├── database.ts           # SQLite initialization + schema
│   │   ├── errors.ts             # Custom error hierarchy
│   │   └── middleware.ts         # Security headers, CORS, error handler
│   └── index.ts                  # Express bootstrap
├── public/
│   ├── index.html                # Premium dark-mode SPA
│   ├── styles.css                # Dark theme CSS (glassmorphism)
│   └── app.js                    # Vanilla JS frontend logic
├── data/                         # SQLite database file (gitignored)
├── .env.example                  # Environment variable template
├── package.json
├── tsconfig.json
└── README.md
```

---

## Scripts

```bash
npm run dev       # Start dev server with hot reload
npm run build     # Compile TypeScript to /dist
npm run start     # Run compiled /dist
npm run typecheck # Type check without emit
```
