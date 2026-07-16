import React, { useEffect, useState } from 'react';
import eventService from '../services/eventService';

const STATUS_COLORS = {
  Upcoming:  { bg: 'rgba(127,20,22,0.12)', color: '#7f1416', border: 'rgba(127,20,22,0.3)' },
  Ongoing:   { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  Completed: { bg: 'rgba(15,23,42,0.08)',   color: '#6b7280', border: 'rgba(15,23,42,0.15)' },
};

const TYPE_LABELS = {
  Assembly:    'Assembly',
  Seminar:     'Seminar',
  Celebration: 'Celebration',
  Sports:      'Sports',
  Social:      'Social',
};

const Events = () => {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('All');
  const [view, setView]       = useState('list'); // 'list' | 'grid'

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const result = await eventService.getEvents();
        setEvents(result.events || []);
      } catch (error) {
        console.error('[Events] failed to load events', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filtered = events.filter((e) => {
    const venue = e.location || e.venue || '';
    const matchSearch = (e.title || '').toLowerCase().includes(search.toLowerCase()) || venue.toLowerCase().includes(search.toLowerCase());
    const status = e.status || 'Upcoming';
    const matchFilter = filter === 'All' || status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <main className="page-body fade-in" id="events-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-desc">View events synchronized from connected systems</p>
        </div>
        <div className="status-pill" style={{ background: 'rgba(6,182,212,0.1)', color: '#0891b2', border: '1px solid rgba(6,182,212,0.25)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          Synced from connected systems
        </div>
      </div>

      {/* Stats Row */}
      <div className="mini-stats-row">
        {['Upcoming', 'Ongoing', 'Completed'].map((s) => (
          <div key={s} className="mini-stat-card">
            <div className="mini-stat-value">{events.filter(e => (e.status || 'Upcoming') === s).length}</div>
            <div className="mini-stat-label">{s}</div>
          </div>
        ))}
        <div className="mini-stat-card">
          <div className="mini-stat-value">{events.length}</div>
          <div className="mini-stat-label">Total Events</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['All', 'Upcoming', 'Ongoing', 'Completed'].map((s) => (
              <button key={s} className={`chip${filter === s ? ' chip-active' : ''}`} onClick={() => setFilter(s)}>
                {s}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="search-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                id="events-search"
                className="search-input"
                placeholder="Search events…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
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

        {view === 'list' ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Event ID</th><th>Title</th><th>Date & Time</th><th>Venue</th><th>Type</th><th>Status</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <span className="table-loading-spinner" /> Loading events…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No events found
                    </td>
                  </tr>
                ) : filtered.map(ev => {
                  const status = ev.status || 'Upcoming';
                  const s = STATUS_COLORS[status] || STATUS_COLORS.Upcoming;
                  const venue = ev.location || ev.venue || '—';
                  return (
                    <tr key={ev.eventId || ev._id} className="table-row">
                      <td><code className="id-badge">{ev.eventId || ev._id || '—'}</code></td>
                      <td><span className="member-name">{ev.title || 'Untitled event'}</span></td>
                      <td><span style={{ color: 'var(--text-secondary)' }}>{ev.date ? new Date(ev.date).toLocaleDateString('en-PH') : '—'}{ev.time ? ` · ${ev.time}` : ''}</span></td>
                      <td>{venue}</td>
                      <td><span style={{ color: 'var(--text-secondary)' }}>{TYPE_LABELS[ev.type] || ev.type || 'General'}</span></td>
                      <td><span className="status-pill" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="events-grid">
            {filtered.map(ev => {
              const status = ev.status || 'Upcoming';
              const s = STATUS_COLORS[status] || STATUS_COLORS.Upcoming;
              const venue = ev.location || ev.venue || 'No venue specified';
              return (
                <div key={ev.eventId || ev._id || ev.id} className="event-card">
                  <div className="event-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div className="event-card-content">
                    <div className="event-card-title">{ev.title || 'Untitled event'}</div>
                    <div className="event-card-meta">{ev.date ? new Date(ev.date).toLocaleDateString('en-PH') : '—'}{ev.time ? ` · ${ev.time}` : ''}</div>
                    <div className="event-card-meta">{venue}</div>
                  </div>
                  <span className="status-pill" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, alignSelf: 'flex-start', marginTop: '2px' }}>{status}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="table-footer"><span>{filtered.length} of {events.length} events</span></div>
      </div>
    </main>
  );
};

export default Events;
