import Link from 'next/link'
import { Bar, Doughnut, Line, Chart as ChartComponent } from 'react-chartjs-2'
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Activity, 
  ShieldCheck, 
  Award, 
  Clock, 
  ArrowUpRight, 
  Wrench, 
  RefreshCw, 
  Layers, 
  Sparkles,
  UserCheck
} from 'lucide-react'

export default function RegularUI({
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
  // YTD Tren Chart
  const ytdChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
    datasets: [
      {
        type: 'bar' as const,
        label: 'Total Cost (Ribu Rp)',
        data: data.monthlyTrends.costs,
        backgroundColor: 'rgba(59, 130, 246, 0.85)',
        borderColor: '#2563eb',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.6,
        yAxisID: 'y1',
      },
      {
        type: 'line' as const,
        label: 'Jumlah Pekerjaan',
        data: data.monthlyTrends.actions,
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        borderWidth: 3,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        fill: false,
        yAxisID: 'y2',
      },
    ],
  }

  const ytdOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top' as const,
        labels: { font: { size: 12, weight: 'bold' as const }, usePointStyle: true, padding: 20 }
      },
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
      y1: {
        type: 'linear' as const,
        position: 'left' as const,
        title: { display: true, text: 'Biaya (Ribu Rp)', font: { size: 11, weight: 'bold' as const }, color: '#64748b' },
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
      },
      y2: {
        type: 'linear' as const,
        position: 'right' as const,
        title: { display: true, text: 'Jumlah Kegiatan', font: { size: 11, weight: 'bold' as const }, color: '#64748b' },
        beginAtZero: true,
        grid: { drawOnChartArea: false },
      },
      x: {
        grid: { display: false }
      }
    },
  }

  // Helper untuk hitung total aktual di planning per shift
  const totalAktualA = data.planningWeekly?.aktualA?.reduce((a: any, b: any) => Number(a) + Number(b), 0) || 0
  const totalAktualB = data.planningWeekly?.aktualB?.reduce((a: any, b: any) => Number(a) + Number(b), 0) || 0
  const totalAktualNon = data.planningWeekly?.aktualNonshift?.reduce((a: any, b: any) => Number(a) + Number(b), 0) || 0

  // Perhitungan tambahan untuk card baru agar grid tidak kosong saat sidebar di-minimize
  const completionRate = (data.cardStats?.totalActions > 0)
    ? Math.round((Number(data.cardStats?.maintenanceDone || 0) / Number(data.cardStats?.totalActions)) * 100)
    : 100
  const inProgressCount = Math.max(0, Number(data.cardStats?.totalActions || 0) - Number(data.cardStats?.maintenanceDone || 0))
  const activeQueueCount = data.todayMaintenance?.length || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '32px', color: '#0f172a' }}>
      <style>{`
        @media (min-width: 1024px) {
          .tv-page-title { font-size: 34px !important; }
          .tv-section-title { font-size: 25px !important; }
          .tv-section-sub { font-size: 15.5px !important; }
          .tv-card-header { font-size: 16px !important; }
          .tv-stat-num { font-size: 42px !important; }
          .tv-cost-num { font-size: 32px !important; }
          .tv-donut-num { font-size: 36px !important; }
          .tv-mold-code { font-size: 32px !important; }
          .tv-part-name { font-size: 20px !important; }
          .tv-pic-label { font-size: 15.5px !important; }
          .tv-btn-action { font-size: 16px !important; padding: 15px 24px !important; }
          .tv-legend { font-size: 14px !important; }
          .tv-chart-title { font-size: 19px !important; }
          .tv-chart-sub { font-size: 14px !important; }
          .tv-list-item { font-size: 15.5px !important; }
          .tv-donut-box { width: 140px !important; height: 140px !important; }
        }
      `}</style>
      
      {/* ==================== ROW 1: HEADER ANALYTICS & FILTER ==================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <h1 className="tv-page-title" style={{ fontSize: '26px', fontWeight: '800', color: 'var(--teks)', margin: 0, letterSpacing: '-0.5px' }}>
            Analytics
          </h1>
          
          {/* Modern Date Pill Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            padding: '6px 14px',
            borderRadius: '24px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}>
            <Calendar size={15} style={{ color: '#64748b' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Periode:</span>
            <input
              type="month"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              style={{ 
                border: 'none', 
                background: 'transparent', 
                fontSize: '13.5px', 
                fontWeight: 700, 
                color: '#0f172a', 
                outline: 'none', 
                cursor: 'pointer',
                fontFamily: 'inherit' 
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            padding: '9px 18px',
            borderRadius: '12px',
            fontSize: '13.5px',
            fontWeight: 700,
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
        >
          <Download size={16} style={{ color: '#2563eb' }} />
          {exporting ? '⏳ Exporting...' : 'Export Laporan Tahunan'}
        </button>
      </div>

      {/* ==================== ROW 1.5: TODAY & WEEKLY ACTIVE SCHEDULES (OPTIMIZED FOR TV / MONITOR) ==================== */}
      <div style={{
        backgroundColor: data.todayMaintenance && data.todayMaintenance.length > 0 ? '#f0fdf4' : '#ffffff',
        border: `1.5px solid ${data.todayMaintenance && data.todayMaintenance.length > 0 ? '#4ade80' : '#e2e8f0'}`,
        borderRadius: '20px',
        padding: '24px',
        boxShadow: data.todayMaintenance && data.todayMaintenance.length > 0 ? '0 10px 30px rgba(74, 222, 128, 0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
              {data.todayMaintenance && data.todayMaintenance.length > 0 ? '🔥' : '✅'}
            </span>
            <div>
              <h2 className="tv-section-title" style={{ margin: 0, color: '#0f172a', fontSize: '20px', fontWeight: 900, letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                JADWAL MAINTENANCE MINGGUAN & URGENT
                {data.todayMaintenance && data.todayMaintenance.length > 0 && (
                  <span style={{ backgroundColor: '#16a34a', color: '#fff', fontSize: '12px', fontWeight: 800, padding: '4px 12px', borderRadius: '20px' }}>
                    {data.todayMaintenance.length} MOLD AKTIF
                  </span>
                )}
              </h2>
              <p className="tv-section-sub" style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13.5px', fontWeight: 600 }}>
                Diurutkan berdasarkan hari terdekat &amp; prioritas kerja (OH diutamakan). Semua member berhak berpartisipasi mengerjakannya.
              </p>
            </div>
          </div>
          <a href="/jadwal" className="tv-btn-action" style={{
            backgroundColor: '#ffffff',
            color: '#16a34a',
            border: '1.5px solid #16a34a',
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '13.5px',
            fontWeight: 800,
            textDecoration: 'none',
            transition: 'all 0.2s',
            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.1)',
            whiteSpace: 'nowrap'
          }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}>
            📅 Kelola Jadwal Mingguan →
          </a>
        </div>

        {(!data.todayMaintenance || data.todayMaintenance.length === 0) ? (
          <div style={{ backgroundColor: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '14px', padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '15px', fontWeight: 600 }}>
            🎉 Tidak ada jadwal maintenance mingguan yang tertunda atau belum selesai. Seluruh mesin dalam kondisi prima!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '18px' }}>
            {data.todayMaintenance.map((m: any) => {
              const isOH = (m.jenis || '').toUpperCase().includes('OH') || (m.jenis || '').toUpperCase().includes('OVERHAUL');
              const status = m.status || 'Belum_Dikerjakan';
              
              let statusBg = '#fee2e2';
              let statusColor = '#991b1b';
              let statusText = 'Belum Dikerjakan 🔴';
              if (status === 'Sedang_Dikerjakan' || status === 'Sedang Dikerjakan') {
                statusBg = '#dbeafe';
                statusColor = '#1e40af';
                statusText = 'Sedang Dikerjakan 🔵';
              } else if (status === 'Proses_Approval' || status === 'Proses Approval') {
                statusBg = '#fef3c7';
                statusColor = '#92400e';
                statusText = 'Proses Approval ⏳';
              }

              return (
                <div key={m.id} style={{
                  backgroundColor: '#ffffff',
                  border: isOH ? '2px solid #fdba74' : '1.5px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isOH ? '0 8px 20px rgba(249, 115, 22, 0.12)' : '0 4px 12px rgba(0,0,0,0.04)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}>
                  {/* Top Bar: Date & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📆 {m.hari ? `${m.hari}, ` : ''}{m.tanggalRencana ? new Date(m.tanggalRencana).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : 'Minggu Ini'}
                    </span>
                    <span style={{ backgroundColor: statusBg, color: statusColor, fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                      {statusText}
                    </span>
                  </div>

                  {/* Center: Mold Info */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span className="tv-mold-code" style={{ fontSize: '24px', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.5px' }}>
                        {m.noMold}
                      </span>
                      {m.factory && m.factory !== '-' && (
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569', backgroundColor: '#e2e8f0', padding: '3px 9px', borderRadius: '6px' }}>
                          {m.factory}
                        </span>
                      )}
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '12.5px',
                        fontWeight: 900,
                        color: '#ffffff',
                        background: isOH ? 'linear-gradient(135deg, #ea580c, #c2410c)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        letterSpacing: '0.5px',
                        boxShadow: isOH ? '0 2px 6px rgba(234, 88, 12, 0.3)' : '0 2px 6px rgba(37, 99, 235, 0.3)'
                      }}>
                        {m.jenis || 'OH'}
                      </span>
                    </div>

                    <div className="tv-part-name" style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', lineHeight: 1.3 }}>
                      {m.part !== '-' ? m.part : 'Part Tidak Diketahui'}
                    </div>
                    <div className="tv-pic-label" style={{ fontSize: '13.5px', color: '#64748b', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      👤 PIC Ditugaskan: <span style={{ color: '#0f172a', fontWeight: 800 }}>{m.pic?.nama || 'Semua PIC'}</span>
                    </div>
                    {m.catatan && (
                      <div style={{ fontSize: '12.5px', color: '#dc2626', backgroundColor: '#fef2f2', padding: '6px 10px', borderRadius: '6px', marginTop: '8px', fontWeight: 600, border: '1px dashed #fecaca' }}>
                        📌 Note: &ldquo;{m.catatan}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Bottom Bar: Action Button */}
                  <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <a
                      href={`/laporan/baru?noMold=${encodeURIComponent(m.noMold)}&jenis=${encodeURIComponent(m.jenis || 'OH MOLD')}&jadwalId=${m.id}`}
                      className="tv-btn-action"
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 800,
                        textDecoration: 'none',
                        boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                        transition: 'all 0.2s',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#15803d'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#16a34a'; e.currentTarget.style.transform = 'none'; }}
                    >
                      🚀 Kerjakan Sekarang ➔
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================== SECTION 1: KEY METRICS GRID ==================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px', marginBottom: '20px' }}>
          
          {/* Card 1: Total Kegiatan */}
          <div className="kartu kartu-glow-biru" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="tv-card-header" style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Total Kegiatan</span>
              <div style={{ width: 34, height: 34, borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <FileText size={17} style={{ color: '#3b82f6' }} />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <h2 className="tv-stat-num" style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>
                {data.cardStats.totalActions}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '12px', color: '#16a34a', fontWeight: 700 }}>
                <span style={{ display: 'flex', alignItems: 'center', background: '#dcfce7', padding: '2px 6px', borderRadius: '12px' }}>
                  <TrendingUp size={13} style={{ marginRight: '2px' }} /> Aktif
                </span>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Bulan berjalan</span>
              </div>
            </div>
          </div>

          {/* Card 2: Maintenance Selesai */}
          <div className="kartu kartu-glow-hijau" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="tv-card-header" style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Maintenance Selesai</span>
              <div style={{ width: 34, height: 34, borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <CheckCircle2 size={17} style={{ color: '#10b981' }} />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <h2 className="tv-stat-num" style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>
                {data.cardStats.maintenanceDone}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
                <span style={{ display: 'flex', alignItems: 'center', background: '#dcfce7', padding: '2px 6px', borderRadius: '12px' }}>
                  100%
                </span>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Full approved ADM</span>
              </div>
            </div>
          </div>

          {/* Card 3: Total Biaya Pemeliharaan */}
          <div className="kartu kartu-glow-oranye" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="tv-card-header" style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Total Biaya</span>
              <div style={{ width: 34, height: 34, borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <DollarSign size={17} style={{ color: '#f59e0b' }} />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <h2 className="tv-cost-num" style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                Rp {data.cardStats.totalCost.toLocaleString('id-ID')}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>●</span> Akumulasi cost maintenance
              </div>
            </div>
          </div>

          {/* Card 4: Pencapaian Target */}
          <div className="kartu kartu-glow-indigo" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="tv-card-header" style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Pencapaian Target</span>
              <div style={{ width: 34, height: 34, borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <Activity size={17} style={{ color: '#6366f1' }} />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <h2 className="tv-stat-num" style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: (data.maintenanceSummary?.achievementPct ?? 0) >= 100 ? '#10b981' : '#6366f1', letterSpacing: '-1px' }}>
                {data.maintenanceSummary?.achievementPct ?? 0}%
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                <span>Target: <b>{data.maintenanceSummary?.totalPlan ?? 0}</b></span> • <span>Aktual: <b>{data.maintenanceSummary?.totalAktual ?? 0}</b></span>
              </div>
            </div>
          </div>
      </div>

      {/* Baris Ke-2: Efisiensi Kerja & Antrean Maintenance (Diperlebar agar mengisi area kosong dengan rapi) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '16px', marginBottom: '20px' }}>
          
          {/* Card 5: Efisiensi Kerja */}
          <div className="kartu kartu-glow-ungu" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="tv-card-header" style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Efisiensi Kerja</span>
              <div style={{ width: 34, height: 34, borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <Award size={17} style={{ color: '#a855f7' }} />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <h2 className="tv-stat-num" style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>
                {completionRate}%
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', background: '#f3e8ff', color: '#7e22ce', padding: '2px 6px', borderRadius: '12px', fontWeight: 700 }}>
                  <Sparkles size={12} style={{ marginRight: '3px' }} /> Optimal
                </span>
                <span>Selesai: <b>{data.cardStats?.maintenanceDone || 0}</b> • Proses: <b>{inProgressCount}</b></span>
              </div>
            </div>
          </div>

          {/* Card 6: Antrean Maintenance */}
          <div className="kartu kartu-glow-cyan" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="tv-card-header" style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Antrean Maintenance</span>
              <div style={{ width: 34, height: 34, borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <Clock size={17} style={{ color: '#06b6d4' }} />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <h2 className="tv-stat-num" style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>
                {activeQueueCount} <span style={{ fontSize: '18px', fontWeight: 700, color: '#94a3b8' }}>Unit</span>
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                {activeQueueCount === 0 ? (
                  <>
                    <span style={{ display: 'flex', alignItems: 'center', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '12px', fontWeight: 700 }}>
                      ✓ All Clear
                    </span>
                    <span>Tidak ada antrean tertunda</span>
                  </>
                ) : (
                  <>
                    <span style={{ display: 'flex', alignItems: 'center', background: '#cffafe', color: '#0e7490', padding: '2px 6px', borderRadius: '12px', fontWeight: 700 }}>
                      ● In Progress
                    </span>
                    <span>Jadwal aktif bersiap</span>
                  </>
                )}
              </div>
            </div>
          </div>

      </div>

      {/* ==================== SECTION 2: COMPACT & MINIMALIST ANALYTICS (2 COLS SIDE-BY-SIDE) ==================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', width: '100%', gap: '18px', marginBottom: '24px' }}>
        
        {/* Card 1: Status Approval (Minimalist & Aesthetic) */}
        <div 
          className="kartu" 
          style={{ 
            margin: 0, 
            padding: '24px', 
            borderRadius: '16px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 15px -1px rgba(0, 0, 0, 0.03)',
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                <span className="tv-card-header" style={{ fontSize: '12.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Status Approval</span>
              </div>
              <h3 className="tv-donut-num" style={{ fontSize: '32px', fontWeight: 800, margin: '0', color: '#0f172a', letterSpacing: '-0.5px' }}>
                {data.approvalRatios.total} <span style={{ fontSize: '15px', fontWeight: 600, color: '#94a3b8', fontStyle: 'normal' }}>Laporan</span>
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'block', fontWeight: 500 }}>Periode: {data.approvalRatios.period}</span>
            </div>

            {/* Donut Ring */}
            <div className="tv-donut-box" style={{ width: 80, height: 80, position: 'relative', flexShrink: 0 }}>
              <Doughnut
                data={{
                  labels: ['PIC/Member', 'TL', 'GL', 'ADM'],
                  datasets: [{
                    data: data.approvalRatios.total > 0 
                      ? [data.approvalRatios.pic, data.approvalRatios.tl, data.approvalRatios.gl, data.approvalRatios.adm] 
                      : [1],
                    backgroundColor: data.approvalRatios.total > 0 ? ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e'] : ['#f1f5f9'],
                    borderWidth: 0,
                    hoverOffset: 4
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '76%',
                  plugins: { legend: { display: false }, tooltip: { enabled: data.approvalRatios.total > 0 } }
                }}
              />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#0f172a', pointerEvents: 'none' }}>
                {data.approvalRatios.total > 0 ? `${Math.round((data.approvalRatios.adm / data.approvalRatios.total) * 100)}%` : '0%'}
              </div>
            </div>
          </div>

          {/* Minimalist 4-Role Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '9px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>PIC/Member</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', background: '#ffffff', padding: '1px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                {data.approvalRatios.pic}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '9px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>TL</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', background: '#ffffff', padding: '1px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                {data.approvalRatios.tl}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '9px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>GL</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', background: '#ffffff', padding: '1px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                {data.approvalRatios.gl}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef2f2', padding: '9px 14px', borderRadius: '10px', border: '1px solid #fee2e2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f43f5e', flexShrink: 0 }} />
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#e11d48' }}>ADM (Final)</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#e11d48', background: '#ffffff', padding: '1px 8px', borderRadius: '6px', border: '1px solid #fecdd3', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                {data.approvalRatios.adm}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Aktual vs Target (Minimalist & Aesthetic) */}
        <div 
          className="kartu" 
          style={{ 
            margin: 0, 
            padding: '24px', 
            borderRadius: '16px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 15px -1px rgba(0, 0, 0, 0.03)',
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
                <span className="tv-card-header" style={{ fontSize: '12.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Aktual vs Target</span>
              </div>
              <h3 className="tv-donut-num" style={{ fontSize: '32px', fontWeight: 800, margin: '0', color: '#0f172a', letterSpacing: '-0.5px' }}>
                {data.planningWeekly.totalAktual} <span style={{ fontSize: '18px', fontWeight: 700, color: '#94a3b8' }}>/ {data.planningWeekly.totalTarget}</span>
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'block', fontWeight: 500 }}>Kumulatif pencapaian bulan ini</span>
            </div>

            {/* Donut Ring */}
            <div className="tv-donut-box" style={{ width: 80, height: 80, position: 'relative', flexShrink: 0 }}>
              <Doughnut
                data={{
                  labels: ['Shift A', 'Shift B', 'Nonshift'],
                  datasets: [{
                    data: (totalAktualA + totalAktualB + totalAktualNon) > 0 
                      ? [totalAktualA, totalAktualB, totalAktualNon] 
                      : [1],
                    backgroundColor: (totalAktualA + totalAktualB + totalAktualNon) > 0 ? ['#3b82f6', '#f59e0b', '#10b981'] : ['#f1f5f9'],
                    borderWidth: 0,
                    hoverOffset: 4
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '76%',
                  plugins: { legend: { display: false }, tooltip: { enabled: (totalAktualA + totalAktualB + totalAktualNon) > 0 } }
                }}
              />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#0f172a', pointerEvents: 'none' }}>
                {data.planningWeekly.totalTarget > 0 ? `${Math.round((data.planningWeekly.totalAktual / data.planningWeekly.totalTarget) * 100)}%` : '0%'}
              </div>
            </div>
          </div>

          {/* Minimalist 3-Shift Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyItems: 'flex-start', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Shift A</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {totalAktualA} <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}>Unit</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyItems: 'flex-start', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Shift B</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {totalAktualB} <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}>Unit</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyItems: 'flex-start', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Nonshift</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {totalAktualNon} <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}>Unit</span>
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ==================== MINIMALIST ROW 3A: CHARTS SIDE-BY-SIDE (1 ROW, NOT STACKED) ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '16px', marginBottom: '16px' }}>
        
        {/* Chart 1: Tren Performa Pemeliharaan YTD */}
        <div className="kartu" style={{ margin: 0, padding: '18px 20px', display: 'flex', flexDirection: 'column', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 className="tv-chart-title" style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>Tren Biaya & Kegiatan YTD</h3>
              <span className="tv-chart-sub" style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>Akumulasi cost vs frekuensi maintenance bulanan</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>
              <span>2026</span>
              <Layers size={13} style={{ color: '#3b82f6' }} />
            </div>
          </div>
          <div style={{ height: '200px', width: '100%' }}>
            <ChartComponent type="bar" data={ytdChartData as any} options={ytdOptions as any} />
          </div>
        </div>

        {/* Chart 2: Grafik Overhaul Mold Harian */}
        <div className="kartu" style={{ margin: 0, padding: '18px 20px', display: 'flex', flexDirection: 'column', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 className="tv-chart-title" style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>Grafik Overhaul Mold Harian</h3>
              <span className="tv-chart-sub" style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>
                Penyelesaian OH Mold full approve ({bulan})
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.href = `/api/dashboard/export-daily-oh?bulan=${bulan}`;
              }}
              style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                color: '#15803d',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#dcfce7'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f0fdf4'}
            >
              📊 Export OH
            </button>
          </div>
          <div style={{ height: '200px', width: '100%' }}>
            <Line
              data={{
                labels: data.dailyOh.map((d: any) => new Date(d.date).getDate().toString()),
                datasets: [
                  {
                    label: 'Total OH Selesai',
                    data: data.dailyOh.map((d: any) => d.count),
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.10)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 3.5,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                  y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#f1f5f9' } },
                  x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } }
                },
              }}
            />
          </div>
        </div>

      </div>

      {/* ==================== MINIMALIST ROW 3B: KPI WIDGETS & RECENT FEED IN 1 COMPACT SECTION ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: '16px', marginBottom: '22px' }}>
        
        {/* LEFT COMPACT KPI WIDGETS (Takes 5 of 12 columns on large screens) */}
        <div className="lg:col-span-5 xl:col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Widget 1: Zero Accident Compact Badge */}
          <Link 
            href="/kalender-safety" 
            style={{ textDecoration: 'none', display: 'flex', flex: 1 }}
            title="Klik untuk membuka Kalender Safety"
          >
            <div 
              className={`kartu ${data.cardStats?.yearlyAccidents > 0 ? 'kartu-glow-merah' : 'kartu-glow-hijau'}`} 
              style={{ 
                margin: 0, 
                padding: '16px 18px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                width: '100%',
                borderRadius: '16px',
                transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                cursor: 'pointer',
                border: data.cardStats?.yearlyAccidents > 0 ? '1px solid #fca5a5' : '1px solid #6ee7b7',
                background: data.cardStats?.yearlyAccidents > 0 ? 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.18)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.02)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ 
                    width: 36, height: 36, borderRadius: '10px', 
                    background: data.cardStats?.yearlyAccidents > 0 ? '#fef2f2' : '#d1fae5', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ShieldCheck size={20} style={{ color: data.cardStats?.yearlyAccidents > 0 ? '#ef4444' : '#059669' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: 700, display: 'block', lineHeight: 1.2 }}>
                      Accident Free Operation
                    </span>
                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: 800 }}>Lihat Detail ↗</span>
                  </div>
                </div>
                <span style={{ 
                  fontSize: '10.5px', fontWeight: 800, 
                  background: data.cardStats?.yearlyAccidents > 0 ? '#fef2f2' : '#ecfdf5', 
                  color: data.cardStats?.yearlyAccidents > 0 ? '#dc2626' : '#047857', 
                  padding: '4px 10px', borderRadius: '20px', 
                  border: data.cardStats?.yearlyAccidents > 0 ? '1px solid #fca5a5' : '1px solid #a7f3d0'
                }}>
                  {data.cardStats?.yearlyAccidents > 0 ? `🔴 ${data.cardStats.yearlyAccidents} INSIDEN` : '🟢 ZERO ACCIDENT'}
                </span>
              </div>
              
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed rgba(0,0,0,0.06)' }}>
                <h3 className="tv-stat-num" style={{ 
                  margin: 0, fontSize: '24px', fontWeight: 900, 
                  color: data.cardStats?.yearlyAccidents > 0 ? '#dc2626' : '#065f46', 
                  letterSpacing: '-0.5px',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '6px'
                }}>
                  <span>{data.cardStats.accidentFreeDays}</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: data.cardStats?.yearlyAccidents > 0 ? '#ef4444' : '#10b981' }}>Hari</span>
                </h3>
              </div>
            </div>
          </Link>

          {/* Widget 2: Top Performer OT Compact Badge */}
          <div className="kartu kartu-glow-oranye" style={{ 
            margin: 0, 
            padding: '16px 18px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between', 
            flex: 1, 
            borderRadius: '16px', 
            background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)', 
            border: '1px solid #fde68a',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Award size={20} style={{ color: '#f59e0b' }} />
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, display: 'block', lineHeight: 1.2 }}>
                    Kontribusi Overtime Teraktif
                  </span>
                  <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 700 }}>
                    🏆 {data.maintenanceSummary?.topPerformer ? `${data.maintenanceSummary.topPerformer.total.toFixed(1)} Jam` : 'Belum ada data'}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '10.5px', fontWeight: 800, background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '20px', border: '1px solid #fde68a' }}>
                TOP OT
              </span>
            </div>

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed rgba(0,0,0,0.06)' }}>
              <h3 className="tv-part-name" style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.3px' }}>
                {data.maintenanceSummary?.topPerformer?.nama || '—'}
              </h3>
            </div>
          </div>

        </div>

        {/* RIGHT COMPACT RECENT ACTIVITY FEED (Takes 7 of 12 columns on large screens) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="kartu" style={{ margin: 0, padding: '18px 20px', height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                <h3 className="tv-chart-title" style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>Pekerjaan Maintenance Terkini</h3>
              </div>
              <a href="/riwayat" style={{ fontSize: '11.5px', color: '#3b82f6', fontWeight: 800, textDecoration: 'none', background: '#eff6ff', padding: '4px 10px', borderRadius: '20px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Lihat Semua <ArrowUpRight size={13} />
              </a>
            </div>

            {/* Compact Minimalist List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '290px', paddingRight: '4px', scrollbarWidth: 'thin' }}>
              {data.recentLaporan.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 14px', color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>
                  Belum ada aktivitas maintenance terbaru terdaftar.
                </div>
              ) : (
                data.recentLaporan.slice(0, 5).map((lap: any) => (
                  <div key={lap.id} className="tv-list-item" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.04)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#f1f5f9';
                  }}
                  >
                    {/* Avatar Icon + Mold & Part info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: '9px',
                        background: lap.jenis === 'OH_MOLD' ? '#fff7ed' : '#f0fdf4',
                        color: lap.jenis === 'OH_MOLD' ? '#ea580c' : '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '11.5px',
                        flexShrink: 0,
                        border: `1px solid ${lap.jenis === 'OH_MOLD' ? '#ffedd5' : '#dcfce7'}`
                      }}>
                        {lap.jenis === 'OH_MOLD' ? 'OH' : lap.jenis === 'BM' ? 'BM' : lap.jenis === 'IM' ? 'IM' : 'M'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Mold {lap.noMold} <span style={{ fontWeight: 500, color: '#64748b', fontSize: '12px' }}>— {lap.part || 'Part -'}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>📍 {lap.factory} ({lap.shift || '-'})</span>
                          <span>•</span>
                          <span>📅 {new Date(lap.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Info: Status & PIC */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: '3px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2.5px 8px',
                        borderRadius: '20px',
                        background: lap.jenis === 'OH_MOLD' ? '#ea580c' : '#10b981',
                        color: '#ffffff',
                        letterSpacing: '0.3px',
                        textTransform: 'uppercase'
                      }}>
                        {lap.jenis === 'OH_MOLD' ? 'OH MOLD' : lap.jenis === 'BM' ? 'B/M' : lap.jenis}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                        👤 {lap.pic?.nama || 'Member'}
                      </span>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </div>

      {/* ==================== ROW 4: OVERTIME PIC & KELOLA TARGET MAINTENANCE ==================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))', gap: '20px', marginTop: '8px' }}>
        
        {/* Akumulasi Jam Lembur */}
        <div className="kartu" style={{ margin: 0, padding: '22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 className="tv-chart-title" style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>⏱️ Akumulasi Jam Lembur Anggota</h3>
              <span className="tv-chart-sub" style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Perbandingan jam lembur plan vs aktual bulan berjalan</span>
            </div>
            <a href="/overtime" style={{ fontSize: '12.5px', color: '#10b981', fontWeight: 700, textDecoration: 'none', background: '#f0fdf4', padding: '6px 12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              Kelola Overtime →
            </a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '10px' }}>
            {(['Nonshift', 'Shift_A', 'Shift_B'] as const).map((shiftKey) => {
              const ot = data.overtime[shiftKey] || { labels: [], plan: [], aktual: [] }
              const shiftLabel = shiftKey === 'Nonshift' ? 'Regu Nonshift' : shiftKey === 'Shift_A' ? 'Regu Shift A' : 'Regu Shift B'
              
              const colorPlan = '#e2e8f0'
              const colorAktual = shiftKey === 'Nonshift' ? '#10b981' : shiftKey === 'Shift_A' ? '#3b82f6' : '#f59e0b'
              
              if (ot.labels.length === 0) return null
              return (
                <div key={shiftKey} style={{ height: '240px', width: '100%' }}>
                  <Bar
                    data={{
                      labels: ot.labels.map((name: string) => name.split(' ')[0]),
                      datasets: [
                        { label: 'Plan (Jam)', data: ot.plan, backgroundColor: colorPlan, borderRadius: 4, barPercentage: 0.7, categoryPercentage: 0.8 },
                        { label: 'Aktual (Jam)', data: ot.aktual, backgroundColor: colorAktual, borderRadius: 4, barPercentage: 0.7, categoryPercentage: 0.8 },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' as const, labels: { font: { size: 11, weight: 'bold' as const }, usePointStyle: true } },
                        title: { display: true, text: shiftLabel, font: { size: 14, weight: 'bold' as const }, color: '#334155', align: 'start' as const },
                        tooltip: { mode: 'index', intersect: false }
                      },
                      scales: { 
                        x: { grid: { display: false }, ticks: { color: '#64748b', font: { weight: 'bold' as const } } },
                        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#64748b' } } 
                      },
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Kelola Target & Planning Bar Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Target vs Aktual Planning Chart */}
          <div className="kartu" style={{ margin: 0, padding: '22px' }}>
            <h3 className="tv-chart-title" style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>📊 Target vs Aktual Maintenance Mingguan</h3>
            <span className="tv-chart-sub" style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
              Target Bulan Ini: <b>{data.planningWeekly.totalTarget} mold</b> | Aktual Selesai: <b>{data.planningWeekly.totalAktual} mold</b>
            </span>
            <div style={{ height: '240px', marginTop: '16px' }}>
              <Bar
                data={{
                  labels: data.planningWeekly.weeks.map((_: any, i: number) => `Week ${i + 1}`),
                  datasets: [
                    { label: 'Target A', data: data.planningWeekly.targetsA, backgroundColor: '#cbd5e1', borderRadius: 4 },
                    { label: 'Aktual A', data: data.planningWeekly.aktualA, backgroundColor: '#3b82f6', borderRadius: 4 },
                    { label: 'Target B', data: data.planningWeekly.targetsB, backgroundColor: '#e2e8f0', borderRadius: 4 },
                    { label: 'Aktual B', data: data.planningWeekly.aktualB, backgroundColor: '#f59e0b', borderRadius: 4 },
                    { label: 'Aktual Nonshift', data: data.planningWeekly.aktualNonshift || data.planningWeekly.aktualB.map(() => 0), backgroundColor: '#10b981', borderRadius: 4 },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' as const, labels: { boxWidth: 12, font: { size: 11, weight: 'bold' as const } } } },
                  scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } },
                }}
              />
            </div>
          </div>

          {/* Dynamic Target Setter Form */}
          <div className="kartu kartu-glow-hijau" style={{ margin: 0, padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: 34, height: 34, borderRadius: '10px', background: '#f0fdf4', border: '1px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={17} style={{ color: '#16a34a' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Kelola Target Maintenance Bulanan</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Periode Bulan Aktif: <b>{bulan}</b></span>
              </div>
            </div>
            <form onSubmit={handleSaveTarget} style={{ marginTop: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Target Shift A (Mold)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={targetA}
                    onChange={(e) => setTargetA(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#0f172a',
                      background: '#f8fafc',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Target Shift B (Mold)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={targetB}
                    onChange={(e) => setTargetB(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#0f172a',
                      background: '#f8fafc',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submittingTarget}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#16a34a',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '14px',
                  border: 'none',
                  cursor: submittingTarget ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                  transition: 'transform 0.2s'
                }}
              >
                {submittingTarget ? '⏳ Menyimpan...' : '💾 Perbarui Target Bulan Ini'}
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  )
}
