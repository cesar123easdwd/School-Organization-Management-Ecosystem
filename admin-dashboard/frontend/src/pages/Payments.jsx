import React, { useEffect, useState, useCallback } from 'react';
import transactionService from '../services/transactionService';

const PAY_STYLE = {
  Paid:   { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', border: 'rgba(34,197,94,0.3)'  },
  Unpaid: { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', border: 'rgba(239,68,68,0.3)'  },
  Waived: { bg: 'rgba(107,114,128,0.12)',color: '#6b7280', border: 'rgba(107,114,128,0.3)' },
};

const POLL_INTERVAL_MS = 30_000;

/**
 * Format a date that may be:
 *  - a Date object / ISO string (our schema)
 *  - a string like "2026-07-20 06:27" (teammate's format)
 *  - null / undefined
 */
const formatDate = (value) => {
  if (!value) return '—';
  try {
    // Replace space-separator with T for proper parsing
    const d = new Date(String(value).replace(' ', 'T'));
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return '—'; }
};

const getDisplayDate = (p) => {
  // Backend now resolves `date` — try all fallbacks
  const v = p?.date || p?.sanctionDate || p?.processedAt || p?.paidAt || p?.createdAt;
  return formatDate(v);
};

const getDisplayReason = (p) => {
  // Backend resolves `reason` from event/description/notes
  return p?.reason || p?.event || p?.description || p?.notes || 'No reason provided';
};

const getDisplayMember = (p) => {
  return p?.memberName || p?.name || p?.payerName || 'Unknown member';
};

const Payments = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filter, setFilter]             = useState('All');
  const [lastUpdated, setLastUpdated]   = useState(null);

  // ── Fetch transactions ────────────────────────────────────────────
  const fetchTransactions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await transactionService.getTransactions();
      setTransactions(Array.isArray(result?.transactions) ? result.transactions : []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('[Payments] failed to load transactions', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(false); }, [fetchTransactions]);

  // Auto-poll every 30 s
  useEffect(() => {
    const timer = setInterval(() => fetchTransactions(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchTransactions]);

  // ── Stats ─────────────────────────────────────────────────────────
  const totalCollected = transactions
    .filter((p) => p.status === 'Paid')
    .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const totalUnpaid = transactions
    .filter((p) => p.status === 'Unpaid')
    .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const paidCount   = transactions.filter((p) => p.status === 'Paid').length;
  const unpaidCount = transactions.filter((p) => p.status === 'Unpaid').length;
  const waivedCount = transactions.filter((p) => p.status === 'Waived').length;

  // ── Filter ────────────────────────────────────────────────────────
  const filtered = transactions.filter((p) => {
    const member = getDisplayMember(p).toLowerCase();
    const reason = getDisplayReason(p).toLowerCase();
    const matchSearch = member.includes(search.toLowerCase()) || reason.includes(search.toLowerCase());
    const matchFilter = filter === 'All' || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <main className="page-body fade-in" id="payments-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments &amp; Sanctions</h1>
          <p className="page-desc">Track payment and sanction records synced from connected systems</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            id="payments-refresh-btn"
            title="Refresh payments"
            onClick={() => fetchTransactions(false)}
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
          <a
            href="https://sia-sanction-payment-management.vercel.app"
            className="btn-primary"
            style={{ textDecoration: 'none' }}
          >
            Manage Payments
          </a>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mini-stats-row" style={{ marginBottom: '24px' }}>
        <div className="mini-stat-card" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
          <div className="mini-stat-value" style={{ color: '#22c55e' }}>₱{totalCollected.toLocaleString()}</div>
          <div className="mini-stat-label">Total Collected</div>
        </div>
        <div className="mini-stat-card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <div className="mini-stat-value" style={{ color: '#ef4444' }}>₱{totalUnpaid.toLocaleString()}</div>
          <div className="mini-stat-label">Total Unpaid</div>
        </div>
        <div className="mini-stat-card">
          <div className="mini-stat-value" style={{ color: '#22c55e' }}>{paidCount}</div>
          <div className="mini-stat-label">Paid Records</div>
        </div>
        <div className="mini-stat-card">
          <div className="mini-stat-value" style={{ color: '#ef4444' }}>{unpaidCount}</div>
          <div className="mini-stat-label">Unpaid Records</div>
        </div>
        {waivedCount > 0 && (
          <div className="mini-stat-card">
            <div className="mini-stat-value" style={{ color: '#6b7280' }}>{waivedCount}</div>
            <div className="mini-stat-label">Waived</div>
          </div>
        )}
        <div className="mini-stat-card">
          <div className="mini-stat-value">{transactions.length}</div>
          <div className="mini-stat-label">Total Records</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-toolbar">
          {/* Filter chips */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['All', 'Paid', 'Unpaid', 'Waived'].map((s) => (
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
            <div className="search-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                id="payments-search"
                className="search-input"
                placeholder="Search member or reason…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Member</th>
                <th>Reason / Event</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading payments…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No payment or sanction records found
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const status = p.status || 'Unpaid';
                  const s      = PAY_STYLE[status] || PAY_STYLE.Unpaid;
                  return (
                    <tr key={p._id || p.paymentId} className="table-row">
                      <td><code className="id-badge">{p.paymentId || p._id || '—'}</code></td>
                      <td><span className="member-name">{getDisplayMember(p)}</span></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '260px' }}>
                        {getDisplayReason(p)}
                      </td>
                      <td style={{ color: status === 'Unpaid' ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                        ₱{(Number(p.amount) || 0).toLocaleString()}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{getDisplayDate(p)}</td>
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

        <div className="table-footer">
          <span>{filtered.length} of {transactions.length} records</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-refreshes every 30 s</span>
        </div>
      </div>
    </main>
  );
};

export default Payments;
