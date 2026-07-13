import React, { useEffect, useState } from 'react';
import transactionService from '../services/transactionService';

const PAY_STYLE = {
  Paid:   { bg:'rgba(34,197,94,0.12)',  color:'#22c55e', border:'rgba(34,197,94,0.3)'  },
  Unpaid: { bg:'rgba(239,68,68,0.12)', color:'#ef4444', border:'rgba(239,68,68,0.3)'  },
};

const getDisplayDate = (payment) => {
  const value = payment?.sanctionDate || payment?.date || payment?.createdAt || payment?.paidAt;
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-PH');
};

const getDisplayReason = (payment) => {
  return payment?.reason || payment?.notes || payment?.description || 'No reason provided';
};

const getDisplayMember = (payment) => {
  return payment?.memberName || payment?.payerName || 'Unknown member';
};

const Payments = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [filter, setFilter]               = useState('All');

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const result = await transactionService.getTransactions();
        setTransactions(result ?? []);
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
    const member = getDisplayMember(p).toLowerCase();
    const reason = getDisplayReason(p).toLowerCase();
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
          <p className="page-desc">Track payment and sanction records synced from connected systems</p>
        </div>
        <div className="status-pill" style={{ background: 'rgba(6,182,212,0.12)', color: '#0891b2', border: '1px solid rgba(6,182,212,0.3)' }}>
          🔗 Synced from connected systems
        </div>
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
          <div className="mini-stat-value">{transactions.filter(p => p.status === 'Paid').length}</div>
          <div className="mini-stat-label">Paid Records</div>
        </div>
        <div className="mini-stat-card">
          <div className="mini-stat-value">{transactions.filter(p => p.status === 'Unpaid').length}</div>
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
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Payment ID</th><th>Member</th><th>Reason</th><th>Amount</th><th>Date</th><th>Status</th><th>Source</th></tr>
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
                    No payment or sanction records yet. They will appear here once integration actions are completed.
                  </td>
                </tr>
              ) : filtered.map(p => {
                const status = p.status || 'Unpaid';
                const s = PAY_STYLE[status];
                return (
                  <tr key={p.paymentId || p._id || p.id} className="table-row">
                    <td><code className="id-badge">{p.paymentId || p._id || p.id || '—'}</code></td>
                    <td><span className="member-name">{getDisplayMember(p)}</span></td>
                    <td style={{color:'var(--text-secondary)',fontSize:'13px'}}>{getDisplayReason(p)}</td>
                    <td style={{color: status === 'Unpaid' ? '#ef4444' : '#22c55e', fontWeight:600}}>₱{p.amount ?? 0}</td>
                    <td style={{color:'var(--text-secondary)'}}>{getDisplayDate(p)}</td>
                    <td><span className="status-pill" style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>{status}</span></td>
                    <td><span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Integrated</span></td>
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

export default Payments;
