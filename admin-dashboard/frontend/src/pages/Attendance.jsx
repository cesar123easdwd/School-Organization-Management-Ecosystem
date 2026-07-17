import React, { useEffect, useState } from 'react';
import attendanceService from '../services/attendanceService';
import memberService from '../services/memberService';

const ATT_STYLE = {
  Present: { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', border: 'rgba(34,197,94,0.3)'  },
  Late:    { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  Absent:  { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', border: 'rgba(239,68,68,0.3)'  },
};

const ORGANIZATIONS = ['All', 'ICPEP', 'JPICE', 'MICRO-JPCS', 'UAPSA'];

const normalizeLookupKey = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const resolveOrganization = (member) => {
  const candidate =
    member.organization ||
    member.organizationId ||
    member.organizationJoined ||
    member.organizationName ||
    member.orgName ||
    member.organizationInvolved ||
    member.involvedOrganization ||
    member.organizationLabel ||
    member.systemName;

  if (typeof candidate === 'string') {
    return candidate.trim() || '—';
  }

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

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('All');
  const [organization, setOrganization] = useState('All');

  const formatAttendanceDate = (record) => {
    const value = record?.date || record?.createdAt || record?.lastSyncedAt;
    return value ? new Date(value).toLocaleDateString('en-PH') : '—';
  };

  const formatAttendanceTime = (record) => {
    const value = record?.timeIn || record?.time || record?.createdAt || record?.lastSyncedAt;
    return value ? new Date(value).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '—';
  };

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const [attendanceResult, membersResult] = await Promise.all([
          attendanceService.getAttendance(),
          memberService.getMembers(),
        ]);

        const organizationMap = new Map();
        (membersResult.members || []).forEach((member) => {
          const memberOrganization = resolveOrganization(member);
          [member.memberId, member.studentId, member.fullName, member.memberName]
            .map(normalizeLookupKey)
            .filter(Boolean)
            .forEach((key) => {
              organizationMap.set(key, memberOrganization);
            });
        });

        const normalizedAttendance = (attendanceResult.attendance || []).map((record) => {
          const mappedOrganization =
            record.organization ||
            organizationMap.get(normalizeLookupKey(record.memberId)) ||
            organizationMap.get(normalizeLookupKey(record.memberName)) ||
            '—';

          return {
            ...record,
            organization: mappedOrganization,
          };
        });

        setRecords(normalizedAttendance);
      } catch (error) {
        console.error('[Attendance] failed to load records', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const visibleRecords = records.filter(r => {
    const member = (r.memberName || r.member || '').toString().toLowerCase();
    const event  = (r.eventTitle || r.event || '').toString().toLowerCase();
    const matchSearch = member.includes(search.toLowerCase()) || event.includes(search.toLowerCase());
    const status = r.status || 'Absent';
    const matchFilter = filter === 'All' || status === filter;
    const matchOrganization = organization === 'All' || normalizeLookupKey(r.organization) === normalizeLookupKey(organization);
    return matchSearch && matchFilter && matchOrganization;
  });

  const total   = visibleRecords.length;
  const present = visibleRecords.filter(r => r.status === 'Present').length;
  const late    = visibleRecords.filter(r => r.status === 'Late').length;
  const absent  = visibleRecords.filter(r => r.status === 'Absent').length;
  const rate    = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return (
    <main className="page-body fade-in" id="attendance-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-desc">View attendance records synchronized from connected systems</p>
        </div>
        <div className="status-pill" style={{ background: 'rgba(6,182,212,0.1)', color: '#0891b2', border: '1px solid rgba(6,182,212,0.25)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          Synced from connected systems
        </div>
      </div>

      {/* Rate Card */}
      <div className="attendance-overview">
        <div className="rate-card">
          <div className="rate-circle">
            <svg viewBox="0 0 80 80" className="rate-svg">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="8"/>
              <circle cx="40" cy="40" r="34" fill="none" stroke="url(#grad)" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 34 * rate / 100} ${2 * Math.PI * 34}`}
                strokeLinecap="round" strokeDashoffset={2 * Math.PI * 34 * 0.25} transform="rotate(-90 40 40)"/>
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
            { label: 'Late',    val: late,    color: '#f59e0b' },
            { label: 'Absent',  val: absent,  color: '#ef4444' },
            { label: 'Total',   val: total,   color: '#7f1416' },
          ].map(item => (
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
          <div style={{ display: 'flex', gap: '8px' }}>
            {['All', 'Present', 'Late', 'Absent'].map(s => (
              <button key={s} className={`chip${filter === s ? ' chip-active' : ''}`} onClick={() => setFilter(s)}>{s}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <label className="search-box" style={{ minWidth: '220px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                id="attendance-search"
                className="search-input"
                placeholder="Search member or event…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </label>
            <label className="search-box" style={{ minWidth: '200px' }}>
              <select
                id="attendance-organization"
                className="search-input"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                aria-label="Filter attendance by organization"
              >
                {ORGANIZATIONS.map((org) => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Record ID</th><th>Member</th><th>Event</th><th>Date</th><th>Time In</th><th>Organization</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading attendance…
                  </td>
                </tr>
              ) : visibleRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No attendance records found
                  </td>
                </tr>
              ) : visibleRecords.map(r => {
                const status = r.status || 'Absent';
                const s = ATT_STYLE[status] || ATT_STYLE.Absent;
                const eventLabel = r.eventTitle || r.event || '—';
                return (
                  <tr key={r._id || r.id} className="table-row">
                    <td><code className="id-badge">{r._id || r.id || '—'}</code></td>
                    <td><span className="member-name">{r.memberName || r.member || 'Unknown'}</span></td>
                    <td>{eventLabel}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatAttendanceDate(r)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatAttendanceTime(r)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.organization || '—'}</td>
                    <td><span className="status-pill" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{visibleRecords.length} of {records.length} records</span></div>
      </div>
    </main>
  );
};

export default Attendance;
