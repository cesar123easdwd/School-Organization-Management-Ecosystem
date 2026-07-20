import React, { useEffect, useState, useCallback } from 'react';
import memberService from '../services/memberService';
import eventService from '../services/eventService';
import attendanceService from '../services/attendanceService';
import transactionService from '../services/transactionService';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COURSE_COLORS = ['#7f1416', '#06b6d4', '#5f1011', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#8b5cf6'];

const POLL_INTERVAL_MS = 30_000;

/* ── Abbreviate long course names ───────────────────────────────── */
const abbreviateCourse = (course) => {
  if (!course || course === 'Unassigned') return course;
  // "Bachelor of Science in Computer Engineering" → "BS Computer Engineering"
  return course
    .replace(/^Bachelor of Science in /i, 'BS ')
    .replace(/^Bachelor in /i, 'B ')
    .replace(/^Bachelor of /i, 'B ');
};

/* ── Parse date robustly (handles null, ISO, "2026-07-20 06:27") ── */
const parseDate = (value) => {
  if (!value) return null;
  try {
    const d = new Date(String(value).replace(' ', 'T'));
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
};

/* ── Resolve date from an attendance record (multiple field names) ─ */
const resolveAttDate = (r) =>
  parseDate(r.checkIn) ||    // teammate uses checkIn
  parseDate(r.date)    ||    // our schema
  parseDate(r.createdAt);    // ultimate fallback

/* ── CSV Export Helper ──────────────────────────────────────────── */
const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h] ?? '';
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
    }).join(',')
  );
  const csv  = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const Reports = () => {
  const [members, setMembers]           = useState([]);
  const [events, setEvents]             = useState([]);
  const [attendance, setAttendance]     = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [lastUpdated, setLastUpdated]   = useState(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [memberRes, eventRes, attendanceRes, transactionRes] = await Promise.all([
        memberService.getMembers(),
        eventService.getEvents(),
        attendanceService.getAttendance(),
        transactionService.getTransactions(),
      ]);
      setMembers(memberRes.members || []);
      setEvents(eventRes.events || []);
      setAttendance(attendanceRes.attendance || []);
      setTransactions(transactionRes.transactions || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('[Reports] failed to load report data', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(false); }, [fetchData]);

  // Auto-poll every 30 s
  useEffect(() => {
    const timer = setInterval(() => fetchData(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchData]);

  // ── Financial stats ──────────────────────────────────────────────
  const totalMembers   = members.length;
  const totalEvents    = events.length;
  const totalCollected = transactions.filter((t) => t.status === 'Paid').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalPending   = transactions.filter((t) => t.status === 'Unpaid').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalIssued    = totalCollected + totalPending;
  const collectionRate = totalIssued > 0 ? Math.round((totalCollected / totalIssued) * 100) : 0;

  // ── Attendance stats ─────────────────────────────────────────────
  const attendanceCount   = attendance.length;
  const attendancePresent = attendance.filter((r) => r.status === 'Present').length;
  const avgAttendance     = attendanceCount > 0 ? Math.round((attendancePresent / attendanceCount) * 100) : 0;

  // ── Members by Course (abbreviated) ─────────────────────────────
  const membersByCourse = Object.entries(
    members.reduce((acc, m) => {
      const course = abbreviateCourse(m.course || 'Unassigned');
      acc[course] = (acc[course] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1]) // highest first
    .map(([course, count], i) => ({ course, count, color: COURSE_COLORS[i % COURSE_COLORS.length] }));

  // ── Events by Status — uses updated 5-status system ─────────────
  const statusCounts = events.reduce((acc, ev) => {
    const s = ev.status || 'Drafted';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const eventStatusData = [
    { label: 'Drafted',   color: '#6b7280', count: statusCounts.Drafted   || 0 },
    { label: 'Active',    color: '#22c55e', count: statusCounts.Active    || 0 },
    { label: 'Postponed', color: '#f59e0b', count: statusCounts.Postponed || 0 },
    { label: 'Completed', color: '#06b6d4', count: statusCounts.Completed || 0 },
    { label: 'Cancelled', color: '#ef4444', count: statusCounts.Cancelled || 0 },
  ];

  // ── Monthly Attendance (last 6 months) ──────────────────────────
  const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: MONTHS[d.getMonth()] };
  });

  const monthlyAttendance = lastSixMonths.map(({ year, month, label }) => {
    const monthRecords = attendance.filter((r) => {
      const d = resolveAttDate(r); // uses checkIn / date / createdAt
      if (!d) return false;
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
    const present = monthRecords.filter((r) => r.status === 'Present').length;
    const total   = monthRecords.length;
    return {
      label,
      rate:  total > 0 ? Math.round((present / total) * 100) : 0,
      total,
      present,
    };
  });

  // Guard against all-zero (maxAtt must be at least 1 to avoid div-by-zero)
  const maxAtt = Math.max(...monthlyAttendance.map((d) => d.rate), 1);

  /* ── Export ──────────────────────────────────────────────────────── */
  const handleExport = () => {
    const summary = [
      { Metric: 'Total Members',   Value: totalMembers },
      { Metric: 'Total Events',    Value: totalEvents },
      { Metric: 'Avg Attendance',  Value: `${avgAttendance}%` },
      { Metric: 'Total Collected', Value: `₱${totalCollected.toLocaleString()}` },
      { Metric: 'Total Pending',   Value: `₱${totalPending.toLocaleString()}` },
      { Metric: 'Total Issued',    Value: `₱${totalIssued.toLocaleString()}` },
      { Metric: 'Collection Rate', Value: `${collectionRate}%` },
    ];
    exportToCSV(summary, `report-summary-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <main className="page-body fade-in" id="reports-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-desc">Analytics and summaries for your organization</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            id="reports-refresh-btn"
            title="Refresh reports"
            onClick={() => fetchData(false)}
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
          <button
            className="btn-primary"
            id="export-report-btn"
            onClick={handleExport}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mini-stats-row" style={{ marginBottom: '28px' }}>
        {[
          { label: 'Total Members',   val: loading ? '…' : totalMembers.toLocaleString(),            color: '#7f1416' },
          { label: 'Total Events',    val: loading ? '…' : totalEvents.toLocaleString(),             color: '#06b6d4' },
          { label: 'Avg Attendance',  val: loading ? '…' : `${avgAttendance}%`,                      color: '#22c55e' },
          { label: 'Collected Fines', val: loading ? '…' : `₱${totalCollected.toLocaleString()}`,    color: '#f59e0b' },
          { label: 'Collection Rate', val: loading ? '…' : `${collectionRate}%`,                     color: '#a855f7' },
        ].map((item) => (
          <div key={item.label} className="mini-stat-card">
            <div className="mini-stat-value" style={{ color: item.color }}>{item.val}</div>
            <div className="mini-stat-label">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="reports-grid">

        {/* Monthly Attendance Rate Chart */}
        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-title">Monthly Attendance Rate</span>
            <span className="report-card-sub">Last 6 months</span>
          </div>
          {loading ? (
            <div className="empty-state" style={{ minHeight: 200 }}>Loading report data…</div>
          ) : (
            <div className="bar-chart">
              {monthlyAttendance.map((d) => (
                <div key={d.label} className="bar-col">
                  <div className="bar-label-top">{d.rate}%</div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        height: `${(d.rate / maxAtt) * 100}%`,
                        background: 'linear-gradient(180deg,#7f1416,#5f1011)',
                      }}
                    />
                  </div>
                  <div className="bar-label-bottom">{d.label}</div>
                  {d.total > 0 && (
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {d.present}/{d.total}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Members by Course */}
        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-title">Members by Course</span>
            <span className="report-card-sub">Distribution</span>
          </div>
          {loading ? (
            <div className="empty-state" style={{ minHeight: 200 }}>Loading report data…</div>
          ) : membersByCourse.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 120 }}>No member data available.</div>
          ) : (
            <div className="donut-chart-wrap">
              <div className="donut-legend">
                {membersByCourse.map((item) => {
                  const pct = totalMembers > 0 ? Math.round((item.count / totalMembers) * 100) : 0;
                  return (
                    <div key={item.course} className="donut-legend-item">
                      <div className="legend-dot" style={{ background: item.color }} />
                      <div className="legend-info">
                        <div className="legend-label" title={item.course}>{item.course}</div>
                        <div className="legend-bar-track">
                          <div className="legend-bar-fill" style={{ width: `${pct}%`, background: item.color }} />
                        </div>
                      </div>
                      <div className="legend-pct">{item.count} ({pct}%)</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Events by Status — updated for 5-status system */}
        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-title">Events by Status</span>
            <span className="report-card-sub">All-time</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px 0' }}>
            {eventStatusData.map((item) => {
              const max = totalEvents || 1;
              return (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '80px', fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</div>
                  <div style={{ flex: 1, background: 'rgba(15,23,42,0.06)', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${(item.count / max) * 100}%`, background: item.color, height: '8px', borderRadius: '99px', transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ width: '28px', fontSize: '13px', fontWeight: 700, color: item.color }}>{item.count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sanctions / Payments Summary */}
        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-title">Sanctions Summary</span>
            <span className="report-card-sub">Collection status</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '8px 0' }}>
            {[
              { label: 'Total Issued',    val: loading ? '…' : `₱${totalIssued.toLocaleString()}`,    color: 'var(--text-primary)' },
              { label: 'Total Collected', val: loading ? '…' : `₱${totalCollected.toLocaleString()}`, color: '#22c55e' },
              { label: 'Total Pending',   val: loading ? '…' : `₱${totalPending.toLocaleString()}`,   color: '#ef4444' },
              { label: 'Collection Rate', val: loading ? '…' : `${collectionRate}%`,                  color: '#f59e0b' },
              { label: 'Total Records',   val: loading ? '…' : transactions.length,                   color: 'var(--text-secondary)' },
            ].map((item) => (
              <div
                key={item.label}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(15,23,42,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}
              >
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: item.color }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
};

export default Reports;
