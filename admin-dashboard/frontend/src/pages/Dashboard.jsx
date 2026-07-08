import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import dashboardService from '../services/dashboardService';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';

/* ── Constants ────────────────────────────────────────────────────── */
const PIE_COLORS    = { Paid: '#22c55e', Unpaid: '#ef4444', Waived: '#f59e0b' };
const LEVEL_COLORS  = { success: '#22c55e', info: '#7f1416', warning: '#f59e0b', error: '#ef4444' };

const MODULE_ICON = {
  'member-registration': '👤',
  'events-management':   '📅',
  'attendance':          '✅',
  'payments':            '💳',
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

/* ── Premium Stat Card ────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, sub, trend, trendUp, color, loading }) => (
  <div className="stat-card fade-in-up" style={{ '--card-accent': color }}>
    <div className="stat-card-top">
      <div className="stat-card-icon" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
        {icon}
      </div>
      {trend !== undefined && (
        <span style={{
          fontSize: '11px', fontWeight: 600,
          color: trendUp ? '#22c55e' : '#ef4444',
          background: trendUp ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          padding: '2px 8px', borderRadius: '99px',
        }}>
          {trendUp ? '↑' : '↓'} {trend}
        </span>
      )}
    </div>
    <div className="stat-card-value">
      {loading ? <span className="skeleton-line" style={{ width: '80px', height: '32px' }} /> : value}
    </div>
    <div className="stat-card-label">{label}</div>
    {sub && <div className="stat-card-sub">{sub}</div>}
  </div>
);

/* ── Chart Card wrapper ───────────────────────────────────────────── */
const ChartCard = ({ title, subtitle, children, action }) => (
  <div className="chart-card fade-in-up">
    <div className="chart-card-header">
      <div>
        <div className="chart-card-title">{title}</div>
        {subtitle && <div className="chart-card-sub">{subtitle}</div>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

/* ── Custom Tooltip for Area/Bar charts ─────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#ffffff', border: '1px solid rgba(15,23,42,0.12)',
      borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#1f2937',
    }}>
      <div style={{ color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, marginBottom: '2px' }}>
          {p.name}: <strong>₱{p.value?.toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
};

/* ── Dashboard Page ───────────────────────────────────────────────── */
const Dashboard = () => {
  const { user }  = useAuth();
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Admin';

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const dash = await dashboardService.getStats();
      setData(dash);
    } catch (err) {
      toast.error('Failed to load dashboard data.');
      console.error('[Dashboard]', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const stats   = data?.stats   || {};
  const charts  = data?.charts  || {};
  const systems = data?.systems || [];
  const logs    = data?.recentLogs || [];

  const monthly     = charts.monthly     || [];
  const sanctionPie = charts.sanctionPie || [];
  const logLevels   = charts.logLevels   || [];

  return (
    <main className="page-body" id="dashboard-page" role="main">

      {/* ── Greeting ────────────────────────────────────────────── */}
      <div className="dashboard-greeting fade-in" style={{ marginBottom: '28px' }}>
        <h1>
          {greeting}, <span style={{ color: '#7f1416' }}>{firstName}</span> 👋
        </h1>
        <p>Here's your organization overview for today.</p>
        <div className="dashboard-meta">
          <span>🕐 {new Date().toLocaleString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          {stats.todayActivity > 0 && (
            <span className="status-success">⚡ {stats.todayActivity} activities today</span>
          )}
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="stats-grid">
        <StatCard loading={loading} icon="👥" label="Total Members"       color="#7f1416"
          value={loading ? '…' : (stats.totalMembers || 0).toLocaleString()}
          sub="Registered in the system"
          trend={stats.totalMembers > 0 ? `${stats.totalMembers} active` : null}
          trendUp={true} />
        <StatCard loading={loading} icon="🔗" label="Online Systems"      color="#06b6d4"
          value={loading ? '…' : `${stats.onlineSystems ?? 0} / ${systems.length}`}
          sub="Sub-systems connected"
          trend={stats.onlineSystems > 0 ? `${stats.onlineSystems} live` : null}
          trendUp={true} />
        <StatCard loading={loading} icon="💰" label="Collected Sanctions" color="#22c55e"
          value={loading ? '…' : `₱${(stats.collectedSanctions || 0).toLocaleString()}`}
          sub="Total payments received"
          trend={stats.todayTransactions > 0 ? `+${stats.todayTransactions} today` : null}
          trendUp={true} />
        <StatCard loading={loading} icon="⚠️" label="Unpaid Sanctions"   color="#f59e0b"
          value={loading ? '…' : `₱${(stats.unpaidSanctions || 0).toLocaleString()}`}
          sub="Outstanding penalties"
          trend={stats.unpaidSanctions > 0 ? 'Needs collection' : 'All clear'}
          trendUp={stats.unpaidSanctions === 0} />
      </div>

      {/* ── Secondary KPI Row ───────────────────────────────────── */}
      <div className="mini-stats-row">
        {[
          { icon: '📅', label: 'Events Logged',      value: stats.totalEvents        ?? 0 },
          { icon: '📋', label: 'Total Transactions',  value: stats.totalTransactions  ?? 0 },
          { icon: '⚡', label: "Today's Activity",    value: stats.todayActivity      ?? 0 },
          { icon: '🖥', label: 'Systems Registered',  value: systems.length },
        ].map(k => (
          <div key={k.label} className="mini-stat-card">
            <div className="mini-stat-value">
              {loading ? '…' : k.value}
            </div>
            <div className="mini-stat-label">{k.icon} {k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Charts Row 1: Area + Pie ─────────────────────────────── */}
      <div className="dashboard-charts-row">

        {/* Monthly Transactions Area Chart */}
        <ChartCard
          title="Monthly Sanctions Overview"
          subtitle="Last 6 months — collected vs outstanding (₱)"
          action={
            <button type="button" onClick={fetchAll} className="btn-ghost">
              ↻ Refresh
            </button>
          }
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradUnpaid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.1)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₱${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#475569', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="collected" name="Collected" stroke="#22c55e" strokeWidth={2} fill="url(#gradCollected)" />
              <Area type="monotone" dataKey="unpaid"    name="Unpaid"    stroke="#ef4444" strokeWidth={2} fill="url(#gradUnpaid)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Sanction Status Pie */}
        <ChartCard title="Sanction Status" subtitle="Distribution by status">
          {sanctionPie.length === 0 ? (
            <div className="empty-state" style={{ height: 220 }}>
              <span style={{ fontSize: '28px' }}>📊</span>
              <span>No transaction data yet</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sanctionPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {sanctionPie.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#7f1416'} />
                  ))}
                </Pie>
                <PieTooltip
                  formatter={(val, name, props) => [`${val} records (₱${props.payload.amount?.toLocaleString()})`, name]}
                  contentStyle={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.12)', borderRadius: '10px', fontSize: '12px', color: '#1f2937' }}
                  labelStyle={{ color: '#475569' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#475569' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Charts Row 2: Bar + Systems ─────────────────────────── */}
      <div className="dashboard-charts-subrow">

        {/* Log Level Bar Chart */}
        <ChartCard title="Activity Log Breakdown" subtitle="Events by severity level">
          {logLevels.length === 0 ? (
            <div className="empty-state" style={{ height: 200 }}>
              <span style={{ fontSize: '28px' }}>📋</span>
              <span>No log data yet</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={logLevels} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.1)" vertical={false} />
                <XAxis dataKey="level" tick={{ fill: '#64748b', fontSize: 11, textTransform: 'capitalize' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.12)', borderRadius: '10px', fontSize: '12px', color: '#1f2937' }}
                  cursor={{ fill: 'rgba(127,20,22,0.05)' }}
                />
                <Bar dataKey="count" name="Events" radius={[6, 6, 0, 0]}>
                  {logLevels.map((entry) => (
                    <Cell key={entry.level} fill={LEVEL_COLORS[entry.level] || '#7f1416'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Connected Systems Status */}
        <ChartCard title="Connected Systems" subtitle="Real-time sub-system status"
          action={<a href="/systems" className="chart-card-action">Manage →</a>}
        >
          <div className="systems-status-list">
            {systems.length === 0 ? (
              <p className="empty-state">No systems registered.</p>
            ) : systems.map(sys => (
              <div key={sys._id} className="system-status-item">
                <span className="system-status-icon" style={{ fontSize: '20px', flexShrink: 0 }}>
                  {MODULE_ICON[sys.module] || '🔗'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="system-status-name">
                    {sys.name}
                  </div>
                  <div className="system-status-meta">
                    {sys.lastSeen ? `Last seen ${timeAgo(sys.lastSeen)}` : 'Never connected'}
                  </div>
                </div>
                <div className={`system-status-badge ${sys.status === 'online' ? 'online' : ''}`}>
                  <span className="system-status-dot" style={{
                    background: sys.status === 'online' ? '#22c55e' : '#64748b',
                    boxShadow: sys.status === 'online' ? '0 0 6px #22c55e' : 'none',
                    animation: sys.status === 'online' ? 'pulse 2s infinite' : 'none',
                  }} />
                  {sys.status === 'online' ? 'Online' : 'Offline'}
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* ── Activity Timeline ────────────────────────────────────── */}
      <ChartCard title="Recent Activity" subtitle="Latest events from all connected systems"
        action={<a href="/logs" className="chart-card-action">View All →</a>}
      >
        <div style={{ padding: '4px 0' }}>
          {logs.length === 0 ? (
            <div className="empty-state">
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🗂️</span>
              No activity yet. Logs appear here once sub-systems connect.
            </div>
          ) : logs.map((log, i) => {
            const colors = { success: '#22c55e', info: '#7f1416', warning: '#f59e0b', error: '#ef4444' };
            const icons  = { success: '✅', info: 'ℹ️', warning: '⚠️', error: '❌' };
            return (
              <div key={log._id} className="activity-item" style={{ borderBottom: i < logs.length - 1 ? '1px solid rgba(15,23,42,0.08)' : 'none' }}>
                {/* Timeline dot */}
                <div className="activity-dot" style={{
                  background: `${colors[log.level] || '#7f1416'}18`,
                  border: `1px solid ${colors[log.level] || '#7f1416'}44`,
                }}>
                  {icons[log.level] || 'ℹ️'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4 }}>
                    {log.action}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '3px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {log.systemName || log.system?.name || 'Admin Dashboard'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'rgba(15,23,42,0.4)' }}>·</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {timeAgo(log.createdAt)}
                    </span>
                  </div>
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px',
                  color: colors[log.level] || '#7f1416',
                  background: `${colors[log.level] || '#7f1416'}18`,
                  padding: '2px 7px', borderRadius: '99px', flexShrink: 0, alignSelf: 'center',
                }}>
                  {log.level?.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* Pulse animation for online dots */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .skeleton-line {
          display: inline-block;
          background: linear-gradient(90deg, rgba(15,23,42,0.1) 25%, rgba(15,23,42,0.14) 50%, rgba(15,23,42,0.1) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </main>
  );
};

export default Dashboard;
