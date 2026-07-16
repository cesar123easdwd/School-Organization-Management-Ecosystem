import React, { useState, useEffect, useCallback } from 'react';
import integrationService from '../services/integrationService';
import toast from 'react-hot-toast';

const LOG_STYLE = {
  info:    { bg: 'rgba(127,20,22,0.1)',  color: '#7f1416', border: 'rgba(127,20,22,0.25)',  icon: 'ℹ' },
  error:   { bg: 'rgba(239,68,68,0.1)',  color: '#ef4444', border: 'rgba(239,68,68,0.25)',  icon: '✕' },
  warning: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)', icon: '⚠' },
  success: { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e', border: 'rgba(34,197,94,0.25)',  icon: '✓' },
};

/* SVG icon for each level */
const LogLevelIcon = ({ level }) => {
  const props = { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (level === 'success') return <svg {...props}><polyline points="20 6 9 17 4 12"/></svg>;
  if (level === 'error')   return <svg {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
  if (level === 'warning') return <svg {...props}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
  return <svg {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
};

const formatTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
};

const getLogLevel = (log) => {
  const raw = (log?.level || '').toLowerCase();
  return ['info', 'warning', 'error', 'success'].includes(raw) ? raw : 'info';
};

const getLogMessage = (log) => {
  const message = (log?.action || log?.message || '').trim();
  if (message) return message;
  if (log?.endpoint) return `${log?.method || 'REQUEST'} ${log.endpoint}`;
  return 'Integration event received';
};

const getSystemName = (log) => {
  return log?.systemName || log?.system?.name || 'Unknown system';
};

const getRouteLabel = (log) => {
  if (log?.method && log?.endpoint) return `${log.method} ${log.endpoint}`;
  if (log?.endpoint) return log.endpoint;
  return null;
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
      setAllLogs(Array.isArray(data?.logs) ? data.logs : []);
    } catch (err) {
      toast.error('Failed to load activity logs.');
      console.error('[Logs]', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

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
        <button
          className="btn-ghost"
          id="refresh-logs-btn"
          onClick={fetchLogs}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}>
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* Level Summary Cards */}
      <div className="mini-stats-row" style={{ marginBottom: '24px' }}>
        {['info', 'warning', 'error', 'success'].map(type => {
          const s = LOG_STYLE[type];
          return (
            <div
              key={type}
              className="mini-stat-card"
              style={{
                borderColor: filter === type ? s.border : 'var(--border)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                opacity: filter !== 'All' && filter !== type ? 0.5 : 1,
              }}
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
                {f !== 'All' && (
                  <span style={{ marginRight: '4px', display: 'inline-flex', alignItems: 'center', color: filter === f ? LOG_STYLE[f]?.color : 'inherit' }}>
                    <LogLevelIcon level={f} />
                  </span>
                )}
                {f}
              </button>
            ))}
          </div>
          <div className="search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
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
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ opacity: 0.3, animation: 'spin 1.2s linear infinite' }}>
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              <span className="logs-empty-text">Loading latest activity…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="logs-empty" id="logs-empty-state">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.25 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
              <span className="logs-empty-text">No activity logs yet.</span>
              <span className="logs-empty-sub">Logs will appear here once integration actions are completed.</span>
            </div>
          ) : filtered.map(log => {
            const level = getLogLevel(log);
            const s = LOG_STYLE[level] || LOG_STYLE.info;
            const route = getRouteLabel(log);
            return (
              <div key={log._id} className="log-entry" id={`log-${log._id}`}>
                <div className="log-type-badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                  <LogLevelIcon level={level} />
                </div>
                <div className="log-content">
                  <div className="log-message">{getLogMessage(log)}</div>
                  <div className="log-meta">
                    <span className="log-system">{getSystemName(log)}</span>
                    {route && (
                      <>
                        <span className="log-dot">·</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'monospace' }}>{route}</span>
                      </>
                    )}
                    <span className="log-dot">·</span>
                    <span className="log-time">{formatTime(log.createdAt || log.timestamp)}</span>
                  </div>
                </div>
                <div className="log-tag" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                  {level}
                </div>
              </div>
            );
          })}
        </div>

        <div className="table-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{filtered.length} of {allLogs.length} entries</span>
          {!loading && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Last updated: {new Date().toLocaleTimeString('en-PH')}
            </span>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
};

export default Logs;
