import React, { useEffect, useState, useCallback } from 'react';
import attendanceService from '../services/attendanceService';
import memberService from '../services/memberService';

// Only Present and Absent — Late is not part of this system
const ATT_STYLE = {
  Present: { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', border: 'rgba(34,197,94,0.3)'  },
  Absent:  { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', border: 'rgba(239,68,68,0.3)'  },
};

const POLL_INTERVAL_MS = 30_000;

const normKey = (v) => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');

/* Resolve organization from a member document, trying all known field variants */
const resolveMemberOrg = (m) => {
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

  if (typeof candidate === 'string') return candidate.trim();
  if (candidate && typeof candidate === 'object') {
    return (candidate.name || candidate.label || candidate.title || candidate.value || '').toString().trim();
  }
  if (Array.isArray(candidate)) {
    return candidate
      .map((item) => (typeof item === 'string' ? item : item?.name || item?.label || item?.title || item?.value || ''))
      .filter(Boolean)
      .join(', ')
      .trim();
  }
  return '';
};

/* Normalize status — only Present | Absent */
const normalizeStatus = (raw) => {
  if (!raw) return 'Absent';
  const s = String(raw).trim().toLowerCase();
  return s === 'present' ? 'Present' : 'Absent';
};

const Attendance = () => {
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('All');
  const [organization, setOrg]      = useState('All');
  const [orgOptions, setOrgOptions] = useState(['All']);
  const [lastUpdated, setLastUpdated] = useState(null);

  const formatDate = (r) => {
    // Backend now always resolves `date` — from checkIn, explicit date, or _id timestamp
    const v = r?.date || r?.checkIn || r?.createdAt;
    return v ? new Date(v).toLocaleDateString('en-PH') : '—';
  };

  const formatTime = (r) => {
    // timeIn is null for Absent records (no check-in) — intentionally shows '—'
    const v = r?.timeIn || r?.checkIn;
    if (!v) return '—';
    try {
      return new Date(v).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    } catch { return '—'; }
  };

  // ── Fetch and enrich records ──────────────────────────────────────
  const fetchAttendance = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Backend already enriches with org + eventTitle + normalized status.
      // We ALSO fetch members client-side as a fallback for old records that
      // were stored before the backend enrichment was added.
      const [attResult, membersResult] = await Promise.all([
        attendanceService.getAttendance(),
        memberService.getMembers(),
      ]);

      // Build org lookup map from members (fallback)
      const orgMap = new Map();
      (membersResult.members || []).forEach((m) => {
        const org = resolveMemberOrg(m);
        if (!org) return;
        [m.memberId, m.studentId, m.fullName, m.memberName,
          m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : '']
          .map(normKey)
          .filter(Boolean)
          .forEach((key) => orgMap.set(key, org));
      });

      const enriched = (attResult.attendance || []).map((r) => {
        // Organization: backend resolves first; fallback uses studentId (teammate) + memberId (ours)
        const resolvedOrg =
          (r.organization && r.organization !== '—' && r.organization.trim()) ||
          orgMap.get(normKey(r.studentId)) ||
          orgMap.get(normKey(r.memberId)) ||
          orgMap.get(normKey(r.memberName)) ||
          '';

        // Status: normalize
        const resolvedStatus = normalizeStatus(r.status);

        // Event title: the backend has already resolved the ObjectId → real title.
        // Trust what the backend sends; only fall back if it's empty/missing.
        const resolvedEvent =
          (r.eventTitle && r.eventTitle.trim() && r.eventTitle !== '—') ? r.eventTitle : '—';

        return {
          ...r,
          organization: resolvedOrg || '—',
          status:       resolvedStatus,
          eventTitle:   resolvedEvent,
        };
      });

      setRecords(enriched);
      setLastUpdated(new Date());

      // Build dynamic org dropdown from actual data
      const orgs = ['All', ...new Set(
        enriched
          .map((r) => r.organization)
          .filter((o) => o && o !== '—')
          .sort()
      )];
      setOrgOptions(orgs);
    } catch (error) {
      console.error('[Attendance] failed to load records', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchAttendance(false); }, [fetchAttendance]);

  // Auto-poll every 30 s so teammate updates appear without manual refresh
  useEffect(() => {
    const timer = setInterval(() => fetchAttendance(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchAttendance]);

  // ── Filtering ─────────────────────────────────────────────────────
  const visible = records.filter((r) => {
    const memberStr = (r.memberName || r.member || '').toLowerCase();
    const eventStr  = (r.eventTitle || r.event || '').toLowerCase();
    const matchSearch = memberStr.includes(search.toLowerCase()) || eventStr.includes(search.toLowerCase());
    const matchFilter = filter === 'All' || r.status === filter;
    const matchOrg    = organization === 'All' || normKey(r.organization) === normKey(organization);
    return matchSearch && matchFilter && matchOrg;
  });

  // ── Stats (only Present and Absent) ──────────────────────────────
  const total   = visible.length;
  const present = visible.filter((r) => r.status === 'Present').length;
  const absent  = visible.filter((r) => r.status === 'Absent').length;
  const rate    = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <main className="page-body fade-in" id="attendance-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-desc">View attendance records synchronized from connected systems</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            id="attendance-refresh-btn"
            title="Refresh attendance"
            onClick={() => fetchAttendance(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-secondary)', fontSize: '0.8rem',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
          <div className="status-pill" style={{ background: 'rgba(6,182,212,0.1)', color: '#0891b2', border: '1px solid rgba(6,182,212,0.25)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            Synced from connected systems
          </div>
        </div>
      </div>

      {/* Rate Card + Stats */}
      <div className="attendance-overview">
        <div className="rate-card">
          <div className="rate-circle">
            <svg viewBox="0 0 80 80" className="rate-svg">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="8"/>
              <circle
                cx="40" cy="40" r="34" fill="none" stroke="url(#grad)" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 34 * rate / 100} ${2 * Math.PI * 34}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7f1416"/>
                  <stop offset="100%" stopColor="#22c55e"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="rate-number">{rate}%</span>
          </div>
          <div className="rate-label">Attendance Rate</div>
        </div>

        <div className="att-stats">
          {[
            { label: 'Present', val: present, color: '#22c55e' },
            { label: 'Absent',  val: absent,  color: '#ef4444' },
            { label: 'Total',   val: total,   color: '#7f1416' },
          ].map((item) => (
            <div key={item.label} className="mini-stat-card">
              <div className="mini-stat-value" style={{ color: item.color }}>{item.val}</div>
              <div className="mini-stat-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-toolbar">
          {/* Status filter chips — only All, Present, Absent */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['All', 'Present', 'Absent'].map((s) => (
              <button
                key={s}
                className={`chip${filter === s ? ' chip-active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <label className="search-box" style={{ minWidth: '220px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                id="attendance-search"
                className="search-input"
                placeholder="Search member or event…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            {/* Organization filter — dynamically built from actual data */}
            <label className="search-box" style={{ minWidth: '200px' }}>
              <select
                id="attendance-org-filter"
                className="search-input"
                value={organization}
                onChange={(e) => setOrg(e.target.value)}
                aria-label="Filter attendance by organization"
              >
                {orgOptions.map((org) => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Member</th>
                <th>Event</th>
                <th>Date</th>
                <th>Time In</th>
                <th>Organization</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading attendance…
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No attendance records found
                  </td>
                </tr>
              ) : (
                visible.map((r) => {
                  const st = r.status || 'Absent';
                  const s  = ATT_STYLE[st] || ATT_STYLE.Absent;
                  return (
                    <tr key={r._id || r.id} className="table-row">
                      <td><code className="id-badge">{r.studentId || r.memberId || r._id || '—'}</code></td>
                      <td><span className="member-name">{r.memberName || 'Unknown'}</span></td>
                      <td>{r.eventTitle !== '—' ? r.eventTitle : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No event linked</span>}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatDate(r)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatTime(r)}</td>
                      <td style={{ color: r.organization && r.organization !== '—' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {r.organization || '—'}
                      </td>
                      <td>
                        <span className="status-pill" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                          {st}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>{visible.length} of {records.length} records</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-refreshes every 30 s</span>
        </div>
      </div>
    </main>
  );
};

export default Attendance;
