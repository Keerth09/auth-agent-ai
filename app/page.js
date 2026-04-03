"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [task, setTask] = useState("");
  const [currentRun, setCurrentRun] = useState(null);
  const [pending, setPending] = useState([]);
  const [logs, setLogs] = useState([]);
  const [connections, setConnections] = useState([]);
  const [rules, setRules] = useState([]);
  const [stats, setStats] = useState({ completed: 0, denied: 0, waiting: 0 });
  const [running, setRunning] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revokeResult, setRevokeResult] = useState(null);

  // ── Initialization ──────────────────────────────────────────────────────────

  useEffect(() => {
    checkAuth();
    const interval = setInterval(pollUpdates, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAuth() {
    try {
      const res = await api("/api/auth/status");
      if (res.authenticated) {
        setUser(res.user);
        initData();
      } else {
        window.location.href = "/auth/login";
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function initData() {
    await Promise.allSettled([
      fetchLogs(),
      fetchPending(),
      fetchRuns(),
      fetchTokens(),
    ]);
  }

  async function pollUpdates() {
    if (!user) return;
    await Promise.allSettled([fetchLogs(), fetchPending(), fetchRuns()]);
  }

  // ── API Helpers ─────────────────────────────────────────────────────────────

  async function api(path, method = "GET", body = null) {
    const opts = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(path, opts);
    if (res.status === 401) {
      let backendError = "Session expired";
      try {
        const errorData = await res.clone().json();
        if (errorData.error) backendError = errorData.error;
      } catch(e) {}
      
      // Only redirect if it's genuinely a missing session, otherwise just show error for Token Vault failures
      if (backendError === "Unauthorized") window.location.href = "/auth/login";
      throw new Error(`[401] ${backendError}`);
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || "Request failed");
    return data;
  }

  // ── Data Fetching ───────────────────────────────────────────────────────────

  async function fetchLogs() {
    try {
      const res = await api("/api/logs?limit=30");
      setLogs(res.logs || []);
      const completed = res.logs.filter(l => l.status === "success").length;
      const denied = res.logs.filter(l => l.decision === "deny" || l.status === "denied").length;
      setStats(prev => ({ ...prev, completed, denied }));
    } catch (err) { console.error(err); }
  }

  async function fetchPending() {
    try {
      const res = await api("/api/agent/pending");
      setPending(res.pending || []);
      setStats(prev => ({ ...prev, waiting: res.pending?.length || 0 }));
    } catch (err) { console.error(err); }
  }

  async function fetchRuns() {
    try {
      await api("/api/agent/runs");
    } catch (err) { console.error(err); }
  }

  async function fetchTokens() {
    try {
      const res = await api("/api/tokens");
      setConnections(res.connections || []);
      setRules(res.permissionRules || []);
    } catch (err) { console.error(err); }
  }

  // ── Actions ───────────────────────────────────────────────────────────────────

  async function handleRun() {
    if (!task.trim()) return showToast("Please enter a task", "warn");
    setRunning(true);
    setCurrentRun(null);
    try {
      const res = await api("/api/agent/run", "POST", { task });
      setCurrentRun(res.run);
      showToast("Agent task started!", "success");
      await initData();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setRunning(false);
    }
  }

  async function handleApprove(actionId) {
    try {
      await api("/api/agent/approve", "POST", { actionId });
      showToast("Action approved!", "success");
      await initData();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleDeny(actionId) {
    try {
      await api("/api/agent/deny", "POST", { actionId });
      showToast("Action denied", "info");
      await initData();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleRevoke(connection) {
    if (!confirm(`Revoke ${connection}? This is irreversible.`)) return;
    setRevoking(true);
    setRevokeResult(null);
    try {
      const res = await api("/api/tokens/revoke", "POST", { connection });
      setRevokeResult(res);
      showToast("Revocation successful!", "warn");
      await fetchTokens();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setRevoking(false);
    }
  }

  function showToast(msg, type) {
    console.log(`[Toast] ${type}: ${msg}`);
    // Basic toast logic for demo
    const container = document.getElementById("toast-container");
    if (container) {
      const toast = document.createElement("div");
      toast.className = `toast toast-${type}`;
      toast.innerText = msg;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    }
  }

  // ── Loading State ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="screen flex items-center justify-center bg-base">
        <div className="spinner-lg" />
      </div>
    );
  }

  return (
    <div className="screen" id="app-screen">
      {/* Sidebar - Elite Redesign */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg className="logo-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="sidebar-brand">ACC ELITE</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentTab('dashboard')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Overview
          </button>
          <button className={`nav-item ${currentTab === 'agent' ? 'active' : ''}`} onClick={() => setCurrentTab('agent')}>
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
             Execute Agent
          </button>
          <button className={`nav-item ${currentTab === 'approvals' ? 'active' : ''}`} onClick={() => setCurrentTab('approvals')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Approvals
            {stats.waiting > 0 && <span className="nav-badge">{stats.waiting}</span>}
          </button>
          <button className={`nav-item ${currentTab === 'tokens' ? 'active' : ''}`} onClick={() => setCurrentTab('tokens')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Token Vault
          </button>
          <button className={`nav-item ${currentTab === 'logs' ? 'active' : ''}`} onClick={() => setCurrentTab('logs')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Audit Trail
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {user?.picture ? <img src={user.picture} alt="" /> : user?.name?.charAt(0)}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <a href="/auth/logout" className="btn btn-ghost btn-full mt-4" style={{ textAlign: 'center', width: '100%', display: 'block', textDecoration: 'none' }}>Disconnect</a>
        </div>
      </aside>

      {/* Main Content - Modern Hierarchy */}
      <main className="main-content">
        {currentTab === "dashboard" && (
          <div className="tab-panel active">
            <header className="page-header">
              <div>
                <h1 className="page-title">Security Center</h1>
                <p className="page-subtitle">Zero-Trust Monitoring & Access Control</p>
              </div>
              <button onClick={() => initData()} className="btn btn-ghost">Refresh Status</button>
            </header>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value text-green" style={{ color: 'var(--success)' }}>{stats.completed}</div>
                <div className="stat-label">Verified Tasks</div>
              </div>
              <div className="stat-card">
                <div className="stat-value text-red" style={{ color: 'var(--danger)' }}>{stats.denied}</div>
                <div className="stat-label">Blocked Actions</div>
              </div>
              <div className="stat-card">
                <div className="stat-value text-amber" style={{ color: 'var(--warning)' }}>{stats.waiting}</div>
                <div className="stat-label">Pending Approval</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent-neon)' }}>{connections.filter(c => !c.isRevoked).length}</div>
                <div className="stat-label">Vault Connectors</div>
              </div>
            </div>

            <div className="two-col">
              <section className="section-card">
                <h2 className="section-title">Live Security Feed</h2>
                <div className="activity-feed">
                  {logs.length > 0 ? logs.slice(0, 10).map(log => (
                    <div key={log.id} className="feed-item">
                      <div className={`feed-item-icon ${log.decision === 'allow' ? 'allow' : 'deny'}`}>
                        {log.decision === 'allow' ? '✓' : '✕'}
                      </div>
                      <div className="feed-item-body">
                        <div className="feed-item-action">{log.action || 'Access'} <span className={`badge ${log.decision === 'allow' ? 'badge-allow' : 'badge-deny'}`}>{log.decision}</span></div>
                        <div className="feed-item-detail">
                          <span className="mono text-xs">{log.tokenFingerprint || 'Internal'}</span> · {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )) : <div className="feed-empty">No security events found.</div>}
                </div>
              </section>

              <section className="section-card">
                <h2 className="section-title">Active Guardrails</h2>
                <div className="permission-table">
                   {rules.filter(r => r.action !== '*').map(r => (
                    <div key={r.action} className="permission-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <span className="mono" style={{ fontSize: '13px' }}>{r.action}</span>
                      <span className={`badge ${r.decision === 'allow' ? 'badge-allow' : 'badge-deny'}`} style={{ color: r.decision === 'allow' ? 'var(--success)' : 'var(--warning)' }}>{r.decision}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {currentTab === "agent" && (
          <div className="tab-panel active">
            <header className="page-header">
              <div>
                <h1 className="page-title">Agent Execution</h1>
                <p className="page-subtitle">Execute tasks in the secretless vault environment</p>
              </div>
            </header>

            <div className="two-col">
              <div className="section-card">
                <label className="sidebar-brand" style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px', display: 'block' }}>NATURAL LANGUAGE COMMAND</label>
                <textarea
                  rows="5"
                  className="form-textarea"
                  placeholder="e.g. List my recent emails and summarize the top one..."
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                />
                <div className="quick-tasks mt-4" style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button onClick={() => setTask("Summarize my last 5 emails")} className="quick-btn">Summarize Emails</button>
                  <button onClick={() => setTask("Send email to test@example.com about meeting")} className="quick-btn">Send Email</button>
                </div>
                <button
                  onClick={handleRun}
                  disabled={running}
                  className="btn btn-primary mt-6"
                  style={{ width: '100%', marginTop: '24px' }}
                >
                  {running ? "Vault Exchange in Progress..." : "Trigger Secretless Loop"}
                </button>
              </div>

              <div className="section-card">
                <h2 className="section-title">Execution Result</h2>
                <div id="run-result">
                  {currentRun ? (
                    <div className="run-result-content">
                      <div className="run-summary" style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>{currentRun.result?.summary || currentRun.task}</div>
                      <div className="action-list mt-4">
                        {currentRun.actions?.map(a => (
                          <div key={a.id} className="action-item" style={{ padding: '12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                            <span className="mono">{a.name}</span>
                            <span className={`badge ${a.status === 'completed' ? 'badge-allow' : 'badge-info'}`}>{a.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="feed-empty">Waiting for command...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTab === "approvals" && (
           <div className="tab-panel active">
             <header className="page-header">
               <div>
                 <h1 className="page-title">Approval Queue</h1>
                 <p className="page-subtitle">Human-in-the-loop verification for sensitive actions</p>
               </div>
             </header>
             {pending.length > 0 ? pending.map(p => (
                <div key={p.id} className="approval-card">
                  <div className="approval-action">{p.actionName}</div>
                  <pre className="approval-params">{JSON.stringify(p.actionData, null, 2)}</pre>
                  <div className="approval-controls">
                    <button onClick={() => handleApprove(p.id)} className="btn btn-primary" style={{ background: 'var(--success)' }}>Authorize</button>
                    <button onClick={() => handleDeny(p.id)} className="btn btn-ghost" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>Block</button>
                  </div>
                </div>
              )) : <div className="section-card"><div className="feed-empty">Approval queue is empty.</div></div>}
           </div>
        )}

        {currentTab === "tokens" && (
           <div className="tab-panel active">
             <header className="page-header">
               <div>
                 <h1 className="page-title">Token Vault</h1>
                 <p className="page-subtitle">Manage external connections and RFC 8693 grants</p>
               </div>
             </header>
             <div className="section-card">
                {connections.map(c => (
                  <div key={c.connection} className="connection-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '24px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', marginBottom: '16px' }}>
                    <div>
                      <div className="connection-name">{c.connection}</div>
                      <div className="connection-meta">Vault Status: {c.isRevoked ? 'REVOKED' : 'SECURE'}</div>
                    </div>
                    {!c.isRevoked && (
                      <button onClick={() => handleRevoke(c.connection)} className="btn btn-ghost" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>Revoke Vault Access</button>
                    )}
                  </div>
                ))}
             </div>
           </div>
        )}

        {currentTab === "logs" && (
          <div className="tab-panel active">
             <header className="page-header">
              <div>
                <h1 className="page-title">Audit Trail</h1>
                <p className="page-subtitle">Cryptographical record of vault sessions</p>
              </div>
            </header>
            <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="w-full text-left" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <tr>
                    <th style={{ padding: '16px' }}>Session / Token Fingerprint</th>
                    <th style={{ padding: '16px' }}>Action</th>
                    <th style={{ padding: '16px' }}>Status</th>
                    <th style={{ padding: '16px' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px' }}><span className="mono text-xs">{log.tokenFingerprint || 'VAULT_INTERNAL'}</span></td>
                      <td style={{ padding: '16px' }}>{log.action}</td>
                      <td style={{ padding: '16px' }}><span className={`badge ${log.status === 'success' ? 'badge-allow' : 'badge-info'}`}>{log.status}</span></td>
                      <td style={{ padding: '16px' }} className="text-muted text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
