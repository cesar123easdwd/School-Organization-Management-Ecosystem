import React from 'react';

const BAR_DATA = [
  { label: 'Jul', attendance: 85, events: 3 },
  { label: 'Aug', attendance: 72, events: 5 },
  { label: 'Sep', attendance: 90, events: 4 },
  { label: 'Oct', attendance: 65, events: 6 },
  { label: 'Nov', attendance: 78, events: 2 },
  { label: 'Dec', attendance: 55, events: 1 },
];

const MEMBER_SUMMARY = [
  { course:'BSCS',  count: 2, color:'#7f1416' },
  { course:'BSIT',  count: 2, color:'#06b6d4' },
  { course:'BSECE', count: 2, color:'#5f1011' },
];

const Reports = () => {
  const maxAtt = Math.max(...BAR_DATA.map(d => d.attendance));

  return (
    <main className="page-body fade-in" id="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-desc">Analytics and summaries for your organization</p>
        </div>
        <button className="btn-primary" id="export-report-btn">⬇ Export Report</button>
      </div>

      {/* Summary Row */}
      <div className="mini-stats-row" style={{marginBottom:'28px'}}>
        {[
          { label:'Total Members',   val: 6,    icon:'👥', color:'#7f1416' },
          { label:'Total Events',    val: 5,    icon:'📅', color:'#06b6d4' },
          { label:'Avg Attendance',  val:'75%', icon:'✅', color:'#22c55e' },
          { label:'Collected Fines', val:'₱185',icon:'💰', color:'#f59e0b' },
        ].map(item => (
          <div key={item.label} className="mini-stat-card">
            <div style={{fontSize:'22px', marginBottom:'6px'}}>{item.icon}</div>
            <div className="mini-stat-value" style={{color: item.color}}>{item.val}</div>
            <div className="mini-stat-label">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="reports-grid">

        {/* Attendance Bar Chart */}
        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-title">📊 Monthly Attendance Rate</span>
            <span className="report-card-sub">Last 6 months</span>
          </div>
          <div className="bar-chart">
            {BAR_DATA.map(d => (
              <div key={d.label} className="bar-col">
                <div className="bar-label-top">{d.attendance}%</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: `${(d.attendance/maxAtt)*100}%`, background:'linear-gradient(180deg,#7f1416,#5f1011)' }} />
                </div>
                <div className="bar-label-bottom">{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Members by Course */}
        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-title">🎓 Members by Course</span>
            <span className="report-card-sub">Distribution</span>
          </div>
          <div className="donut-chart-wrap">
            <div className="donut-legend">
              {MEMBER_SUMMARY.map((c, i) => {
                const pct = Math.round((c.count / 6) * 100);
                return (
                  <div key={c.course} className="donut-legend-item">
                    <div className="legend-dot" style={{background: c.color}} />
                    <div className="legend-info">
                      <div className="legend-label">{c.course}</div>
                      <div className="legend-bar-track">
                        <div className="legend-bar-fill" style={{width:`${pct}%`, background: c.color}} />
                      </div>
                    </div>
                    <div className="legend-pct">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Events by Type */}
        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-title">📅 Events by Status</span>
            <span className="report-card-sub">All-time</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'12px',padding:'12px 0'}}>
            {[
              { label:'Upcoming',  val:3, max:5, color:'#7f1416' },
              { label:'Ongoing',   val:1, max:5, color:'#22c55e' },
              { label:'Completed', val:1, max:5, color:'#64748b' },
            ].map(item => (
              <div key={item.label} style={{display:'flex',alignItems:'center',gap:'12px'}}>
                <div style={{width:'80px',fontSize:'12px',color:'var(--text-secondary)'}}>{item.label}</div>
                <div style={{flex:1,background:'rgba(255,255,255,0.05)',borderRadius:'99px',height:'8px'}}>
                  <div style={{width:`${(item.val/item.max)*100}%`,background:item.color,height:'8px',borderRadius:'99px',transition:'width 0.8s ease'}} />
                </div>
                <div style={{width:'20px',fontSize:'13px',fontWeight:700,color:item.color}}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sanctions Summary */}
        <div className="report-card">
          <div className="report-card-header">
            <span className="report-card-title">💰 Sanctions Summary</span>
            <span className="report-card-sub">Collection status</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'14px',padding:'12px 0'}}>
            {[
              { label:'Total Issued',    val:'₱335', color:'var(--text-primary)' },
              { label:'Total Collected', val:'₱185', color:'#22c55e' },
              { label:'Total Pending',   val:'₱150', color:'#ef4444' },
              { label:'Collection Rate', val:'55%',  color:'#f59e0b' },
            ].map(item => (
              <div key={item.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',background:'rgba(255,255,255,0.03)',borderRadius:'8px',border:'1px solid var(--border)'}}>
                <span style={{fontSize:'13px',color:'var(--text-secondary)'}}>{item.label}</span>
                <span style={{fontSize:'16px',fontWeight:700,color:item.color}}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Reports;
