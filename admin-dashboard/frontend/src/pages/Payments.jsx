import React, { useEffect, useState } from 'react';
import transactionService from '../services/transactionService';

const PAY_STYLE = {
  Paid:   { bg:'rgba(34,197,94,0.12)',  color:'#22c55e', border:'rgba(34,197,94,0.3)'  },
  Unpaid: { bg:'rgba(239,68,68,0.12)', color:'#ef4444', border:'rgba(239,68,68,0.3)'  },
};

const Payments = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [filter, setFilter]               = useState('All');
  const [showModal, setShowModal]         = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const result = await transactionService.getTransactions();
        setTransactions(result.transactions || []);
      } catch (error) {
        console.error('[Payments] failed to load transactions', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const totalCollected = transactions.filter(p => p.status === 'Paid').reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalUnpaid    = transactions.filter(p => p.status === 'Unpaid').reduce((acc, p) => acc + (p.amount || 0), 0);

  const filtered = transactions.filter(p => {
    const member = (p.memberName || p.payerName || '').toString().toLowerCase();
    const reason = (p.reason || p.notes || '').toString().toLowerCase();
    const matchSearch = member.includes(search.toLowerCase()) || reason.includes(search.toLowerCase());
    const status = p.status || 'Unpaid';
    const matchFilter = filter === 'All' || status === filter;
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
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)' }}>
                    Loading payments…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)' }}>
                    No payment records found
                  </td>
                </tr>
              ) : filtered.map(p => {
                const status = p.status || 'Unpaid';
                const s = PAY_STYLE[status];
                return (
                  <tr key={p.paymentId || p._id || p.id} className="table-row">
                    <td><code className="id-badge">{p.paymentId || p._id || p.id || '—'}</code></td>
                    <td><span className="member-name">{p.memberName || p.payerName || 'Unknown'}</span></td>
                    <td style={{color:'var(--text-secondary)',fontSize:'13px'}}>{p.reason || p.notes || '—'}</td>
                    <td style={{color: status === 'Unpaid' ? '#ef4444' : '#22c55e', fontWeight:600}}>₱{p.amount ?? 0}</td>
                    <td style={{color:'var(--text-secondary)'}}>{p.date ? new Date(p.date).toLocaleDateString('en-PH') : '—'}</td>
                    <td><span className="status-pill" style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>{status}</span></td>
                    <td><div className="action-btns">
                      {status === 'Unpaid' && <button className="action-btn view" title="Mark Paid" style={{color:'#22c55e'}}>✓</button>}
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
