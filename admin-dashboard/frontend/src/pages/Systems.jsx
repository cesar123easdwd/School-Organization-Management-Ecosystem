import React, { useState, useEffect, useCallback } from 'react';
import systemService from '../services/systemService';
import toast from 'react-hot-toast';

/* ── Module metadata ──────────────────────────────────────────────── */
const MODULE_META = {
  'member-registration': { label: 'Member Registration', color: '#7f1416' },
  'events-management':   { label: 'Events Management',   color: '#06b6d4' },
  'attendance':          { label: 'Attendance',          color: '#22c55e' },
  'payments':            { label: 'Payments',            color: '#f59e0b' },
  'other':               { label: 'Other',               color: '#64748b' },
};

const getModuleMeta = (module) => MODULE_META[module] || { label: module || 'Unknown', color: '#64748b' };

const timeAgo = (dateStr) => {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

/* ── System SVG Icon ──────────────────────────────────────────────── */
const SystemIcon = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color || '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

/* ── Add System Modal ─────────────────────────────────────────────── */
const AddSystemModal = ({ onClose, onCreated }) => {
  const [form, setForm]     = useState({ name: '', description: '', module: 'other', baseUrl: '' });
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState(null);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('System name is required.'); return; }
    setSaving(true);
    try {
      const result = await systemService.createSystem(form);
      setNewKey(result.system.apiKey);
      toast.success(`"${result.system.name}" registered!`);
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register system.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={!newKey ? onClose : undefined}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{newKey ? 'Save Your API Key' : 'Register System'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {newKey ? (
          /* ── Show API key only once ─────────────────────── */
          <div className="modal-body">
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Copy this API key now — it will not be shown again.
              </div>
              <code style={{ fontSize: '12px', color: 'var(--text-secondary)', wordBreak: 'break-all', display: 'block', background: 'rgba(15,23,42,0.04)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                {newKey}
              </code>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Share this key with the teammate who owns this sub-system. They must send it as <code style={{ background: 'rgba(127,20,22,0.08)', color: '#7f1416', padding: '1px 5px', borderRadius: '4px', fontSize: '11px' }}>x-api-key</code> in their requests.
            </p>
          </div>
        ) : (
          /* ── Registration form ──────────────────────────── */
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label>System Name *</label>
                <input name="name" className="form-input" placeholder="Enter system name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input name="description" className="form-input" placeholder="Brief description of this integration" value={form.description} onChange={handleChange} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Module</label>
                  <select name="module" className="form-input" value={form.module} onChange={handleChange}>
                    <option value="member-registration">Member Registration</option>
                    <option value="events-management">Events Management</option>
                    <option value="attendance">Attendance</option>
                    <option value="payments">Payments</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Base URL</label>
                  <input name="baseUrl" className="form-input" placeholder="https://your-subsystem-url" value={form.baseUrl} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Registering…' : 'Register System'}
              </button>
            </div>
          </form>
        )}

        {newKey && (
          <div className="modal-footer">
            <button className="btn-primary" onClick={onClose}>Done — I've copied the key</button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Systems Page ─────────────────────────────────────────────────── */
const Systems = () => {
  const [systems,    setSystems]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [testing,    setTesting]    = useState(null);

  const fetchSystems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await systemService.getSystems();
      setSystems(data.systems || []);
    } catch (err) {
      toast.error('Failed to load systems.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSystems(); }, [fetchSystems]);

  const handleTestConnection = async (sys) => {
    setTesting(sys._id);
    try {
      await systemService.updateSystem(sys._id, { status: 'online' });
      toast.success(`${sys.name} — connection updated to online.`);
      fetchSystems();
    } catch {
      toast.error('Could not reach system.');
    } finally {
      setTesting(null);
    }
  };

  const onlineCount  = systems.filter(s => s.status === 'online').length;
  const offlineCount = systems.filter(s => s.status === 'offline').length;
  const errorCount   = systems.filter(s => s.status === 'error').length;

  return (
    <main className="page-body fade-in" id="systems-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Connected Systems</h1>
          <p className="page-desc">Manage and monitor all sub-system integrations</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-ghost"
            id="refresh-systems-btn"
            onClick={fetchSystems}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}>
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button
            className="btn-primary"
            id="add-system-btn"
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add System
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="mini-stats-row" style={{ marginBottom: '28px' }}>
        <div className="mini-stat-card" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
          <div className="mini-stat-value" style={{ color: '#22c55e' }}>{onlineCount}</div>
          <div className="mini-stat-label">Online</div>
        </div>
        <div className="mini-stat-card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <div className="mini-stat-value" style={{ color: '#ef4444' }}>{offlineCount}</div>
          <div className="mini-stat-label">Offline</div>
        </div>
        <div className="mini-stat-card" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
          <div className="mini-stat-value" style={{ color: '#f59e0b' }}>{errorCount}</div>
          <div className="mini-stat-label">Error</div>
        </div>
        <div className="mini-stat-card">
          <div className="mini-stat-value">{systems.length}</div>
          <div className="mini-stat-label">Total</div>
        </div>
      </div>

      {/* System Cards */}
      <div className="systems-detail-grid">
        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading systems…</p>
        ) : systems.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }}>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <p style={{ fontSize: '14px', fontWeight: 500 }}>No connected systems registered yet.</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Register the systems you want this dashboard to monitor.</p>
          </div>
        ) : systems.map((sys) => {
          const meta = getModuleMeta(sys.module);
          return (
            <div key={sys._id} id={`sys-${sys._id}`} className="system-detail-card fade-in-up">
              {/* Header */}
              <div className="sys-card-header">
                <div className="system-icon-wrap" style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}>
                  <SystemIcon color={meta.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="sys-card-name">{sys.name}</div>
                  <div className="sys-card-version">
                    <span style={{ background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}25`, borderRadius: '99px', padding: '1px 8px', fontSize: '10px', fontWeight: 600 }}>
                      {meta.label}
                    </span>
                  </div>
                </div>
                <div className={`status-badge ${sys.status}`}>
                  <span className="status-dot" />
                  {sys.status.charAt(0).toUpperCase() + sys.status.slice(1)}
                </div>
              </div>

              {/* Body */}
              <div className="sys-card-body">
                <p className="sys-card-desc">{sys.description || 'No description provided.'}</p>
                <div className="sys-endpoint">
                  <span className="sys-endpoint-label">Base URL</span>
                  <code className="sys-endpoint-url">{sys.baseUrl || '—'}</code>
                </div>
                <div className="sys-endpoint">
                  <span className="sys-endpoint-label">Last Seen</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    {timeAgo(sys.lastSeen)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="sys-card-footer">
                <button
                  className="btn-ghost"
                  id={`test-sys-${sys._id}-btn`}
                  onClick={() => handleTestConnection(sys)}
                  disabled={testing === sys._id}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {testing === sys._id ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                      </svg>
                      Testing…
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      Test Connection
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add System Modal */}
      {showModal && (
        <AddSystemModal
          onClose={() => setShowModal(false)}
          onCreated={fetchSystems}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
};

export default Systems;
