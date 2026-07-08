import React, { useState, useEffect, useCallback } from 'react';
import integrationService from '../services/integrationService';
import toast from 'react-hot-toast';

const LOG_STYLE = {
  info:    { bg: 'rgba(127,20,22,0.12)',  color: '#7f1416', border: 'rgba(127,20,22,0.3)',  icon: 'ℹ' },
  error:   { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', border: 'rgba(239,68,68,0.3)',   icon: '✕' },
  warning: { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', border: 'rgba(245,158,11,0.3)',  icon: '⚠' },
  success: { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e', border: 'rgba(34,197,94,0.3)',   icon: '✓' },
};

const formatTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
};

const Logs = () => {
  const [allLogs,  setAllLogs]  = useState([]);
  const [filter,   setFilter]   = useState('All');
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await integrationService.getLogs({ limit: 100 });
      setAllLogs(data.logs || []);
    } catch (err) {
      toast.error('Failed to load activity logs.');
      console.error('[Logs]', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  /* Apply filter + search */
  const filtered = allLogs.filter(log => {
    const matchFilter = filter === 'All' || log.level === filter;
    const matchSearch =
      (log.action     || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.systemName || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  /* Count by level */
  const counts = ['info', 'warning', 'error', 'success'].reduce((acc, l) => {
    acc[l] = allLogs.filter(x => x.level === l).length;
    return acc;
  }, {});

  return (
    <main className="page-body fade-in" id="logs-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Logs</h1>
          <p className="page-desc">Real-time system event history and integration activity</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-ghost" id="refresh-logs-btn" onClick={fetchLogs} disabled={loading}>
            {loading ? '⟳ Loading…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Level Summary Cards */}
      <div className="mini-stats-row" style={{ marginBottom: '24px' }}>
        {['info', 'warning', 'error', 'success'].map(type => {
          const s = LOG_STYLE[type];
          return (
            <div
              key={type}
              className="mini-stat-card"
              style={{ borderColor: s.border, cursor: 'pointer', transition: 'opacity 0.15s',
                       opacity: filter !== 'All' && filter !== type ? 0.5 : 1 }}
              onClick={() => setFilter(filter === type ? 'All' : type)}
              title={`Filter by ${type}`}
            >
              <div className="mini-stat-value" style={{ color: s.color }}>{counts[type] || 0}</div>
              <div className="mini-stat-label" style={{ textTransform: 'capitalize' }}>{type}</div>
            </div>
          );
        })}
      </div>

      {/* Log Panel */}
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '8px' }}>
            {['All', 'info', 'warning', 'error', 'success'].map(f => (
              <button
                key={f}
                className={`chip${filter === f ? ' chip-active' : ''}`}
                onClick={() => setFilter(f)}
                style={{ textTransform: 'capitalize' }}
              >
                {f !== 'All' && <span style={{ marginRight: '4px' }}>{LOG_STYLE[f]?.icon}</span>}
                {f}
              </button>
            ))}
          </div>
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              id="logs-search"
              className="search-input"
              placeholder="Search logs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="logs-list" role="log" aria-live="polite">
          {loading ? (
            <div className="logs-empty">
              <span className="logs-empty-icon">⟳</span>
              <span className="logs-empty-text">Loading latest activity…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="logs-empty" id="logs-empty-state">
              <span className="logs-empty-icon">🗂️</span>
              <span className="logs-empty-text">No activity logs are available yet.</span>
              <span className="logs-empty-sub">Live events will appear here as systems connect.</span>
            </div>
          ) : filtered.map(log => {
            const s = LOG_STYLE[log.level] || LOG_STYLE.info;
            return (
              <div key={log._id} className="log-entry" id={`log-${log._id}`}>
                <div className="log-type-badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                  {s.icon}
                </div>
                <div className="log-content">
                  <div className="log-message">{log.action}</div>
                  <div className="log-meta">
                    <span className="log-system">{log.systemName}</span>
                    {log.method && (
                      <>
                        <span className="log-dot">·</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'monospace' }}>
                          {log.method} {log.endpoint}
                        </span>
                      </>
                    )}
                    <span className="log-dot">·</span>
                    <span className="log-time">{formatTime(log.createdAt)}</span>
                  </div>
                </div>
                <div className="log-tag" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                  {log.level}
                </div>
              </div>
            );
          })}
        </div>

        <div className="table-footer">
          <span>{filtered.length} of {allLogs.length} entries</span>
          {!loading && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Last updated: {new Date().toLocaleTimeString('en-PH')}
            </span>
          )}
        </div>
      </div>
    </main>
  );
};

export default Logs;
