import React, { useState } from 'react';

const SAMPLE_RECORDS = [
  { id: 'ATT-001', member: 'Ana Reyes',       event: 'Foundation Day',     date: '2026-06-28', status: 'Present', time: '08:02 AM' },
  { id: 'ATT-002', member: 'Juan dela Cruz',  event: 'Foundation Day',     date: '2026-06-28', status: 'Late',    time: '09:15 AM' },
  { id: 'ATT-003', member: 'Maria Santos',    event: 'Foundation Day',     date: '2026-06-28', status: 'Absent',  time: '—' },
  { id: 'ATT-004', member: 'Carlo Mendoza',   event: 'Foundation Day',     date: '2026-06-28', status: 'Present', time: '07:55 AM' },
  { id: 'ATT-005', member: 'Liza Bautista',   event: 'Acquaintance Party', date: '2026-07-08', status: 'Present', time: '04:01 PM' },
  { id: 'ATT-006', member: 'Ryan Torres',     event: 'Acquaintance Party', date: '2026-07-08', status: 'Absent',  time: '—' },
];

const ATT_STYLE = {
  Present: { bg:'rgba(34,197,94,0.12)',   color:'#22c55e', border:'rgba(34,197,94,0.3)'   },
  Late:    { bg:'rgba(245,158,11,0.12)',  color:'#f59e0b', border:'rgba(245,158,11,0.3)'  },
  Absent:  { bg:'rgba(239,68,68,0.12)',   color:'#ef4444', border:'rgba(239,68,68,0.3)'   },
};

const Attendance = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const total   = SAMPLE_RECORDS.length;
  const present = SAMPLE_RECORDS.filter(r => r.status === 'Present').length;
  const late    = SAMPLE_RECORDS.filter(r => r.status === 'Late').length;
  const absent  = SAMPLE_RECORDS.filter(r => r.status === 'Absent').length;
  const rate    = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  const filtered = SAMPLE_RECORDS.filter(r => {
    const matchSearch = r.member.toLowerCase().includes(search.toLowerCase()) || r.event.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || r.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <main className="page-body fade-in" id="attendance-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-desc">Monitor member attendance across all events</p>
        </div>
        <button className="btn-primary" id="mark-attendance-btn">✅ Mark Attendance</button>
      </div>

      {/* Rate Card */}
      <div className="attendance-overview">
        <div className="rate-card">
          <div className="rate-circle">
            <svg viewBox="0 0 80 80" className="rate-svg">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
              <circle cx="40" cy="40" r="34" fill="none" stroke="url(#grad)" strokeWidth="8"
                strokeDasharray={`${2*Math.PI*34*rate/100} ${2*Math.PI*34}`}
                strokeLinecap="round" strokeDashoffset={2*Math.PI*34*0.25} transform="rotate(-90 40 40)"/>
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1"/>
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
            { label:'Present', val: present, color:'#22c55e' },
            { label:'Late',    val: late,    color:'#f59e0b' },
            { label:'Absent',  val: absent,  color:'#ef4444' },
            { label:'Total',   val: total,   color:'#818cf8' },
          ].map(item => (
            <div key={item.label} className="mini-stat-card">
              <div className="mini-stat-value" style={{color: item.color}}>{item.val}</div>
              <div className="mini-stat-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ display:'flex', gap:'8px' }}>
            {['All','Present','Late','Absent'].map(s => (
              <button key={s} className={`chip${filter===s?' chip-active':''}`} onClick={() => setFilter(s)}>{s}</button>
            ))}
          </div>
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input id="attendance-search" className="search-input" placeholder="Search member or event…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Record ID</th><th>Member</th><th>Event</th><th>Date</th><th>Time In</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const s = ATT_STYLE[r.status];
                return (
                  <tr key={r.id} className="table-row">
                    <td><code className="id-badge">{r.id}</code></td>
                    <td><span className="member-name">{r.member}</span></td>
                    <td>{r.event}</td>
                    <td style={{color:'var(--text-secondary)'}}>{r.date}</td>
                    <td style={{color:'var(--text-secondary)'}}>{r.time}</td>
                    <td><span className="status-pill" style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>{r.status}</span></td>
                    <td><div className="action-btns">
                      <button className="action-btn edit" title="Edit">✏️</button>
                      <button className="action-btn delete" title="Remove">🗑</button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{filtered.length} records</span></div>
      </div>
    </main>
  );
};

export default Attendance;
