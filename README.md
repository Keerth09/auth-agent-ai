<div align="center">
  <h1>🛡️ Agent Control Center (ACC)</h1>
  <p><b><i>The Zero-Trust Intelligence Layer for Autonomous AI Agents</i></b></p>
  <pre>
  ┌─────────────────────────────────────────────────────┐
  │  SECRETLESS  │  AUDITABLE  │  HUMAN-IN-THE-LOOP     │
  └─────────────────────────────────────────────────────┘
  </pre>
  
  [![Next.js 15](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
  [![Auth0 V4](https://img.shields.io/badge/Auth0-V4%20SDK-EB5424?style=for-the-badge&logo=auth0)](https://auth0.com)
  [![RFC 8693](https://img.shields.io/badge/Security-RFC%208693-blue?style=for-the-badge)](https://idp.rocks)
</div>

---

## 🌌 The Vision
Modern AI agents are often given **User Credentials** or long-lived **API Keys**. This is a security nightmare. **Agent Control Center (ACC)** completely reimagines agent identity. 

Instead of giving an agent a key to your house, ACC acts as a **Temporal Vault**. It exchanges your identity for a one-time, task-bound token that expires the moment the agent finishes its work.

## 🏗️ System Architecture

```mermaid
graph TD
    %% Personas
    User([👤 The User])
    Agent([🤖 AI Agent])
    
    %% Core Components
    subgraph "Agent Control Center (ACC Dashboard)"
        Orchestrator[Agent Orchestrator]
        PermEngine[Permission Engine]
        Audit[Audit Logger]
        DB[(Better-SQLite3 DB)]
    end
    
    %% Vault System
    subgraph "Security Layer"
        Vault[ACC Token Vault]
        Auth0[Auth0 Token Vault]
    end
    
    %% External Systems
    Connectors[System Connectors]
    Gmail[Gmail / Slack / GCP]

    %% Flow
    User -->|Assigns Task| Orchestrator
    Orchestrator -->|Decompose & Evaluate| PermEngine
    PermEngine -->|Risk Decision| Orchestrator
    
    %% The Secretless Loop
    Orchestrator -->|Request Short-lived Token| Vault
    Vault -->|RFC 8693 Exchange| Auth0
    Auth0 -->|Task-Bound Scoped Token| Vault
    Vault -->|Disposable Token| Orchestrator
    
    %% Execution
    Orchestrator -->|Execute Action| Connectors
    Connectors -->|API Call| Gmail
    
    %% Governance
    Orchestrator -->|Log Everything| Audit
    Audit -->|Write Trace| DB
    DB -->|Visual Audit Feed| User
    
    %% Human in the loop
    Orchestrator -- "Requires Approval" --> User
    User -- "Approve / Deny" --> Orchestrator

    %% Styling
    style User fill:#ebeeff,stroke:#5468ff,stroke-width:2px
    style Auth0 fill:#fff3eb,stroke:#eb5424,stroke-width:2px
    style Orchestrator fill:#f5faff,stroke:#0071e3,stroke-width:2px
    style DB fill:#f5f5f7,stroke:#1d1d1f,stroke-width:1px
```

## 🎭 The Security Personas
- **👤 The User**: Maintains full ownership of their credentials.
- **🤖 The Agent**: Operates in a "Secretless" environment, never seeing a refresh token.
- **🔑 The Vault**: The Auth0-powered gatekeeper that performs the cryptographic exchange (RFC 8693).

---

## 🛠️ System Flow (The Secretless Loop)

```text
 [1] REQUEST  ➔ User assigns task: "Summarize my last 5 emails."
 [2] EXCHANGE ➔ ACC sends User ID-Token to Auth0 Vault.
 [3] RESOLVE  ➔ Vault returns a 60-minute scoped Google token.
 [4] GUARD    ➔ Permission Engine checks: Does the agent have 'read' rights?
 [5] HITL     ➔ If 'delete' or 'send' is requested, the Dashboard pauses.
 [6] EXECUTE  ➔ Agent performs task and discards the token forever.
```

---

## 🏆 Why this project wins

### 1. Zero Persistence
We store **Zero** user access tokens. If the ACC database is breached, the attacker finds nothing but empty audit logs. All high-entropy tokens stay within Auth0's hardened infrastructure.

### 2. Temporal Identity
We implement **RFC 8693 (Token Exchange)**. This is the industry standard for secure service-to-service impersonation, rarely seen in hackathon projects.

### 3. Granular Governance
The **Permission Engine** is deny-by-default. 
- `read:email`? 🟢 Allowed.
- `send:email`? 🟡 Requires human approval.
- `delete:account`? 🔴 Permanently blocked.

---

## ⚙️ Setup & Deployment

### Environment
```ini
AUTH0_SECRET='...' # Openssl generated
AUTH0_DOMAIN='...' 
AUTH0_CLIENT_ID='...'
AUTH0_CLIENT_SECRET='...' # Vault-specific client secret
```

### Quickstart
```bash
npm install
npm run dev
```

---

## 📝 Audit & Compliance
ACC maintains a cryptographic audit log in **better-sqlite3**. Every action includes a **Token Fingerprint**, allowing you to trace exactly which Vault Exchange was used for which AI summary.

<div align="center">
  <br/>
  <b>Developed by R Sai Dheeraj & A Keerthana</b>
  <br/>
  <sub>Developed for the Auth0 AI Identity Hackathon 2026</sub>
</div>
