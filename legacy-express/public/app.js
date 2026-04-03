/* ============================================================
   Agent Control Center — Frontend Application Logic
   Pure vanilla JS — no framework dependencies
   ============================================================ */

'use strict';

// ── State ─────────────────────────────────────────────────────────────────────

const State = {
  user: null,
  currentTab: 'dashboard',
  currentRun: null,
  logs: [],
  logPage: 0,
  logTotal: 0,
  logLimit: 50,
  pendingCount: 0,
  feedItems: [],
};

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
});

async function checkAuth() {
  try {
    const res = await api('/auth/status');
    if (res.authenticated) {
      State.user = res.user;
      showApp();
      await initApp();
    } else {
      showLogin();
    }
  } catch {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app-screen').classList.add('hidden');
}

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');

  // Set user info in sidebar
  if (State.user) {
    document.getElementById('user-name').textContent = State.user.name || 'User';
    document.getElementById('user-email').textContent = State.user.email || '';
    if (State.user.picture) {
      const avatar = document.getElementById('user-avatar');
      avatar.innerHTML = `<img src="${escapeHtml(State.user.picture)}" alt="Avatar" />`;
    }
  }
}

async function initApp() {
  await Promise.allSettled([
    loadDashboard(),
    loadRuns(),
    loadPending(),
    loadLogs(),
    loadTokens(),
  ]);

  // Start live polling every 5 seconds
  setInterval(pollUpdates, 5000);
}

async function pollUpdates() {
  try {
    await Promise.allSettled([loadLogs(), loadPending(), updateStats()]);
  } catch { /* ignore polling errors */ }
}

// ── Tab Switching ─────────────────────────────────────────────────────────────

function switchTab(tab) {
  State.currentTab = tab;

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });

  document.querySelectorAll('.tab-panel').forEach(el => {
    el.classList.toggle('active', el.id === `tab-${tab}`);
  });

  // Refresh data on tab switch
  switch (tab) {
    case 'dashboard': loadDashboard(); break;
    case 'agent':     loadRuns();     break;
    case 'approvals': loadPending();  break;
    case 'tokens':    loadTokens();   break;
    case 'logs':      loadLogs();     break;
  }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

async function loadDashboard() {
  await Promise.allSettled([updateStats(), renderPermissionRules()]);
}

async function updateStats() {
  try {
    const [logsRes, pendingRes] = await Promise.allSettled([
      api('/logs?limit=500'),
      api('/agent/pending'),
    ]);

    if (logsRes.status === 'fulfilled') {
      const logs = logsRes.value.logs || [];
      const completed = logs.filter(l => l.status === 'success').length;
      const denied    = logs.filter(l => l.decision === 'deny' || l.status === 'denied').length;
      const pending   = logsRes.value.logs?.filter(l => l.status === 'pending').length || 0;

      document.getElementById('stat-completed').textContent = completed;
      document.getElementById('stat-denied').textContent = denied;
      document.getElementById('stat-pending').textContent =
        pendingRes.status === 'fulfilled' ? (pendingRes.value.pending?.length || 0) : '—';

      renderFeed(logs.slice(0, 30));
    }

    if (pendingRes.status === 'fulfilled') {
      const count = pendingRes.value.pending?.length || 0;
      State.pendingCount = count;
      const badge = document.getElementById('nav-approvals-count');
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (e) { /* ignore */ }
}

function renderFeed(logs) {
  const feed = document.getElementById('activity-feed');
  if (!logs || logs.length === 0) {
    feed.innerHTML = `
      <div class="feed-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        <p>No activity yet. Run an agent task to see live events.</p>
      </div>`;
    document.getElementById('feed-count').textContent = '0 events';
    return;
  }

  document.getElementById('feed-count').textContent = `${logs.length} events`;

  feed.innerHTML = logs.map(log => {
    const iconClass = log.decision === 'allow' ? 'allow'
      : log.decision === 'deny' ? 'deny'
      : log.decision === 'require_approval' ? 'pending'
      : log.decision === 'error' ? 'error'
      : 'info';

    const icon = iconClass === 'allow'   ? '✓'
               : iconClass === 'deny'    ? '✕'
               : iconClass === 'pending' ? '⏸'
               : iconClass === 'error'   ? '!'
               : '•';

    const time = formatTime(log.timestamp);
    const badge = decisionBadge(log.decision);
    const statusBadge = statusBadgeHtml(log.status);

    return `
      <div class="feed-item">
        <div class="feed-item-icon ${iconClass}">${icon}</div>
        <div class="feed-item-body">
          <div class="feed-item-action">${escapeHtml(log.action)} ${badge} ${statusBadge}</div>
          <div class="feed-item-detail">${log.tokenFingerprint ? `Token: <code class="mono">${escapeHtml(log.tokenFingerprint)}</code> · ` : ''}${log.scopes ? `Scope: <code class="mono">${escapeHtml(log.scopes.split('/').pop() || log.scopes)}</code>` : 'No token used'}</div>
        </div>
        <div class="feed-item-time">${time}</div>
      </div>`;
  }).join('');
}

async function renderPermissionRules() {
  try {
    const res = await api('/tokens');
    const rules = res.permissionRules || [];
    const rows = document.getElementById('permission-rows');

    rows.innerHTML = rules
      .filter(r => r.action !== '*')
      .map(r => `
        <div class="permission-row">
          <span class="action-name">${escapeHtml(r.action)}</span>
          <span>${decisionBadge(r.decision)}</span>
          <span>${riskBadge(r.riskLevel)}</span>
          <span class="text-muted" style="font-size:12px">${escapeHtml(r.reason.substring(0, 80))}${r.reason.length > 80 ? '…' : ''}</span>
        </div>`).join('');
  } catch { /* ignore */ }
}

// ── Agent Runner ──────────────────────────────────────────────────────────────

function setTask(task) {
  document.getElementById('task-input').value = task;
  if (State.currentTab !== 'agent') switchTab('agent');
}

async function runAgent() {
  const task = document.getElementById('task-input').value.trim();
  if (!task) { showToast('Enter a task description.', 'warn'); return; }

  const btn = document.getElementById('run-agent-btn');
  btn.disabled = true;
  btn.innerHTML = `<div class="spinner"></div> Running...`;

  const resultEl = document.getElementById('run-result');
  const badgeEl = document.getElementById('run-status-badge');

  resultEl.innerHTML = `<div class="run-empty"><div class="spinner"></div><p>Agent is processing your task...</p></div>`;
  badgeEl.style.display = 'none';

  try {
    const res = await api('/agent/run', 'POST', { task });
    State.currentRun = res.run;

    badgeEl.className = `badge badge-${res.run.status === 'completed' ? 'completed' : res.run.status === 'waiting_approval' ? 'waiting' : 'failed'}`;
    badgeEl.textContent = res.run.status.replace('_', ' ');
    badgeEl.style.display = 'inline-flex';

    renderRunResult(res.run);

    if (res.run.status === 'waiting_approval') {
      showToast('Action requires approval. Check the Approvals tab.', 'warn');
      await loadPending();
    } else if (res.run.status === 'completed') {
      showToast('Agent task completed successfully!', 'success');
    } else {
      showToast(`Task status: ${res.run.status}`, 'info');
    }

    await loadRuns();
    await updateStats();

  } catch (err) {
    resultEl.innerHTML = `<div class="run-result-content">
      <div class="badge badge-failed">Failed</div>
      <div class="run-summary text-red">${escapeHtml(err.message)}</div>
    </div>`;
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Run Agent`;
  }
}

function renderRunResult(run) {
  const el = document.getElementById('run-result');
  const actions = run.actions || [];

  const actionHtml = actions.map(a => {
    const statusColor = a.status === 'completed' ? 'text-green'
      : a.status === 'failed' || a.status === 'denied' ? 'text-red'
      : a.status === 'requires_approval' ? 'text-amber'
      : 'text-muted';

    const decision = a.permissionDecision ? decisionBadge(a.permissionDecision) : '';

    return `<div class="action-item">
      <span class="action-item-name">${escapeHtml(a.name)}</span>
      <span style="display:flex;align-items:center;gap:8px;">
        ${decision}
        <span class="${statusColor}" style="font-size:12px">${escapeHtml(a.status)}</span>
      </span>
    </div>`;
  }).join('');

  const resultData = run.result?.data;
  let dataHtml = '';
  if (resultData && Array.isArray(resultData) && resultData.length > 0) {
    const emails = resultData[0]?.result;
    if (Array.isArray(emails)) {
      dataHtml = `
        <div style="margin-top:12px">
          <div class="form-label" style="margin-bottom:8px">Retrieved Emails</div>
          ${emails.map(e => `
            <div style="padding:10px 12px;background:var(--bg-elevated);border-radius:6px;margin-bottom:6px;font-size:12px;">
              <div style="font-weight:600;margin-bottom:4px">${escapeHtml(e.subject || '(no subject)')}</div>
              <div class="text-muted">From: ${escapeHtml(e.from || '')} · ${escapeHtml(e.date || '')}</div>
              <div style="margin-top:4px;color:var(--text-secondary)">${escapeHtml(e.snippet?.substring(0, 120) || '')}${e.snippet?.length > 120 ? '…' : ''}</div>
            </div>`).join('')}
        </div>`;
    }
  }

  el.innerHTML = `
    <div class="run-result-content">
      <div class="run-meta">Run ID: <span class="mono">${escapeHtml(run.id.substring(0, 8))}...</span> · ${formatTime(run.createdAt)}</div>
      <div class="run-summary">${escapeHtml(run.result?.summary || run.task)}</div>
      <div class="action-list">${actionHtml || '<div class="text-muted" style="font-size:12px">No actions</div>'}</div>
      ${dataHtml}
    </div>`;
}

async function loadRuns() {
  try {
    const res = await api('/agent/runs');
    const runs = res.runs || [];
    const el = document.getElementById('runs-list');

    if (!runs.length) {
      el.innerHTML = `<div class="section-card"><div class="feed-empty"><p>No recent runs.</p></div></div>`;
      return;
    }

    el.innerHTML = `<div class="section-card">` + runs.map(r => `
      <div class="run-row" onclick="viewRun('${escapeHtml(r.id)}')">
        <span class="run-row-task">${escapeHtml(r.task)}</span>
        <div class="run-row-meta">
          <span class="badge badge-${r.status === 'completed' ? 'completed' : r.status === 'waiting_approval' ? 'waiting' : r.status === 'failed' ? 'failed' : 'pending'}">${r.status.replace('_', ' ')}</span>
          <span class="run-row-time">${formatTime(r.createdAt)}</span>
        </div>
      </div>`).join('') + `</div>`;
  } catch { /* ignore */ }
}

async function viewRun(id) {
  try {
    const res = await api(`/agent/status/${id}`);
    State.currentRun = res.run;
    switchTab('agent');

    const badgeEl = document.getElementById('run-status-badge');
    badgeEl.className = `badge badge-${res.run.status === 'completed' ? 'completed' : res.run.status === 'waiting_approval' ? 'waiting' : 'failed'}`;
    badgeEl.textContent = res.run.status.replace('_', ' ');
    badgeEl.style.display = 'inline-flex';

    renderRunResult(res.run);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Approvals ─────────────────────────────────────────────────────────────────

async function loadPending() {
  try {
    const res = await api('/agent/pending');
    const pending = res.pending || [];
    const el = document.getElementById('pending-list');

    const badge = document.getElementById('nav-approvals-count');
    if (pending.length > 0) {
      badge.textContent = pending.length;
      badge.style.display = 'inline';
    } else {
      badge.style.display = 'none';
    }

    if (!pending.length) {
      el.innerHTML = `
        <div class="section-card">
          <div class="feed-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <p>No actions awaiting approval. The queue is clear.</p>
          </div>
        </div>`;
      return;
    }

    el.innerHTML = pending.map(p => `
      <div class="approval-card" id="approval-${escapeHtml(p.id)}">
        <div class="approval-card-header">
          <div>
            <div class="approval-action">${escapeHtml(p.actionName)}</div>
            <div class="approval-meta">Run: <span class="mono">${escapeHtml(p.runId.substring(0, 8))}...</span> · Queued ${formatTime(p.createdAt)}</div>
          </div>
          ${decisionBadge('require_approval')}
        </div>
        <div class="approval-params">${escapeHtml(JSON.stringify(p.actionData, null, 2))}</div>
        <div class="approval-controls">
          <button class="btn btn-success" onclick="approveAction('${escapeHtml(p.id)}')" aria-label="Approve action">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Approve & Execute
          </button>
          <button class="btn btn-danger" onclick="denyAction('${escapeHtml(p.id)}')" aria-label="Deny action">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            Deny
          </button>
        </div>
      </div>`).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function approveAction(actionId) {
  const card = document.getElementById(`approval-${actionId}`);
  const btns = card.querySelectorAll('.btn');
  btns.forEach(b => { b.disabled = true; });
  btns[0].innerHTML = `<div class="spinner"></div> Executing...`;

  try {
    const res = await api('/agent/approve', 'POST', { actionId });
    showToast(`Action approved and executed! ${res.message || ''}`, 'success');
    await loadPending();
    await updateStats();
    await loadLogs();
  } catch (err) {
    showToast(`Approval failed: ${err.message}`, 'error');
    btns.forEach(b => { b.disabled = false; });
    btns[0].innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Approve & Execute`;
  }
}

async function denyAction(actionId) {
  try {
    await api('/agent/deny', 'POST', { actionId });
    showToast('Action denied.', 'info');
    await loadPending();
    await updateStats();
  } catch (err) {
    showToast(`Denial failed: ${err.message}`, 'error');
  }
}

// ── Token Vault ───────────────────────────────────────────────────────────────

async function loadTokens() {
  try {
    const res = await api('/tokens');
    const connections = res.connections || [];
    const el = document.getElementById('connections-list');

    const statusText = connections[0]?.isRevoked
      ? '<span class="text-red">Revoked</span>'
      : '<span class="text-green">Active</span>';

    document.getElementById('stat-vault').innerHTML =
      connections[0]?.isRevoked ? '<span style="color:var(--red)">Revoked</span>' : 'Active';

    el.innerHTML = `<div class="section-card">
      <div class="section-header">
        <h2 class="section-title">Connected Accounts</h2>
        <span class="section-count">${connections.length} connection(s)</span>
      </div>
      ${connections.map(c => `
        <div class="connection-card">
          <div class="connection-info">
            <div class="connection-name">${escapeHtml(c.connection)}</div>
            <div class="connection-meta">Grant ID: <span class="mono">${c.grantId ? escapeHtml(c.grantId.substring(0, 16) + '...') : 'N/A'}</span> · Status: ${c.isRevoked ? '<span class="text-red font-bold">REVOKED</span>' : '<span class="text-green">Active</span>'}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="badge ${c.isRevoked ? 'badge-failed' : 'badge-success'}">${c.isRevoked ? 'Revoked' : 'Connected'}</span>
            <svg width="28" height="28" viewBox="0 0 24 24" style="color:${c.isRevoked ? 'var(--red)' : 'var(--green)'};" fill="none" stroke="currentColor" stroke-width="2">${c.isRevoked ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' : '<circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"></polyline>'}</svg>
          </div>
        </div>`).join('')}
    </div>`;
  } catch { /* ignore */ }
}

async function revokeToken() {
  const connection = document.getElementById('revoke-connection-select').value;
  if (!confirm(`⚠️ Revoke connection "${connection}"?\n\nThis will delete the Auth0 grant. All subsequent agent calls will fail with 401. This cannot be undone without re-authorizing.`)) return;

  const btn = document.getElementById('revoke-btn');
  btn.disabled = true;
  btn.innerHTML = `<div class="spinner"></div> Revoking...`;

  const resultEl = document.getElementById('revoke-result');
  resultEl.classList.add('hidden');

  try {
    const res = await api('/tokens/revoke', 'POST', { connection });

    resultEl.classList.remove('hidden');
    resultEl.innerHTML = `
      <div class="revoke-result-box success">
        <div class="revoke-result-title text-green">✓ Connection Revoked</div>
        <div>${escapeHtml(res.message)}</div>
        <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">Revoked Grant IDs: <span class="mono">${(res.revokedGrantIds || []).join(', ') || 'none'}</span></div>
        <div style="margin-top:6px;font-size:12px;padding:8px;background:rgba(0,0,0,0.3);border-radius:6px">${escapeHtml(res.securityNote)}</div>
      </div>`;

    showToast('Connection revoked! Run the agent again to see it fail with 401.', 'warn');
    await loadTokens();
    await updateStats();
  } catch (err) {
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = `
      <div class="revoke-result-box error">
        <div class="revoke-result-title text-red">✕ Revocation Failed</div>
        <div>${escapeHtml(err.message)}</div>
      </div>`;
    showToast(`Revocation failed: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Revoke Connection`;
  }
}

// ── Audit Logs ────────────────────────────────────────────────────────────────

async function loadLogs() {
  try {
    const params = new URLSearchParams({
      limit: State.logLimit.toString(),
      offset: (State.logPage * State.logLimit).toString(),
    });

    const action   = document.getElementById('filter-action')?.value;
    const status   = document.getElementById('filter-status')?.value;
    const decision = document.getElementById('filter-decision')?.value;

    if (action)   params.append('action', action);
    if (status)   params.append('status', status);
    if (decision) params.append('decision', decision);

    const res = await api(`/logs?${params}`);
    State.logs    = res.logs || [];
    State.logTotal = res.pagination?.total || 0;

    renderLogs();
    renderPagination();
  } catch { /* ignore */ }
}

function renderLogs() {
  const el = document.getElementById('log-rows');

  if (!State.logs.length) {
    el.innerHTML = `<div class="feed-empty"><p>No logs match the current filters.</p></div>`;
    return;
  }

  el.innerHTML = State.logs.map(log => `
    <div class="log-row">
      <span class="log-time">${formatTimeFull(log.timestamp)}</span>
      <span class="log-action">${escapeHtml(log.action)}</span>
      <span>${decisionBadge(log.decision)}</span>
      <span>${statusBadgeHtml(log.status)}</span>
      <span class="log-token">${log.tokenFingerprint ? escapeHtml(log.tokenFingerprint) : '<span class="text-muted">—</span>'}</span>
      <span class="log-scope">${log.scopes ? escapeHtml(log.scopes.split('/').pop() || log.scopes) : '<span class="text-muted">—</span>'}</span>
    </div>`).join('');
}

function renderPagination() {
  const info = document.getElementById('log-page-info');
  const prev = document.getElementById('log-prev');
  const next = document.getElementById('log-next');

  const totalPages = Math.ceil(State.logTotal / State.logLimit) || 1;
  info.textContent = `Page ${State.logPage + 1} of ${totalPages} (${State.logTotal} total)`;
  prev.disabled = State.logPage === 0;
  next.disabled = (State.logPage + 1) * State.logLimit >= State.logTotal;
}

function changePage(direction) {
  State.logPage = Math.max(0, State.logPage + direction);
  loadLogs();
}

// ── Refresh All ───────────────────────────────────────────────────────────────

async function refreshAll() {
  await Promise.allSettled([loadDashboard(), loadRuns(), loadPending(), loadTokens(), loadLogs()]);
  showToast('Refreshed!', 'info');
}

// ── API Helper ────────────────────────────────────────────────────────────────

async function api(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(path, opts);

  if (res.status === 401) {
    // Session expired — redirect to login
    window.location.href = '/auth/login';
    throw new Error('Session expired');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP ${res.status}`);
  }

  return data;
}

// ── UI Helpers ────────────────────────────────────────────────────────────────

function decisionBadge(decision) {
  const map = {
    allow:                   ['badge-allow',    'Allow'],
    deny:                    ['badge-deny',     'Deny'],
    require_approval:        ['badge-approval', 'Approval Required'],
    require_step_up_auth:    ['badge-step-up',  'Step-Up Auth'],
    info:                    ['badge-info',     'Info'],
    error:                   ['badge-failed',   'Error'],
  };
  const [cls, label] = map[decision] || ['badge-info', decision];
  return `<span class="badge ${cls}">${label}</span>`;
}

function statusBadgeHtml(status) {
  const map = {
    success:  ['badge-success',  'Success'],
    failed:   ['badge-failed',   'Failed'],
    pending:  ['badge-pending',  'Pending'],
    revoked:  ['badge-revoked',  'Revoked'],
    approved: ['badge-success',  'Approved'],
    denied:   ['badge-deny',     'Denied'],
  };
  const [cls, label] = map[status] || ['badge-info', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function riskBadge(level) {
  const map = {
    low:      ['badge-success', 'Low'],
    medium:   ['badge-pending', 'Medium'],
    high:     ['badge-failed',  'High'],
    critical: ['badge-deny',    'Critical'],
  };
  const [cls, label] = map[level] || ['badge-info', level];
  return `<span class="badge ${cls}">${label}</span>`;
}

function formatTime(ts) {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ts; }
}

function formatTimeFull(ts) {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
           ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return ts; }
}

function escapeHtml(str) {
  if (typeof str !== 'string') str = String(str || '');
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Toast System ──────────────────────────────────────────────────────────────

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = {
    success: '✓', error: '✕', warn: '⚠', info: 'ℹ',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="font-size:16px;flex-shrink:0">${icons[type] || 'ℹ'}</span>
    <span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = '300ms ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
