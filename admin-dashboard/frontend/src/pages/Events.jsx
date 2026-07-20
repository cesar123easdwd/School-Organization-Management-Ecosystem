import React, { useEffect, useState, useCallback } from 'react';
import eventService from '../services/eventService';

// Valid statuses: Drafted | Active | Postponed | Completed | Cancelled
const STATUS_COLORS = {
  Drafted:   { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', border: 'rgba(107,114,128,0.3)' },
  Active:    { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e', border: 'rgba(34,197,94,0.3)'   },
  Postponed: { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', border: 'rgba(245,158,11,0.3)'  },
  Completed: { bg: 'rgba(15,23,42,0.08)',    color: '#94a3b8', border: 'rgba(15,23,42,0.15)'   },
  Cancelled: { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', border: 'rgba(239,68,68,0.3)'   },
};

const ALL_STATUSES = ['All', 'Drafted', 'Active', 'Postponed', 'Completed', 'Cancelled'];

const POLL_INTERVAL_MS = 30_000;

/** Format both date and time from a date value */
const formatDateTime = (raw) => {
  if (!raw) return { date: '—', time: '—' };
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return { date: '—', time: '—' };
    return {
      date: d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch {
    return { date: '—', time: '—' };
  }
};

/** Resolve the venue/location regardless of which field the sub-system used */
const resolveVenue = (ev) =>
  (ev.location && ev.location.trim()) ||
  (ev.venue    && ev.venue.trim())    ||
  '—';

/** Resolve organizer regardless of field name used */
const resolveOrganizer = (ev) =>
  (ev.organizer      && ev.organizer.trim())      ||
  (ev.organizingClub && ev.organizingClub.trim()) ||
  '—';

/** Normalize event type label */
const resolveType = (ev) => {
  const t = (ev.type || '').trim();
  if (!t) return 'General';
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const Events = () => {
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('All');
  const [view, setView]           = useState('list'); // 'list' | 'grid'
  const [lastUpdated, setLastUpdated] = useState(null);

  // ── Fetch events ──────────────────────────────────────────────────
  const fetchEvents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await eventService.getEvents();
      setEvents(result.events || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('[Events] failed to load events', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(false); }, [fetchEvents]);

  // Auto-poll every 30 s so teammate status changes appear automatically
  useEffect(() => {
    const timer = setInterval(() => fetchEvents(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchEvents]);

  // ── Filter ────────────────────────────────────────────────────────
  const filtered = events.filter((ev) => {
    const venue = resolveVenue(ev).toLowerCase();
    const org   = resolveOrganizer(ev).toLowerCase();
    const matchSearch =
      (ev.title || '').toLowerCase().includes(search.toLowerCase()) ||
      venue.includes(search.toLowerCase()) ||
      org.includes(search.toLowerCase());
    const matchFilter = filter === 'All' || ev.status === filter;
    return matchSearch && matchFilter;
  });

  // ── Status stat counts ────────────────────────────────────────────
  const statusCounts = ALL_STATUSES.slice(1).reduce((acc, s) => {
    acc[s] = events.filter((ev) => ev.status === s).length;
    return acc;
  }, {});

  return (
    <main className="page-body fade-in" id="events-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-desc">View events synchronized from connected systems</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            id="events-refresh-btn"
            title="Refresh events"
            onClick={() => fetchEvents(false)}
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

      {/* Stats Row — all 5 statuses + total */}
      <div className="mini-stats-row">
        {ALL_STATUSES.slice(1).map((s) => (
          <div key={s} className="mini-stat-card">
            <div className="mini-stat-value" style={{ color: STATUS_COLORS[s]?.color }}>
              {statusCounts[s] || 0}
            </div>
            <div className="mini-stat-label">{s}</div>
          </div>
        ))}
        <div className="mini-stat-card">
          <div className="mini-stat-value">{events.length}</div>
          <div className="mini-stat-label">Total Events</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-toolbar">
          {/* Filter chips — all 5 statuses */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                className={`chip${filter === s ? ' chip-active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Search */}
            <div className="search-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                id="events-search"
                className="search-input"
                placeholder="Search events…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* List / Grid toggle */}
            <button
              className={`icon-toggle${view === 'list' ? ' active' : ''}`}
              onClick={() => setView('list')}
              title="List view"
              aria-label="List view"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
            <button
              className={`icon-toggle${view === 'grid' ? ' active' : ''}`}
              onClick={() => setView('grid')}
              title="Grid view"
              aria-label="Grid view"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── List View ───────────────────────────────────────────── */}
        {view === 'list' ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Venue</th>
                  <th>Organizer</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <span className="table-loading-spinner" /> Loading events…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No events found
                    </td>
                  </tr>
                ) : (
                  filtered.map((ev) => {
                    const status  = ev.status || 'Drafted';
                    const s       = STATUS_COLORS[status] || STATUS_COLORS.Drafted;
                    const venue   = resolveVenue(ev);
                    const org     = resolveOrganizer(ev);
                    const { date, time } = formatDateTime(ev.date || ev.schedule);
                    return (
                      <tr key={ev._id || ev.eventId} className="table-row">
                        <td><code className="id-badge">{ev.eventId || ev._id || '—'}</code></td>
                        <td><span className="member-name">{ev.title || 'Untitled'}</span></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{date}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{time}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{venue}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{org}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{resolveType(ev)}</td>
                        <td>
                          <span className="status-pill" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── Grid View ──────────────────────────────────────────── */
          <div className="events-grid">
            {loading ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Loading events…
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No events found
              </div>
            ) : (
              filtered.map((ev) => {
                const status = ev.status || 'Drafted';
                const s      = STATUS_COLORS[status] || STATUS_COLORS.Drafted;
                const venue  = resolveVenue(ev);
                const org    = resolveOrganizer(ev);
                const { date, time } = formatDateTime(ev.date || ev.schedule);
                return (
                  <div key={ev._id || ev.eventId} className="event-card">
                    <div className="event-card-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <div className="event-card-content">
                      <div className="event-card-title">{ev.title || 'Untitled'}</div>
                      <div className="event-card-meta">
                        📅 {date} &nbsp;·&nbsp; 🕐 {time}
                      </div>
                      <div className="event-card-meta">📍 {venue}</div>
                      <div className="event-card-meta">🏛 {org}</div>
                    </div>
                    <span className="status-pill" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, alignSelf: 'flex-start', marginTop: '2px' }}>
                      {status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        <div className="table-footer">
          <span>{filtered.length} of {events.length} events</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-refreshes every 30 s</span>
        </div>
      </div>
    </main>
  );
};

export default Events;
