import { Bar, Doughnut, Line, Chart as ChartComponent } from 'react-chartjs-2'

export default function SuperAdminUI({
  data,
  bulan,
  setBulan,
  targetA,
  setTargetA,
  targetB,
  setTargetB,
  submittingTarget,
  handleSaveTarget,
  exporting,
  handleExport
}: any) {
  // Glowy Chart Configuration for Super Admin
  const getDoughnutData = (sudah: number, total: number, warna: string) => {
    const sisa = Math.max(total - sudah, 0)
    const persen = total > 0 ? Math.round((sudah / total) * 100) : 0
    return {
      labels: [`Sudah (${persen}%)`, 'Belum'],
      datasets: [
        {
          data: total > 0 ? [sudah, sisa] : [0, 1],
          backgroundColor: [warna, 'rgba(255,255,255,0.05)'],
          borderColor: [warna, 'transparent'],
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    }
  }

  const doughnutOptions = (title: string, sudah: number, total: number) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { font: { size: 10.5, family: 'Inter' }, color: '#94a3b8', boxWidth: 12 },
      },
      title: {
        display: true,
        text: `${title}: ${sudah}/${total}`,
        font: { size: 13, weight: 'bold' as const, family: 'Inter' },
        color: '#e2e8f0'
      },
    },
  })

  // YTD Tren Chart with Neon Colors
  const ytdChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
    datasets: [
      {
        type: 'bar' as const,
        label: 'Total Cost (Ribu Rp)',
        data: data.monthlyTrends.costs,
        backgroundColor: 'rgba(56, 189, 248, 0.2)', // Neon Blue
        borderColor: '#38bdf8',
        borderWidth: 1,
        yAxisID: 'y1',
        borderRadius: 4,
      },
      {
        type: 'line' as const,
        label: 'Jumlah Pekerjaan',
        data: data.monthlyTrends.actions,
        borderColor: '#a78bfa', // Neon Purple
        backgroundColor: '#a78bfa',
        borderWidth: 3,
        fill: false,
        yAxisID: 'y2',
        tension: 0.4,
        pointBackgroundColor: '#0f172a',
        pointBorderColor: '#a78bfa',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  }

  const ytdOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { color: '#94a3b8' } },
      title: { display: true, text: 'Tren Performa Pemeliharaan Mold YTD', font: { size: 14, weight: 'bold' as const }, color: '#e2e8f0' },
      tooltip: { 
        mode: 'index' as const, 
        intersect: false,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || ''
            if (context.dataset.yAxisID === 'y1') {
              const totalRp = Number(context.raw || 0) * 1000
              return `💰 Total Biaya: Rp ${totalRp.toLocaleString('id-ID')} (Akumulasi M/P + Sparepart)`
            }
            return `🔧 ${label}: ${context.raw} Laporan`
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8' }
      },
      y1: {
        type: 'linear' as const,
        position: 'left' as const,
        title: { display: true, text: 'Biaya (Ribu Rupiah)', color: '#94a3b8' },
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8' }
      },
      y2: {
        type: 'linear' as const,
        position: 'right' as const,
        title: { display: true, text: 'Jumlah Kegiatan', color: '#94a3b8' },
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: { color: '#94a3b8' }
      },
    },
  }

  return (
    <div className="superadmin-theme">
      <style>{`
        /* Override Dashboard Padding and Background */
        .konten {
          padding: 0 !important;
          background: #020617 !important;
        }
        
        .superadmin-theme {
          min-height: calc(100vh - 72px);
          background: radial-gradient(circle at top left, #0f172a 0%, #020617 100%);
          padding: 24px 32px;
          color: #f8fafc;
          font-family: 'Inter', sans-serif;
        }

        .superadmin-theme .sa-title {
          font-size: 24px;
          font-weight: 800;
          background: linear-gradient(to right, #38bdf8, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .superadmin-theme .sa-card {
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.5);
          transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.35s ease, background 0.35s ease;
          position: relative;
        }
        
        .superadmin-theme .sa-card:hover {
          transform: translateY(-8px);
          background: rgba(30, 41, 59, 0.85);
          border-color: rgba(168, 85, 247, 0.65);
          box-shadow: 
            0 24px 48px -10px rgba(0, 0, 0, 0.8),
            0 12px 30px -4px rgba(168, 85, 247, 0.45),
            0 0 40px -6px rgba(56, 189, 248, 0.35),
            0 0 0 1.5px rgba(168, 85, 247, 0.55);
          z-index: 2;
        }

        .superadmin-theme .sa-stat-label {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .superadmin-theme .sa-stat-value {
          margin: 8px 0 0 0;
          font-size: 26px;
          font-weight: 700;
          color: #f8fafc;
          text-shadow: 0 0 20px rgba(255,255,255,0.1);
        }

        .superadmin-theme .sa-btn-primary {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
          box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
        }
        .superadmin-theme .sa-btn-primary:hover { opacity: 0.9; }

        .superadmin-theme .sa-btn-secondary {
          background: rgba(255,255,255,0.05);
          color: #e2e8f0;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .superadmin-theme .sa-btn-secondary:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
        }

        .superadmin-theme .sa-input {
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.1);
          color: #f8fafc;
          padding: 8px 12px;
          border-radius: 8px;
          outline: none;
          color-scheme: dark;
        }
        .superadmin-theme .sa-input:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }

        .superadmin-theme .sa-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }
        .superadmin-theme .sa-table th {
          background: rgba(0,0,0,0.3);
          color: #94a3b8;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          text-align: left;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .superadmin-theme .sa-table td {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 13.5px;
          color: #cbd5e1;
        }
        .superadmin-theme .sa-table tr:hover td {
          background: rgba(255,255,255,0.02);
        }
      `}</style>

      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 className="sa-title">COMMAND CENTER</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#94a3b8' }}>PERIODE ANALISIS:</span>
          <input
            type="month"
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="sa-input"
          />
          <button type="button" className="sa-btn-secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? '⏳ MENGUNDUH...' : '⬇️ EXPORT EXCEL'}
          </button>
        </div>
      </div>

      {/* Maintenance Reminder */}
      <div className="sa-card" style={{
        marginBottom: '24px',
        borderColor: data.todayMaintenance && data.todayMaintenance.length > 0 ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255,255,255,0.08)',
        boxShadow: data.todayMaintenance && data.todayMaintenance.length > 0 ? '0 0 30px rgba(74, 222, 128, 0.05)' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ fontSize: '28px', filter: 'drop-shadow(0 0 10px rgba(74, 222, 128, 0.5))' }}>
            {data.todayMaintenance && data.todayMaintenance.length > 0 ? '⚠️' : '✅'}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 12px 0', color: data.todayMaintenance && data.todayMaintenance.length > 0 ? '#4ade80' : '#94a3b8', fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Jadwal Eksekusi Hari Ini ({new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(!data.todayMaintenance || data.todayMaintenance.length === 0) ? (
                <span style={{ fontSize: '14px', color: '#64748b' }}>Tidak ada tugas pending untuk hari ini. Sistem dalam kondisi optimal.</span>
              ) : (
                data.todayMaintenance.map((m: any) => (
                  <div key={m.id} style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(74, 222, 128, 0.2)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        {m.noMold}
                      </span>
                      {m.factory && m.factory !== '-' && (
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                          {m.factory}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ fontSize: '14.5px', fontWeight: '600', color: '#f8fafc' }}>
                        {m.part !== '-' ? m.part : 'Nama Part Tidak Diketahui'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                        PIC ASSIGNED: <span style={{ color: '#38bdf8' }}>{m.pic?.nama || 'UNASSIGNED'}</span>
                      </div>
                    </div>
                    {m.jenis && (
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', padding: '4px 12px', borderRadius: '20px' }}>
                        {m.jenis}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          {data.todayMaintenance && data.todayMaintenance.length > 0 && (
            <a href="/laporan/baru" className="sa-btn-primary" style={{ textDecoration: 'none' }}>
              EKSEKUSI ➔
            </a>
          )}
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div className="sa-card" style={{ borderTop: '2px solid #38bdf8' }}>
          <div className="sa-stat-label">Total Cost Analysis</div>
          <div className="sa-stat-value" style={{ color: '#38bdf8' }}>Rp {data.cardStats.totalCost.toLocaleString('id-ID')}</div>
        </div>
        <div className="sa-card" style={{ borderTop: '2px solid #a78bfa' }}>
          <div className="sa-stat-label">System Operations</div>
          <div className="sa-stat-value" style={{ color: '#a78bfa' }}>{data.cardStats.totalActions}</div>
        </div>
        <div className="sa-card" style={{ borderTop: '2px solid #34d399' }}>
          <div className="sa-stat-label">Tasks Completed (Approved)</div>
          <div className="sa-stat-value" style={{ color: '#34d399' }}>{data.cardStats.maintenanceDone}</div>
        </div>
        <div className="sa-card" style={{ borderTop: '2px solid #fbbf24' }}>
          <div className="sa-stat-label">Accident Free Days</div>
          <div className="sa-stat-value" style={{ color: '#fbbf24' }}>{data.cardStats.accidentFreeDays}</div>
        </div>
      </div>

      {/* Secondary Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="sa-card">
          <div className="sa-stat-label">Monthly Target</div>
          <div className="sa-stat-value">{data.maintenanceSummary?.totalPlan ?? 0} MOLD</div>
        </div>
        <div className="sa-card">
          <div className="sa-stat-label">Actual Resolved</div>
          <div className="sa-stat-value">{data.maintenanceSummary?.totalAktual ?? 0} MOLD</div>
        </div>
        <div className="sa-card">
          <div className="sa-stat-label">Efficiency Rate</div>
          <div className="sa-stat-value" style={{ color: (data.maintenanceSummary?.achievementPct ?? 0) >= 100 ? '#34d399' : '#f43f5e' }}>
            {data.maintenanceSummary?.achievementPct ?? 0}%
          </div>
        </div>
        <div className="sa-card">
          <div className="sa-stat-label">Top Agent (Overtime)</div>
          <div className="sa-stat-value" style={{ fontSize: '18px', paddingTop: '6px' }}>
            {data.maintenanceSummary?.topPerformer ? `${data.maintenanceSummary.topPerformer.nama} (${data.maintenanceSummary.topPerformer.total.toFixed(1)}h)` : '—'}
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* YTD Trend Chart */}
        <div className="sa-card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ height: '350px' }}>
            <ChartComponent type="bar" data={ytdChartData as any} options={ytdOptions as any} />
          </div>
        </div>

        {/* Weekly Planning Bar Chart */}
        <div className="sa-card">
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#e2e8f0', margin: '0 0 4px 0' }}>TARGET VS ACTUAL TRACKING</h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0' }}>Global Target: {data.planningWeekly.totalTarget} | Global Actual: {data.planningWeekly.totalAktual}</p>
          <div style={{ height: '260px' }}>
            <Bar
              data={{
                labels: data.planningWeekly.weeks.map((_: any, i: number) => `W${i + 1}`),
                datasets: [
                  { label: 'Target A', data: data.planningWeekly.targetsA, backgroundColor: 'rgba(56, 189, 248, 0.2)', borderColor: '#38bdf8', borderWidth: 1 },
                  { label: 'Aktual A', data: data.planningWeekly.aktualA, backgroundColor: '#38bdf8' },
                  { label: 'Target B', data: data.planningWeekly.targetsB, backgroundColor: 'rgba(167, 139, 250, 0.2)', borderColor: '#a78bfa', borderWidth: 1 },
                  { label: 'Aktual B', data: data.planningWeekly.aktualB, backgroundColor: '#a78bfa' },
                  { label: 'Nonshift', data: data.planningWeekly.aktualNonshift || data.planningWeekly.aktualB.map(() => 0), backgroundColor: '#34d399' },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' as const, labels: { color: '#94a3b8' } } },
                scales: { 
                  y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', stepSize: 1 } },
                  x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                },
              }}
            />
          </div>
        </div>

        {/* Target Setter Form */}
        <div className="sa-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#e2e8f0', margin: '0 0 8px 0' }}>SYSTEM TARGET CONFIGURATION</h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            Update global maintenance targets for {bulan}. These parameters dictate system-wide KPIs.
          </p>
          <form onSubmit={handleSaveTarget} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '8px' }}>TARGET SHIFT A</label>
              <input type="number" min="0" value={targetA} onChange={(e) => setTargetA(e.target.value)} className="sa-input" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '8px' }}>TARGET SHIFT B</label>
              <input type="number" min="0" value={targetB} onChange={(e) => setTargetB(e.target.value)} className="sa-input" style={{ width: '100%' }} />
            </div>
            <button type="submit" className="sa-btn-primary" disabled={submittingTarget} style={{ marginTop: 'auto', padding: '12px' }}>
              {submittingTarget ? 'PROCESSING...' : 'OVERRIDE TARGETS'}
            </button>
          </form>
        </div>
      </div>

      {/* Approval Status Ring */}
      <div className="sa-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#e2e8f0', margin: '0 0 4px 0' }}>APPROVAL PIPELINE METRICS</h3>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Period: {data.approvalRatios.period}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginTop: '24px' }}>
          <div style={{ height: '140px' }}><Doughnut data={getDoughnutData(data.approvalRatios.pic, data.approvalRatios.total, '#38bdf8')} options={doughnutOptions('PIC', data.approvalRatios.pic, data.approvalRatios.total)} /></div>
          <div style={{ height: '140px' }}><Doughnut data={getDoughnutData(data.approvalRatios.tl, data.approvalRatios.total, '#818cf8')} options={doughnutOptions('TL', data.approvalRatios.tl, data.approvalRatios.total)} /></div>
          <div style={{ height: '140px' }}><Doughnut data={getDoughnutData(data.approvalRatios.gl, data.approvalRatios.total, '#a78bfa')} options={doughnutOptions('GL', data.approvalRatios.gl, data.approvalRatios.total)} /></div>
          <div style={{ height: '140px' }}><Doughnut data={getDoughnutData(data.approvalRatios.cl, data.approvalRatios.total, '#c084fc')} options={doughnutOptions('CL', data.approvalRatios.cl, data.approvalRatios.total)} /></div>
          <div style={{ height: '140px' }}><Doughnut data={getDoughnutData(data.approvalRatios.adm, data.approvalRatios.total, '#f472b6')} options={doughnutOptions('ADM', data.approvalRatios.adm, data.approvalRatios.total)} /></div>
        </div>
      </div>

      {/* Overtime Analysis & Daily OH */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div className="sa-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#e2e8f0', margin: 0 }}>OVERHAUL LOG METRICS</h3>
            <button className="sa-btn-secondary" onClick={() => { window.location.href = `/api/dashboard/export-daily-oh?bulan=${bulan}` }} style={{ fontSize: '11px', padding: '4px 10px' }}>EXPORT RAW</button>
          </div>
          <div style={{ height: '280px' }}>
            <Line
              data={{
                labels: data.dailyOh.map((d: any) => new Date(d.date).getDate().toString()),
                datasets: [{
                  label: 'Selesai',
                  data: data.dailyOh.map((d: any) => d.count),
                  borderColor: '#34d399',
                  backgroundColor: 'rgba(52, 211, 153, 0.1)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: '#020617',
                  pointBorderColor: '#34d399',
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                  y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', stepSize: 1 } },
                  x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                },
              }}
            />
          </div>
        </div>

        <div className="sa-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#e2e8f0', margin: 0 }}>RESOURCE OVERTIME</h3>
            <a href="/overtime" style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }}>MANAGE OT ➔</a>
          </div>
          <div style={{ height: '280px', overflowY: 'auto', paddingRight: '8px' }}>
            {(['Nonshift', 'Shift_A', 'Shift_B'] as const).map((shiftKey) => {
              const ot = data.overtime[shiftKey] || { labels: [], plan: [], aktual: [] }
              if (ot.labels.length === 0) return null
              return (
                <div key={shiftKey} style={{ height: '200px', width: '100%', marginBottom: '20px' }}>
                  <Bar
                    data={{
                      labels: ot.labels.map((name: string) => name.split(' ')[0]),
                      datasets: [
                        { label: 'Plan', data: ot.plan, backgroundColor: 'rgba(255,255,255,0.1)' },
                        { label: 'Aktual', data: ot.aktual, backgroundColor: shiftKey === 'Nonshift' ? '#34d399' : shiftKey === 'Shift_A' ? '#38bdf8' : '#fbbf24' },
                      ],
                    }}
                    options={{
                      indexAxis: 'y' as const,
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        title: { display: true, text: shiftKey.replace('_', ' '), color: '#94a3b8', font: { size: 12 } }
                      },
                      scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                        y: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                      }
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* System Logs Table */}
      <div className="sa-card">
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#e2e8f0', margin: '0 0 16px 0' }}>RECENT MAINTENANCE LOGS</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="sa-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Asset ID</th>
                <th>Procedure</th>
                <th>Origin</th>
                <th>Component</th>
                <th>Agent</th>
              </tr>
            </thead>
            <tbody>
              {data.recentLaporan.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    NO DATA AVAILABLE IN REGISTRY.
                  </td>
                </tr>
              ) : (
                data.recentLaporan.map((lap: any) => (
                  <tr key={lap.id}>
                    <td style={{ color: '#94a3b8' }}>{new Date(lap.tanggal).toLocaleDateString('id-ID')}</td>
                    <td style={{ color: '#38bdf8', fontWeight: '600' }}>{lap.noMold}</td>
                    <td>
                      <span style={{ 
                        background: lap.jenis === 'OH_MOLD' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255,255,255,0.05)',
                        color: lap.jenis === 'OH_MOLD' ? '#fbbf24' : '#cbd5e1',
                        padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                        border: `1px solid ${lap.jenis === 'OH_MOLD' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255,255,255,0.1)'}`
                      }}>
                        {lap.jenis === 'OH_MOLD' ? 'OVERHAUL' : lap.jenis}
                      </span>
                    </td>
                    <td>{lap.factory} / {lap.shift || '-'}</td>
                    <td>{lap.part || '-'}</td>
                    <td style={{ color: '#a78bfa' }}>{lap.pic.nama}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
