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
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg className="logo-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="sidebar-brand">ACC Dashboard</span>
          </div>
          <span className="sidebar-version">v2.0 (Next.js)</span>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: "dashboard", label: "Dashboard", icon: "Layout" },
            { id: "agent", label: "Run Agent", icon: "Play" },
            { id: "approvals", label: "Approvals", icon: "CheckSquare", badge: stats.waiting },
            { id: "tokens", label: "Token Vault", icon: "Shield" },
            { id: "logs", label: "Audit Logs", icon: "FileText" },
          ].map(t => (
            <button
              key={t.id}
              className={`nav-item ${currentTab === t.id ? "active" : ""}`}
              onClick={() => setCurrentTab(t.id)}
            >
              <span className="flex items-center gap-3">
                {t.label}
                {t.badge > 0 && <span className="nav-badge">{t.badge}</span>}
              </span>
            </button>
          ))}
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
          <a href="/auth/logout" className="btn btn-ghost btn-sm btn-full mt-2">Log out</a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Dashboard Tab */}
        {currentTab === "dashboard" && (
          <div className="tab-panel active">
            <header className="page-header">
              <div>
                <h1 className="page-title">Security Overview</h1>
                <p className="page-subtitle">Monitoring authorized agent activities and vaults</p>
              </div>
              <button onClick={() => initData()} className="btn btn-ghost btn-sm">Refresh All</button>
            </header>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon green">✓</div>
                <div>
                  <div className="stat-value">{stats.completed}</div>
                  <div className="stat-label">Tasks OK</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon red">✕</div>
                <div>
                  <div className="stat-value">{stats.denied}</div>
                  <div className="stat-label">Tasks Denied</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon amber">⏸</div>
                <div>
                  <div className="stat-value">{stats.waiting}</div>
                  <div className="stat-label">Pending Approval</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon violet">🔒</div>
                <div>
                  <div className="stat-value">{connections.filter(c => !c.isRevoked).length}</div>
                  <div className="stat-label">Active Vaults</div>
                </div>
              </div>
            </div>

            <div className="two-col">
              <section className="section-card">
                <div className="section-header">
                  <h2 className="section-title">Live Audit Feed</h2>
                </div>
                <div className="activity-feed">
                  {logs.slice(0, 10).map(log => (
                    <div key={log.id} className="feed-item">
                      <div className={`feed-item-icon ${log.decision === 'allow' ? 'allow' : 'deny'}`}>
                        {log.decision === 'allow' ? '✓' : '✕'}
                      </div>
                      <div className="feed-item-body">
                        <div className="feed-item-action">{log.action || 'Unknown'} <span className="badge badge-info">{log.decision}</span></div>
                        <div className="feed-item-detail">
                          {log.tokenFingerprint ? <code>{log.tokenFingerprint}</code> : 'None'} · {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="section-card">
                <div className="section-header">
                  <h2 className="section-title">Permission Guard</h2>
                </div>
                <div className="permission-table">
                  {rules.filter(r => r.action !== '*').map(r => (
                    <div key={r.action} className="permission-row border-b border-white/5 py-2">
                      <span className="mono">{r.action}</span>
                      <span className="badge badge-allow">{r.decision}</span>
                      <span className="text-muted text-xs">{r.riskLevel}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Run Agent Tab */}
        {currentTab === "agent" && (
          <div className="tab-panel active">
            <header className="page-header">
              <div>
                <h1 className="page-title">Agent Control</h1>
                <p className="page-subtitle">Assign a natural language task to the AI agent</p>
              </div>
            </header>

            <div className="two-col">
              <div className="section-card">
                <div className="form-group">
                  <label className="form-label">Task Description</label>
                  <textarea
                    rows="4"
                    className="form-textarea"
                    placeholder="e.g. Summarize my last 5 emails regarding project X..."
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                  />
                </div>
                <div className="quick-tasks mt-4">
                  <button onClick={() => setTask("Summarize my last 5 emails")} className="quick-btn">Summarize Emails</button>
                  <button onClick={() => setTask("Send email to test@example.com about the hackathon")} className="quick-btn">Send Email</button>
                  <button onClick={() => setTask("Delete my draft emails")} className="quick-btn text-red">Delete Drafts</button>
                </div>
                <button
                  onClick={handleRun}
                  disabled={running}
                  className="btn btn-primary btn-full mt-6"
                >
                  {running ? "Processing..." : "Execute Agent Task"}
                </button>
              </div>

              <div className="section-card">
                <h2 className="section-title mb-4">Live Execution Result</h2>
                <div id="run-result">
                  {currentRun ? (
                    <div className="run-result-content">
                      <div className="run-summary">{currentRun.result?.summary || currentRun.task}</div>
                      <div className="action-list mt-2">
                        {currentRun.actions?.map(a => (
                          <div key={a.id} className="action-item">
                            <span>{a.name}</span>
                            <span className={a.status === 'completed' ? 'text-green' : 'text-amber'}>{a.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="feed-empty">No active run</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {currentTab === "approvals" && (
          <div className="tab-panel active">
            <header className="page-header">
              <div>
                <h1 className="page-title">Approval Queue</h1>
                <p className="page-subtitle">Human-in-the-loop authorization for sensitive actions</p>
              </div>
            </header>
            <div id="pending-list">
              {pending.length > 0 ? pending.map(p => (
                <div key={p.id} className="approval-card">
                  <div className="approval-card-header">
                    <div>
                      <div className="approval-action">{p.actionName}</div>
                      <div className="approval-meta">Run ID: {p.runId.slice(0, 8)}...</div>
                    </div>
                  </div>
                  <pre className="approval-params">{JSON.stringify(p.actionData, null, 2)}</pre>
                  <div className="approval-controls gap-4 flex mt-4">
                    <button onClick={() => handleApprove(p.id)} className="btn btn-success">Approve</button>
                    <button onClick={() => handleDeny(p.id)} className="btn btn-danger">Deny</button>
                  </div>
                </div>
              )) : (
                <div className="section-card"><div className="feed-empty">No pending approvals</div></div>
              )}
            </div>
          </div>
        )}

        {/* Token Vault Tab */}
        {currentTab === "tokens" && (
          <div className="tab-panel active">
             <header className="page-header">
              <div>
                <h1 className="page-title">Token Vault Management</h1>
                <p className="page-subtitle">Manage external connections and revoke authorization</p>
              </div>
            </header>

            <div className="section-card">
              <h2 className="section-title mb-4">Connected Services</h2>
              {connections.map(c => (
                <div key={c.connection} className="connection-card mb-4">
                  <div>
                    <div className="connection-name">{c.connection}</div>
                    <div className="connection-meta">Status: {c.isRevoked ? 'Revoked' : 'Active'}</div>
                  </div>
                  {!c.isRevoked && (
                    <button
                      onClick={() => handleRevoke(c.connection)}
                      className="btn btn-danger btn-sm"
                      disabled={revoking}
                    >
                      {revoking ? "Revoking..." : "Revoke and Deauthorize"}
                    </button>
                  )}
                </div>
              ))}
              {revokeResult && (
                <div className="p-4 bg-black/40 border border-green/30 rounded-lg mt-4">
                  <div className="text-green font-bold">✓ Revoked Successfully</div>
                  <div className="text-xs text-muted mt-2">{revokeResult.securityNote}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {currentTab === "logs" && (
          <div className="tab-panel active">
             <header className="page-header">
              <div>
                <h1 className="page-title">Audit Trail</h1>
                <p className="page-subtitle">Immutable record of all agent activities</p>
              </div>
            </header>
            <div className="section-card overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-muted text-xs uppercase">
                  <tr>
                    <th className="pb-4">Timestamp</th>
                    <th className="pb-4">Action</th>
                    <th className="pb-4">Decision</th>
                    <th className="pb-4">Token</th>
                    <th className="pb-4">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {logs.map(log => (
                    <tr key={log.id} className="border-t border-white/5">
                      <td className="py-3 text-muted">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3 font-mono">{log.action}</td>
                      <td className="py-3"><span className={`badge ${log.decision === 'allow' ? 'badge-allow' : 'badge-deny'}`}>{log.decision}</span></td>
                      <td className="py-3 font-mono text-xs">{log.tokenFingerprint}</td>
                      <td className="py-3"><span className="badge badge-info">{log.status}</span></td>
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
