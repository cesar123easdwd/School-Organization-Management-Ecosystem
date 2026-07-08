import React, { useEffect, useState } from 'react';
import memberService from '../services/memberService';
import eventService from '../services/eventService';
import attendanceService from '../services/attendanceService';
import transactionService from '../services/transactionService';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COURSE_COLORS = ['#7f1416', '#06b6d4', '#5f1011', '#22c55e', '#f59e0b', '#a855f7'];

const Reports = () => {
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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
      } catch (error) {
        console.error('[Reports] failed to load report data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalMembers = members.length;
  const totalEvents = events.length;
  const totalCollected = transactions.filter(t => t.status === 'Paid').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalPending = transactions.filter(t => t.status === 'Unpaid').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalIssued = totalCollected + totalPending;
  const collectionRate = totalIssued > 0 ? Math.round((totalCollected / totalIssued) * 100) : 0;

  const attendanceCount = attendance.length;
  const attendancePresent = attendance.filter(r => ['Present', 'Late'].includes(r.status)).length;
  const avgAttendance = attendanceCount > 0 ? Math.round((attendancePresent / attendanceCount) * 100) : 0;

  const membersByCourse = Object.entries(
    members.reduce((acc, member) => {
      const course = member.course || 'Unassigned';
      acc[course] = (acc[course] || 0) + 1;
      return acc;
    }, {})
  ).map(([course, count], index) => ({ course, count, color: COURSE_COLORS[index % COURSE_COLORS.length] }));

  const statusCounts = events.reduce((acc, event) => {
    const status = event.status || 'Upcoming';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const eventStatusData = [
    { label: 'Upcoming',  color: '#7f1416', count: statusCounts.Upcoming || 0 },
    { label: 'Ongoing',   color: '#22c55e', count: statusCounts.Ongoing || 0 },
    { label: 'Completed', color: '#64748b', count: statusCounts.Completed || 0 },
  ];

  const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: MONTHS[d.getMonth()] };
  });

  const monthlyAttendance = lastSixMonths.map(({ year, month, label }) => {
    const monthRecords = attendance.filter((record) => {
      const date = new Date(record.date || record.createdAt || record.eventDate || null);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    });
    const present = monthRecords.filter(r => ['Present', 'Late'].includes(r.status)).length;
    const total = monthRecords.length;
    return {
      label,
      attendance: total > 0 ? Math.round((present / total) * 100) : 0,
      total,
    };
  });

  const maxAtt = Math.max(...monthlyAttendance.map(d => d.attendance), 1);

  return (
    <main className="page-body fade-in" id="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-desc">Analytics and summaries for your organization</p>
        </div>
        <button className="btn-primary" id="export-report-btn">⬇ Export Report</button>
      </div>

      <div className="mini-stats-row" style={{ marginBottom: '28px' }}>
        {[
          { label: 'Total Members', val: loading ? '…' : totalMembers.toLocaleString(), icon: '👥', color: '#7f1416' },
          { label: 'Total Events', val: loading ? '…' : totalEvents.toLocaleString(), icon: '📅', color: '#06b6d4' },
          { label: 'Avg Attendance', val: loading ? '…' : `${avgAttendance}%`, icon: '✅', color: '#22c55e' },
          { label: 'Collected Fines', val: loading ? '…' : `₱${totalCollected.toLocaleString()}`, icon: '💰', color: '#f59e0b' },
        ].map((item) => (
          <div key={item.label} className="mini-stat-card">
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{item.icon}</div>
            <div className="mini-stat-value" style={{ color: item.color }}>{item.val}</div>
            <div className="mini-stat-label">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="reports-grid">
        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-title">📊 Monthly Attendance Rate</span>
            <span className="report-card-sub">Last 6 months</span>
          </div>
          {loading ? (
            <div className="empty-state" style={{ minHeight: 200 }}>Loading report data…</div>
          ) : (
            <div className="bar-chart">
              {monthlyAttendance.map((d) => (
                <div key={d.label} className="bar-col">
                  <div className="bar-label-top">{d.attendance}%</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ height: `${(d.attendance / maxAtt) * 100}%`, background: 'linear-gradient(180deg,#7f1416,#5f1011)' }} />
                  </div>
                  <div className="bar-label-bottom">{d.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-title">🎓 Members by Course</span>
            <span className="report-card-sub">Distribution</span>
          </div>
          {loading ? (
            <div className="empty-state" style={{ minHeight: 200 }}>Loading report data…</div>
          ) : (
            <div className="donut-chart-wrap">
              <div className="donut-legend">
                {membersByCourse.map((course) => {
                  const pct = totalMembers > 0 ? Math.round((course.count / totalMembers) * 100) : 0;
                  return (
                    <div key={course.course} className="donut-legend-item">
                      <div className="legend-dot" style={{ background: course.color }} />
                      <div className="legend-info">
                        <div className="legend-label">{course.course}</div>
                        <div className="legend-bar-track">
                          <div className="legend-bar-fill" style={{ width: `${pct}%`, background: course.color }} />
                        </div>
                      </div>
                      <div className="legend-pct">{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-title">📅 Events by Status</span>
            <span className="report-card-sub">All-time</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px 0' }}>
            {eventStatusData.map((item) => {
              const max = totalEvents || 1;
              return (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '80px', fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '99px', height: '8px' }}>
                    <div style={{ width: `${(item.count / max) * 100}%`, background: item.color, height: '8px', borderRadius: '99px', transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ width: '28px', fontSize: '13px', fontWeight: 700, color: item.color }}>{item.count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-title">💰 Sanctions Summary</span>
            <span className="report-card-sub">Collection status</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '12px 0' }}>
            {[
              { label: 'Total Issued', val: loading ? '…' : `₱${totalIssued.toLocaleString()}`, color: 'var(--text-primary)' },
              { label: 'Total Collected', val: loading ? '…' : `₱${totalCollected.toLocaleString()}`, color: '#22c55e' },
              { label: 'Total Pending', val: loading ? '…' : `₱${totalPending.toLocaleString()}`, color: '#ef4444' },
              { label: 'Collection Rate', val: loading ? '…' : `${collectionRate}%`, color: '#f59e0b' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
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
