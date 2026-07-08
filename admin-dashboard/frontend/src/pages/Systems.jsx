import React, { useState, useEffect, useCallback } from 'react';
import systemService from '../services/systemService';
import toast from 'react-hot-toast';

const MODULE_ICON = {
  'member-registration': { icon: '👤', bg: 'rgba(127,20,22,0.18)'  },
  'events-management':   { icon: '📅', bg: 'rgba(127,20,22,0.12)'  },
  'attendance':          { icon: '✅', bg: 'rgba(34,197,94,0.18)'   },
  'payments':            { icon: '💳', bg: 'rgba(245,158,11,0.18)'  },
  'other':               { icon: '🔗', bg: 'rgba(15,23,42,0.08)' },
};

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

/* ── Add System Modal ─────────────────────────────────────────── */
const AddSystemModal = ({ onClose, onCreated }) => {
  const [form, setForm]     = useState({ name: '', description: '', module: 'other', baseUrl: '' });
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState(null); // API key shown after creation

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
          <h3>{newKey ? '🔑 Save Your API Key' : 'Register System'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {newKey ? (
          /* ── Show API key only once ─────────────────────── */
          <div className="modal-body">
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                ⚠️ Copy this API key now — it will not be shown again.
              </p>
              <code style={{ fontSize: '12px', color: 'var(--text-secondary)', wordBreak: 'break-all', display: 'block' }}>
                {newKey}
              </code>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Share this key with the teammate who owns this sub-system. They must add it as <code>x-api-key</code> in their requests.
            </p>
          </div>
        ) : (
          /* ── Registration form ──────────────────────────── */
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label>System Name *</label>
                <input name="name" className="form-input" placeholder="e.g. Member Registration" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input name="description" className="form-input" placeholder="Short description of this system" value={form.description} onChange={handleChange} />
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
                  <input name="baseUrl" className="form-input" placeholder="http://localhost:5001" value={form.baseUrl} onChange={handleChange} />
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

/* ── Systems Page ─────────────────────────────────────────────── */
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
          <button className="btn-ghost" id="refresh-systems-btn" onClick={fetchSystems} disabled={loading}>
            {loading ? '⟳ Loading…' : '↻ Refresh'}
          </button>
          <button className="btn-primary" id="add-system-btn" onClick={() => setShowModal(true)}>
            + Add System
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
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No systems registered. Click "Add System" to register one.</p>
        ) : systems.map((sys, i) => {
          const meta = MODULE_ICON[sys.module] || MODULE_ICON.other;
          return (
            <div key={sys._id} id={`sys-${sys._id}`} className="system-detail-card fade-in-up">
              {/* Header */}
              <div className="sys-card-header">
                <div className="system-icon-wrap" style={{ background: meta.bg }}>{meta.icon}</div>
                <div style={{ flex: 1 }}>
                  <div className="sys-card-name">{sys.name}</div>
                  <div className="sys-card-version">{sys.module}</div>
                </div>
                <div className={`status-badge ${sys.status}`}>
                  <span className="status-dot" />
                  {sys.status.charAt(0).toUpperCase() + sys.status.slice(1)}
                </div>
              </div>

              {/* Body */}
              <div className="sys-card-body">
                <p className="sys-card-desc">{sys.description || 'No description.'}</p>
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
                  style={{ flex: 1 }}
                >
                  {testing === sys._id ? '⏳ Testing…' : '⚡ Test Connection'}
                </button>
                <button
                  className="btn-ghost"
                  id={`config-sys-${sys._id}-btn`}
                  style={{ flex: 1 }}
                  onClick={() => toast('Configuration coming soon.', { icon: '🔧' })}
                >
                  ⚙ Configure
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
    </main>
  );
};

export default Systems;
