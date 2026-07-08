import React, { useEffect, useState } from 'react';
import memberService from '../services/memberService';

const STATUS_STYLE = {
  Active:    { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  Inactive:  { bg: 'rgba(15,23,42,0.12)', color: '#6b7280', border: 'rgba(15,23,42,0.18)' },
  Probation: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
};

const STATUS_STYLE = {
  Active:    { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  Inactive:  { bg: 'rgba(15,23,42,0.12)', color: '#6b7280', border: 'rgba(15,23,42,0.18)' },
  Probation: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
};

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const result = await memberService.getMembers();
        setMembers(result.members || []);
      } catch (error) {
        console.error('[Members] failed to load members', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const filtered = members.filter((m) => {
    const name = (m.fullName || m.memberName || '').toLowerCase();
    const id = (m.memberId || m._id || '').toString().toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
    const status = m.status || 'Active';
    const matchFilter = filter === 'All' || status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <main className="page-body fade-in" id="members-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-desc">Manage all registered organization members</p>
        </div>
        <button className="btn-primary" id="add-member-btn" onClick={() => setShowModal(true)}>
          + Add Member
        </button>
      </div>

      {/* Summary Chips */}
      <div className="chip-row">
        {['All', 'Active', 'Inactive', 'Probation'].map((s) => (
          <button
            key={s}
            className={`chip${filter === s ? ' chip-active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s}
            <span className="chip-count">
              {s === 'All' ? SAMPLE_MEMBERS.length : SAMPLE_MEMBERS.filter(m => m.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Table Card */}
      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              id="members-search"
              className="search-input"
              type="text"
              placeholder="Search by name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-ghost" id="export-members-btn">⬇ Export</button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Full Name</th>
                <th>Course</th>
                <th>Year Level</th>
                <th>Status</th>
                <th>Sanctions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                  Loading members…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                  No members found
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                const status = m.status || 'Active';
                const s = STATUS_STYLE[status] || STATUS_STYLE.Active;
                return (
                  <tr key={m.memberId || m._id} className="table-row">
                    <td><code className="id-badge">{m.memberId || m._id || '—'}</code></td>
                    <td><span className="member-name">{m.fullName || m.memberName || 'Unknown'}</span></td>
                    <td>{m.course || '—'}</td>
                    <td>{m.year || '—'}</td>
                    <td>
                      <span className="status-pill" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                        {status}
                      </span>
                    </td>
                    <td style={{ color: m.sanctions && m.sanctions !== '₱0' ? '#f59e0b' : 'var(--text-secondary)' }}>
                      {m.sanctions || '₱0'}
                    </td>
                      <td>
                        <div className="action-btns">
                          <button className="action-btn view" title="View">👁</button>
                          <button className="action-btn edit" title="Edit">✏️</button>
                          <button className="action-btn delete" title="Remove">🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>{filtered.length} of {members.length} members</span>
        </div>
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Member</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-input" placeholder="e.g. Juan dela Cruz" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Course</label>
                  <select className="form-input">
                    <option>BSCS</option><option>BSIT</option><option>BSECE</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Year Level</label>
                  <select className="form-input">
                    <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" type="email" placeholder="student@school.edu.ph" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => setShowModal(false)}>Save Member</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Members;
