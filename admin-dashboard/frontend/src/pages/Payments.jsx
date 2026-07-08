import React, { useState } from 'react';

const SAMPLE_PAYMENTS = [
  { id: 'PAY-001', member: 'Juan dela Cruz',  reason: 'Absence – Foundation Day',     amount: 50,  date: '2026-06-29', status: 'Unpaid' },
  { id: 'PAY-002', member: 'Carlo Mendoza',   reason: 'Late – Leadership Seminar',    amount: 30,  date: '2026-07-01', status: 'Paid'   },
  { id: 'PAY-003', member: 'Ryan Torres',     reason: 'Absence – Foundation Day',     amount: 50,  date: '2026-06-29', status: 'Unpaid' },
  { id: 'PAY-004', member: 'Ryan Torres',     reason: 'Absence – Acquaintance Party', amount: 100, date: '2026-07-09', status: 'Unpaid' },
  { id: 'PAY-005', member: 'Maria Santos',    reason: 'Late – General Assembly',      amount: 30,  date: '2026-07-16', status: 'Paid'   },
  { id: 'PAY-006', member: 'Ana Reyes',       reason: 'Lost ID Replacement',          amount: 75,  date: '2026-07-03', status: 'Paid'   },
];

const PAY_STYLE = {
  Paid:   { bg:'rgba(34,197,94,0.12)',  color:'#22c55e', border:'rgba(34,197,94,0.3)'  },
  Unpaid: { bg:'rgba(239,68,68,0.12)', color:'#ef4444', border:'rgba(239,68,68,0.3)'  },
};

const Payments = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);

  const totalCollected = SAMPLE_PAYMENTS.filter(p=>p.status==='Paid').reduce((a,b)=>a+b.amount,0);
  const totalUnpaid    = SAMPLE_PAYMENTS.filter(p=>p.status==='Unpaid').reduce((a,b)=>a+b.amount,0);

  const filtered = SAMPLE_PAYMENTS.filter(p => {
    const matchSearch = p.member.toLowerCase().includes(search.toLowerCase()) || p.reason.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <main className="page-body fade-in" id="payments-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments & Sanctions</h1>
          <p className="page-desc">Track all member fees and penalty collections</p>
        </div>
        <button className="btn-primary" id="add-sanction-btn" onClick={() => setShowModal(true)}>
          + Add Sanction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mini-stats-row" style={{marginBottom:'24px'}}>
        <div className="mini-stat-card" style={{borderColor:'rgba(34,197,94,0.3)'}}>
          <div className="mini-stat-value" style={{color:'#22c55e'}}>₱{totalCollected}</div>
          <div className="mini-stat-label">Total Collected</div>
        </div>
        <div className="mini-stat-card" style={{borderColor:'rgba(239,68,68,0.3)'}}>
          <div className="mini-stat-value" style={{color:'#ef4444'}}>₱{totalUnpaid}</div>
          <div className="mini-stat-label">Total Unpaid</div>
        </div>
        <div className="mini-stat-card">
          <div className="mini-stat-value">{SAMPLE_PAYMENTS.filter(p=>p.status==='Paid').length}</div>
          <div className="mini-stat-label">Paid Records</div>
        </div>
        <div className="mini-stat-card">
          <div className="mini-stat-value">{SAMPLE_PAYMENTS.filter(p=>p.status==='Unpaid').length}</div>
          <div className="mini-stat-label">Pending Records</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ display:'flex', gap:'8px' }}>
            {['All','Paid','Unpaid'].map(s => (
              <button key={s} className={`chip${filter===s?' chip-active':''}`} onClick={() => setFilter(s)}>{s}</button>
            ))}
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input id="payments-search" className="search-input" placeholder="Search member or reason…" value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <button className="btn-ghost" id="export-payments-btn">⬇ Export</button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Payment ID</th><th>Member</th><th>Reason</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const s = PAY_STYLE[p.status];
                return (
                  <tr key={p.id} className="table-row">
                    <td><code className="id-badge">{p.id}</code></td>
                    <td><span className="member-name">{p.member}</span></td>
                    <td style={{color:'var(--text-secondary)',fontSize:'13px'}}>{p.reason}</td>
                    <td style={{color: p.status==='Unpaid' ? '#ef4444' : '#22c55e', fontWeight:600}}>₱{p.amount}</td>
                    <td style={{color:'var(--text-secondary)'}}>{p.date}</td>
                    <td><span className="status-pill" style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>{p.status}</span></td>
                    <td><div className="action-btns">
                      {p.status==='Unpaid' && <button className="action-btn view" title="Mark Paid" style={{color:'#22c55e'}}>✓</button>}
                      <button className="action-btn edit" title="Edit">✏️</button>
                      <button className="action-btn delete" title="Delete">🗑</button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{filtered.length} records</span></div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Sanction</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>Member</label>
                <select className="form-input">
                  <option>Ana Reyes</option><option>Juan dela Cruz</option><option>Maria Santos</option>
                  <option>Carlo Mendoza</option><option>Liza Bautista</option><option>Ryan Torres</option>
                </select>
              </div>
              <div className="form-group"><label>Reason</label><input className="form-input" placeholder="e.g. Absence – Foundation Day" /></div>
              <div className="form-row">
                <div className="form-group"><label>Amount (₱)</label><input className="form-input" type="number" placeholder="0" /></div>
                <div className="form-group"><label>Date</label><input className="form-input" type="date" /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => setShowModal(false)}>Save Sanction</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Payments;
