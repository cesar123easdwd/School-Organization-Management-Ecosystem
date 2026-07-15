import React, { useEffect, useState } from 'react';
import memberService from '../services/memberService';

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

  // Helper: resolve name and year regardless of which field set the sub-system used
  const resolveName = (m) =>
    m.fullName ||
    (m.firstName ? `${m.firstName}${m.middleName ? ` ${m.middleName}` : ''} ${m.lastName}`.trim() : '') ||
    m.memberName ||
    'Unknown';
  const resolveYear = (m) => m.year || m.yearLevel || '—';
  const resolveId   = (m) => m.studentId || m.memberId || m._id || '—';

  const filtered = members.filter((m) => {
    const name = resolveName(m).toLowerCase();
    const id   = resolveId(m).toString().toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
    const status = m.status || m.membershipStatus || 'Active';
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
              {s === 'All' ? members.length : members.filter(m => (m.status || 'Active') === s).length}
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
                const status = m.status || m.membershipStatus || 'Active';
                const s = STATUS_STYLE[status] || STATUS_STYLE.Active;
                return (
                  <tr key={m._id} className="table-row">
                    <td><code className="id-badge">{resolveId(m)}</code></td>
                    <td><span className="member-name">{resolveName(m)}</span></td>
                    <td>{m.course || '—'}</td>
                    <td>{resolveYear(m)}</td>
                    <td>
                      <span className="status-pill" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                        {status}
                      </span>
                    </td>
                    <td style={{ color: m.sanctions && m.sanctions !== '₱0' ? '#f59e0b' : 'var(--text-secondary)' }}>
                      {m.sanctions || '₱0'}
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

    </main>
  );
};

export default Members;
