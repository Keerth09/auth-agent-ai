# Agent Control Center (ACC) — Next.js Edition
### Authorized AI Agents using Auth0 Token Vault & Official SDK

> This project has been migrated to **Next.js** using the official `@auth0/nextjs-auth0` SDK for production-grade server-side session management and the new Auth0 Proxy/Middleware pattern.

---

## Architecture (Next.js v16)

```
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Application                       │
│                                                             │
│  ┌──────────┐      ┌──────────────┐      ┌─────────────┐    │
│  │  App     │─────▶│  Proxy Layer │─────▶│   Auth0     │    │
│  │  Router  │      │  (proxy.js)  │      │   SDK       │    │
│  └──────────┘      └──────────────┘      └─────────────┘    │
│        │                                         │          │
│        ▼                                         ▼          │
│  ┌──────────┐      ┌──────────────┐      ┌─────────────┐    │
│  │  API     │─────▶│  Permission  │─────▶│ Token Vault │    │
│  │  Routes  │      │  Engine      │      │ (RFC 8693)  │    │
│  └──────────┘      └──────────────┘      └─────────────┘    │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               SQLite Persistent Audit Log             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env.local` file:

```env
APP_BASE_URL=http://localhost:3000
AUTH0_DOMAIN=dev-sgx1i7zrhkhn5j0t.us.auth0.com
AUTH0_CLIENT_ID=pOutPfG977WbXs53S0GetIg0WmbWO9Eq
AUTH0_CLIENT_SECRET=YOUR_AUTH0_CLIENT_SECRET
AUTH0_SECRET=e73b1c3e76b2756cbb9ac7318f6441ad5598d5ab311cd1d1acb5d10c3249a551
```

### 3. Run Development Server

```bash
npm run dev
```

Visit: **http://localhost:3000**

---

## Migrated Features from Express to Next.js

| Feature | Next.js Implementation | Key SDK API |
|---|---|---|
| **Auth Session** | Server-side HTTP-only cookies | `auth0.getSession()` |
| **Proxy Layer** | `proxy.js` (Next 16+) / `middleware.js` | `auth0.middleware(request)` |
| **Token Exchange** | RFC 8693 via Subject ID Token | `session.idToken` |
| **Agent API** | Route Handlers in `app/api/agent` | `NextResponse.json()` |
| **Persistence** | Shared SQLite (`lib/database.ts`) | `better-sqlite3` |
| **Frontend** | React Client Component Dashboard | `use client` |

---

## Demo Flow

1. **Login**: Click "Login" (redirects via `/auth/login`).
2. **Authorize**: Grant Gmail scopes to the AI Agent.
3. **Execute**: Run a task like "Summarize my emails".
4. **Approve**: For sensitive actions (Send Email), use the **Approvals** tab.
5. **Revoke**: Use the **Token Vault** tab to delete the Auth0 grant via Management API.
6. **Verify 401**: Re-run the agent after revocation to see the Token Vault fail securely.

---

## Security Guarantees

- **No Persisted Secrets**: Access tokens are fetched freshly per agent action and nunca stored.
- **Human-in-the-Loop**: High-risk actions (Send/Delete) require explicit human approval via the Permission Engine.
- **Audit Integrity**: Every decision is logged to an append-only SQLite database with token fingerprinting.
- **Strict Boundaries**: Deny-by-default logic for any action not explicitly allowed in `lib/permissions/permissionRules.ts`.
