import React, { useState } from 'react';

const SAMPLE_EVENTS = [
  { id: 'E-001', title: 'General Assembly',       date: '2026-07-15', time: '09:00 AM', venue: 'Auditorium',     participants: 0, status: 'Upcoming',  type: 'Assembly' },
  { id: 'E-002', title: 'Leadership Seminar',     date: '2026-07-20', time: '01:00 PM', venue: 'Room 301',       participants: 0, status: 'Upcoming',  type: 'Seminar'  },
  { id: 'E-003', title: 'Foundation Day',         date: '2026-06-28', time: '08:00 AM', venue: 'School Grounds', participants: 0, status: 'Completed', type: 'Celebration' },
  { id: 'E-004', title: 'Sports Fest',            date: '2026-08-05', time: '07:00 AM', venue: 'Gymnasium',      participants: 0, status: 'Upcoming',  type: 'Sports' },
  { id: 'E-005', title: 'Acquaintance Party',     date: '2026-07-08', time: '04:00 PM', venue: 'Cafeteria',      participants: 0, status: 'Ongoing',   type: 'Social' },
];

const STATUS_COLORS = {
  Upcoming:  { bg: 'rgba(99,102,241,0.12)',  color: '#818cf8', border: 'rgba(99,102,241,0.3)' },
  Ongoing:   { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  Completed: { bg: 'rgba(100,116,139,0.12)', color: '#64748b', border: 'rgba(100,116,139,0.3)' },
};

const TYPE_ICONS = { Assembly:'🎤', Seminar:'📚', Celebration:'🎉', Sports:'⚽', Social:'🎊' };

const Events = () => {
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [view, setView]         = useState('list'); // 'list' | 'grid'

  const filtered = SAMPLE_EVENTS.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.venue.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || e.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <main className="page-body fade-in" id="events-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-desc">Create and manage organization events</p>
        </div>
        <button className="btn-primary" id="add-event-btn" onClick={() => setShowModal(true)}>
          + New Event
        </button>
      </div>

      {/* Stats Row */}
      <div className="mini-stats-row">
        {['Upcoming', 'Ongoing', 'Completed'].map((s) => (
          <div key={s} className="mini-stat-card">
            <div className="mini-stat-value">{SAMPLE_EVENTS.filter(e => e.status === s).length}</div>
            <div className="mini-stat-label">{s}</div>
          </div>
        ))}
        <div className="mini-stat-card">
          <div className="mini-stat-value">{SAMPLE_EVENTS.length}</div>
          <div className="mini-stat-label">Total Events</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            {['All','Upcoming','Ongoing','Completed'].map((s) => (
              <button key={s} className={`chip${filter===s?' chip-active':''}`} onClick={() => setFilter(s)}>
                {s}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input id="events-search" className="search-input" placeholder="Search events…" value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <button className={`icon-toggle${view==='list'?' active':''}`} onClick={()=>setView('list')} title="List view">☰</button>
            <button className={`icon-toggle${view==='grid'?' active':''}`} onClick={()=>setView('grid')} title="Grid view">⊞</button>
          </div>
        </div>

        {view === 'list' ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Event ID</th><th>Title</th><th>Date & Time</th><th>Venue</th><th>Type</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(ev => {
                  const s = STATUS_COLORS[ev.status];
                  return (
                    <tr key={ev.id} className="table-row">
                      <td><code className="id-badge">{ev.id}</code></td>
                      <td><span className="member-name">{ev.title}</span></td>
                      <td><span style={{color:'var(--text-secondary)'}}>{ev.date} · {ev.time}</span></td>
                      <td>{ev.venue}</td>
                      <td><span>{TYPE_ICONS[ev.type]} {ev.type}</span></td>
                      <td><span className="status-pill" style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>{ev.status}</span></td>
                      <td><div className="action-btns">
                        <button className="action-btn view" title="View">👁</button>
                        <button className="action-btn edit" title="Edit">✏️</button>
                        <button className="action-btn delete" title="Delete">🗑</button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="events-grid">
            {filtered.map(ev => {
              const s = STATUS_COLORS[ev.status];
              return (
                <div key={ev.id} className="event-card">
                  <div className="event-card-icon">{TYPE_ICONS[ev.type]}</div>
                  <div className="event-card-content">
                    <div className="event-card-title">{ev.title}</div>
                    <div className="event-card-meta">📅 {ev.date} · {ev.time}</div>
                    <div className="event-card-meta">📍 {ev.venue}</div>
                  </div>
                  <span className="status-pill" style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>{ev.status}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="table-footer"><span>{filtered.length} events</span></div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Event</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>Event Title</label><input className="form-input" placeholder="e.g. General Assembly" /></div>
              <div className="form-row">
                <div className="form-group"><label>Date</label><input className="form-input" type="date" /></div>
                <div className="form-group"><label>Time</label><input className="form-input" type="time" /></div>
              </div>
              <div className="form-group"><label>Venue</label><input className="form-input" placeholder="e.g. Auditorium" /></div>
              <div className="form-row">
                <div className="form-group"><label>Type</label>
                  <select className="form-input"><option>Assembly</option><option>Seminar</option><option>Celebration</option><option>Sports</option><option>Social</option></select>
                </div>
                <div className="form-group"><label>Status</label>
                  <select className="form-input"><option>Upcoming</option><option>Ongoing</option></select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => setShowModal(false)}>Create Event</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Events;
