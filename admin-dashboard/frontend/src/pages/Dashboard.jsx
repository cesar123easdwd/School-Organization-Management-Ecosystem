import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area,
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import useAuth from '../hooks/useAuth';
import dashboardService from '../services/dashboardService';

/* ── Constants ────────────────────────────────────────────────────── */
const PIE_COLORS = { Paid: '#22c55e', Unpaid: '#ef4444', Waived: '#f59e0b' };
const POLL_INTERVAL_MS = 30_000;


/* ── SVG Icon Set ─────────────────────────────────────────────────── */
const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconCoin = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

/* ── Premium Stat Card ────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, sub, trend, trendUp, color, loading }) => (
  <div className="stat-card fade-in-up" style={{ '--card-accent': color }}>
    <div className="stat-card-top">
      <div className="stat-card-icon" style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}>
        {icon}
      </div>
      {trend !== undefined && trend !== null && (
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

  const [loading,     setLoading]     = useState(true);
  const [stats,       setStats]       = useState({});
  const [monthly,     setMonthly]     = useState([]);
  const [sanctionPie, setSanctionPie] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await dashboardService.getStats();
      if (data?.success) {
        setStats(data.stats                   ?? {});
        setMonthly(data.charts?.monthly        ?? []);
        setSanctionPie(data.charts?.sanctionPie ?? []);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('[Dashboard] failed to load stats:', err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(false); }, [load]);

  // Auto-refresh every 30 s
  useEffect(() => {
    const timer = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <main className="page-body" id="dashboard-page" role="main">

      {/* ── Greeting ────────────────────────────────────────────── */}
      <div className="dashboard-greeting fade-in" style={{ marginBottom: '28px' }}>
        <h1>
          {greeting}, <span style={{ color: '#7f1416' }}>{firstName}</span> 👋
        </h1>
        <div className="dashboard-meta">
          <span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:'inline', verticalAlign:'middle', marginRight:'4px' }}>
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {new Date().toLocaleString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
          {lastUpdated && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          {stats.todayActivity > 0 && (
            <span className="status-success">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:'inline', verticalAlign:'middle', marginRight:'4px' }}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              {stats.todayActivity} activities today
            </span>
          )}
          <button
            id="dashboard-refresh-btn"
            title="Refresh dashboard"
            onClick={() => load(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '4px 12px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-secondary)', fontSize: '0.78rem',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="stats-grid">
        <StatCard loading={loading} icon={<IconUsers />} label="Total Members" color="#7f1416"
          value={stats.totalMembers ?? 0}
          sub={`${stats.totalMembers ?? 0} registered members`}
          trend={null} trendUp={true} />
        <StatCard loading={loading} icon={<IconCalendar />} label="Total Events" color="#06b6d4"
          value={stats.totalEvents ?? 0}
          sub={`${stats.totalEvents ?? 0} events recorded`}
          trend={null} trendUp={true} />
        <StatCard loading={loading} icon={<IconCoin />} label="Collected Sanctions" color="#22c55e"
          value={`₱${(stats.collectedSanctions ?? 0).toLocaleString()}`}
          sub="Total paid"
          trend={null} trendUp={true} />
        <StatCard loading={loading} icon={<IconAlertTriangle />} label="Unpaid Sanctions" color="#f59e0b"
          value={`₱${(stats.unpaidSanctions ?? 0).toLocaleString()}`}
          sub="Outstanding balance"
          trend={null} trendUp={false} />
      </div>

      {/* ── Charts Row 1: Area + Pie ─────────────────────────────── */}
      <div className="dashboard-charts-row">

        {/* Monthly Sanctions Area Chart */}
        <ChartCard
          title="Monthly Sanctions Overview"
          subtitle="Last 6 months — collected vs outstanding (₱)"
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#475569', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="collected" name="Collected" stroke="#22c55e" strokeWidth={2} fill="url(#gradCollected)" />
              <Area type="monotone" dataKey="unpaid"    name="Unpaid"    stroke="#ef4444" strokeWidth={2} fill="url(#gradUnpaid)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Sanction Status Pie */}
        <ChartCard title="Sanction Status" subtitle="Distribution by payment status">
          {sanctionPie.length === 0 ? (
            <div className="empty-state" style={{ height: 220 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              <span>No sanction records yet.</span>
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
                  formatter={(val, name, props) => [`${val} records (₱${(props.payload.amount || 0).toLocaleString()})`, name]}
                  contentStyle={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.12)', borderRadius: '10px', fontSize: '12px', color: '#1f2937' }}
                  labelStyle={{ color: '#475569' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#475569' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Pulse + skeleton animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .skeleton-line {
          display: inline-block;
          background: linear-gradient(90deg, rgba(15,23,42,0.08) 25%, rgba(15,23,42,0.12) 50%, rgba(15,23,42,0.08) 75%);
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
