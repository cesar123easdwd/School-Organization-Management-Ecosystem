import React, { useEffect, useState, useCallback } from 'react';
import memberService from '../services/memberService';

// Only Active and Inactive statuses are supported
const STATUS_STYLE = {
  Active:   { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  Inactive: { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', border: 'rgba(107,114,128,0.3)' },
};

// Auto-refresh interval in milliseconds (30 seconds)
const POLL_INTERVAL_MS = 30_000;

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [lastUpdated, setLastUpdated] = useState(null);

  // ── Fetch members ─────────────────────────────────────────────────
  const fetchMembers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await memberService.getMembers();
      setMembers(result.members || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('[Members] failed to load members', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchMembers(false);
  }, [fetchMembers]);

  // Auto-polling: silently refresh every 30 s so teammate status
  // changes appear without a manual page reload.
  useEffect(() => {
    const timer = setInterval(() => fetchMembers(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchMembers]);

  // ── Field resolvers ───────────────────────────────────────────────
  const resolveName = (m) =>
    m.fullName ||
    (m.firstName ? `${m.firstName}${m.middleName ? ` ${m.middleName}` : ''} ${m.lastName}`.trim() : '') ||
    m.memberName ||
    'Unknown';

  const resolveYear = (m) => m.year || m.yearLevel || '—';
  const resolveId   = (m) => m.studentId || m.memberId || m._id || '—';

  const resolveOrganization = (m) => {
    const candidate =
      m.organization ||
      m.organizationId ||
      m.organizationJoined ||
      m.organizationName ||
      m.orgName ||
      m.organizationInvolved ||
      m.involvedOrganization ||
      m.organizationLabel ||
      m.systemName;

    if (typeof candidate === 'string') return candidate.trim() || '—';

    if (candidate && typeof candidate === 'object') {
      return candidate.name || candidate.label || candidate.title || candidate.value || '—';
    }

    if (Array.isArray(candidate)) {
      const value = candidate
        .map((item) => (typeof item === 'string' ? item : item?.name || item?.label || item?.title || item?.value || ''))
        .filter(Boolean)
        .join(', ')
        .trim();
      return value || '—';
    }

    return '—';
  };

  // Normalize status — only Active / Inactive are valid; everything else
  // falls back to Active so the UI never shows unsupported badge text.
  const resolveStatus = (m) => {
    const raw = (m.status || m.membershipStatus || 'Active').toString().trim();
    const normalized = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    // If the normalized value is a recognised status, use it; otherwise Active
    return STATUS_STYLE[normalized] ? normalized : 'Active';
  };

  // ── Filtering ─────────────────────────────────────────────────────
  const filtered = members.filter((m) => {
    const name         = resolveName(m).toLowerCase();
    const id           = resolveId(m).toString().toLowerCase();
    const organization = resolveOrganization(m).toLowerCase();
    const matchSearch  = name.includes(search.toLowerCase()) || id.includes(search.toLowerCase()) || organization.includes(search.toLowerCase());
    const status       = resolveStatus(m);
    const matchFilter  = filter === 'All' || status === filter;
    return matchSearch && matchFilter;
  });

  // ── Render ────────────────────────────────────────────────────────
  return (
    <main className="page-body fade-in" id="members-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-desc">Manage all registered organization members</p>
        </div>
        {lastUpdated && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'flex-end' }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Summary Chips — only All, Active, Inactive */}
      <div className="chip-row">
        {['All', 'Active', 'Inactive'].map((s) => (
          <button
            key={s}
            className={`chip${filter === s ? ' chip-active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s}
            <span className="chip-count">
              {s === 'All'
                ? members.length
                : members.filter((m) => resolveStatus(m) === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Table Card */}
      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              id="members-search"
              className="search-input"
              type="text"
              placeholder="Search by name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Manual refresh button */}
          <button
            id="members-refresh-btn"
            title="Refresh members"
            onClick={() => fetchMembers(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Full Name</th>
                <th>Course</th>
                <th>Year Level</th>
                <th>Organization</th>
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
                  const status = resolveStatus(m);
                  const s = STATUS_STYLE[status] || STATUS_STYLE.Active;
                  return (
                    <tr key={m._id} className="table-row">
                      <td><code className="id-badge">{resolveId(m)}</code></td>
                      <td><span className="member-name">{resolveName(m)}</span></td>
                      <td>{m.course || '—'}</td>
                      <td>{resolveYear(m)}</td>
                      <td>{resolveOrganization(m)}</td>
                      <td>
                        <span
                          className="status-pill"
                          style={{
                            background: s.bg,
                            color: s.color,
                            border: `1px solid ${s.border}`,
                          }}
                        >
                          {status}
                        </span>
                      </td>
                      <td style={{ color: m.sanctionTotal > 0 ? '#f59e0b' : 'var(--text-secondary)' }}>
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
          <span>{filtered.length} of {members.length} member{members.length !== 1 ? 's' : ''}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Auto-refreshes every 30 s
          </span>
        </div>
      </div>
    </main>
  );
};

export default Members;
