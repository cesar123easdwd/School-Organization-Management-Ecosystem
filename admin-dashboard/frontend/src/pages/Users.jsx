import React, { useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';

const roleColor = {
  superadmin: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  admin:      { color: '#7f1416', bg: 'rgba(127,20,22,0.12)',  border: 'rgba(127,20,22,0.3)'  },
  viewer:     { color: '#6b7280', bg: 'rgba(15,23,42,0.08)',   border: 'rgba(15,23,42,0.15)'  },
};

const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('');

/* ── Add User Modal ───────────────────────────────────────────────── */
const AddUserModal = ({ onClose, onCreated }) => {
  const [form, setForm]     = useState({ name: '', email: '', password: '', role: 'admin' });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('All fields are required.'); return; }
    setSaving(true);
    try {
      await authService.register(form.name, form.email, form.password, form.role);
      toast.success(`Admin "${form.name}" created.`);
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Admin User</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Full Name *</label>
              <input name="name" className="form-input" placeholder="Enter full name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input name="email" type="email" className="form-input" placeholder="Enter email address" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Password *</label>
                <input name="password" type="password" className="form-input" placeholder="Create a secure password" value={form.password} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" className="form-input" value={form.role} onChange={handleChange}>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Users Page ───────────────────────────────────────────────────── */
const Users = () => {
  const { user: currentUser } = useAuth();
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authService.getAllUsers();
      setUsers(data.users || []);
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDeactivate = async (user) => {
    if (!window.confirm(`Deactivate "${user.name}"? They will no longer be able to log in.`)) return;
    try {
      await authService.deactivateUser(user._id);
      toast.success(`"${user.name}" deactivated.`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate user.');
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = users.filter(u => u.isActive).length;

  return (
    <main className="page-body fade-in" id="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Users</h1>
          <p className="page-desc">Manage administrator accounts and access roles</p>
        </div>
        {currentUser?.role === 'superadmin' && (
          <button
            className="btn-primary"
            id="add-user-btn"
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Admin
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="mini-stats-row" style={{ marginBottom: '24px' }}>
        <div className="mini-stat-card" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
          <div className="mini-stat-value" style={{ color: '#22c55e' }}>{activeCount}</div>
          <div className="mini-stat-label">Active</div>
        </div>
        <div className="mini-stat-card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <div className="mini-stat-value" style={{ color: '#ef4444' }}>{users.length - activeCount}</div>
          <div className="mini-stat-label">Inactive</div>
        </div>
        <div className="mini-stat-card">
          <div className="mini-stat-value">{users.length}</div>
          <div className="mini-stat-label">Total Admins</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            All Admin Accounts
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="search-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                id="users-search"
                className="search-input"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              className="btn-ghost"
              onClick={fetchUsers}
              disabled={loading}
              aria-label="Refresh"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}>
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Joined</th>
                {currentUser?.role === 'superadmin' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No users found.</td></tr>
              ) : filtered.map(u => {
                const rc    = roleColor[u.role] || roleColor.viewer;
                const isSelf = u._id === currentUser?._id;
                return (
                  <tr key={u._id} className="table-row" id={`user-row-${u._id}`}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #7f1416, #5f1011)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                          {initials(u.name)}
                        </div>
                        <div className="member-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {u.name}
                          {isSelf && (
                            <span style={{ fontSize: '10px', background: 'rgba(127,20,22,0.1)', color: '#7f1416', padding: '1px 6px', borderRadius: '99px', fontWeight: 600 }}>
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{u.email}</td>
                    <td>
                      <span className="status-pill" style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
                        {u.role === 'superadmin' ? 'Super Admin' : u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span className="status-pill" style={u.isActive
                        ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
                        : { background: 'rgba(15,23,42,0.06)', color: '#6b7280', border: '1px solid rgba(15,23,42,0.12)' }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-PH') : '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-PH')}
                    </td>
                    {currentUser?.role === 'superadmin' && (
                      <td>
                        {!isSelf && u.isActive && (
                          <button
                            className="btn-deactivate"
                            id={`deactivate-user-${u._id}-btn`}
                            onClick={() => handleDeactivate(u)}
                            title="Deactivate this admin"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{filtered.length} of {users.length} records</span></div>
      </div>

      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onCreated={fetchUsers}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
};

export default Users;
