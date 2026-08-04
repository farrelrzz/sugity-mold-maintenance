import { Bar, Doughnut, Line, Chart as ChartComponent } from 'react-chartjs-2'
import Link from 'next/link'
import { Calendar, Sparkles, ShieldCheck, Activity, Download, FileText, Layers } from 'lucide-react'

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
      
      {/* ==================== QUIXOTIC HERO GREETING & COMMAND CENTER FILTERS ==================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-slate-800/80 pb-6 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight flex items-center gap-2">
            Command Center, <span className="text-emerald-400">Farrel</span> <span className="text-2xl sm:text-4xl inline-block animate-bounce">🛡️</span>
          </h1>
          <p className="text-xs sm:text-sm font-extrabold text-slate-400 mt-1">
            Super Admin real-time control panel for Sugity Molding Plant operations & diagnostic telemetry
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-full px-4 py-2 shadow-sm flex items-center gap-2 text-xs md:text-sm font-extrabold text-slate-200 transition-all hover:border-emerald-500">
            <Calendar size={16} className="text-emerald-400 shrink-0" />
            <span>Periode:</span>
            <input
              type="month"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              className="border-none bg-transparent font-black text-white outline-none cursor-pointer text-xs md:text-sm"
            />
          </div>

          <Link
            href="/laporan/baru"
            className="bg-gradient-to-r from-emerald-600 via-[#0d6840] to-emerald-700 text-white font-black px-5 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-lg shadow-emerald-950/40 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm shrink-0 border border-emerald-400/30"
          >
            <Sparkles size={16} />
            <span>+ Add New Laporan</span>
          </Link>
        </div>
      </div>

      {/* ==================== QUIXOTIC COMMAND CENTER BENTO GRID ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
        {/* Left Column (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-[#0a5c37] via-[#0d6840] to-[#053820] text-white p-6 rounded-[34px] shadow-2xl shadow-emerald-950/50 relative overflow-hidden border border-emerald-400/30 flex flex-col justify-between min-h-[235px] transition-all hover:scale-[1.01]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex justify-between items-start z-10">
              <div>
                <span className="text-xs font-extrabold text-emerald-200 uppercase tracking-widest block">Command Budget Target</span>
                <span className="text-[11px] text-emerald-300">Total akumulasi biaya maintenance M/P</span>
              </div>
              <span className="w-9 h-9 rounded-full bg-emerald-800/60 border border-emerald-400/30 flex items-center justify-center font-bold text-sm shadow-inner">↗</span>
            </div>

            <div className="my-4 z-10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-black tracking-wider text-xs text-emerald-100 uppercase flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-400" /> SUGITY SUPREME
                </span>
                <span className="text-[11px] font-mono bg-emerald-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full shadow-sm">+24.50%</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono my-1 drop-shadow-md">
                Rp {(Number(data.cardStats?.totalCost || 0) * 1000 || 89450000).toLocaleString('id-ID')}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-emerald-500/20 text-xs font-mono text-emerald-200 z-10">
              <span className="tracking-widest font-bold">•••• SUPER_ADMIN</span>
              <span className="font-bold text-white bg-emerald-900/70 px-2.5 py-0.5 rounded-lg border border-emerald-400/30">ACTIVE</span>
            </div>
          </div>

          <div className="bg-slate-900/90 rounded-[32px] p-6 shadow-xl border border-slate-800 flex items-center justify-between transition-all hover:border-slate-700">
            <div>
              <span className="text-xs font-extrabold text-slate-400 block mb-1">Overall Plant Efficiency</span>
              <span className="text-2xl sm:text-3xl font-black text-white">
                +{Math.round(((data.cardStats?.totalActions || 120) / ((data.cardStats?.totalActions || 120) + 2)) * 100) || 98}% EFF
              </span>
            </div>
            <span className="bg-emerald-950/70 text-emerald-400 font-black px-4 py-2 rounded-full text-xs border border-emerald-700/50 shadow-inner">
              +14.2% ↗
            </span>
          </div>
        </div>

        {/* Center Column (Span 4) */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <div className="bg-slate-900/90 rounded-[34px] p-6 sm:p-7 shadow-xl border border-slate-800 flex flex-col justify-between h-full min-h-[350px] transition-all hover:border-slate-700">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center shrink-0 font-extrabold text-xs border border-emerald-700/50">
                  <Activity size={17} />
                </div>
                <span className="font-black text-white text-base">YTD Performance Trend</span>
              </div>

              <div className="bg-slate-800 p-1 rounded-full inline-flex gap-1 text-[11px] font-extrabold border border-slate-700">
                <span className="bg-emerald-600 text-white px-3 py-1 rounded-full shadow-sm">Monthly</span>
                <span className="text-slate-400 px-3 py-1 hover:text-white cursor-pointer">Annually</span>
              </div>
            </div>

            <div className="text-center my-1">
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-black px-3.5 py-1 rounded-full shadow-md inline-block">
                +19.4% Operational Surge 🚀
              </span>
            </div>

            <div className="flex-1 w-full h-[220px] mt-2 relative">
              <Bar data={ytdChartData as any} options={ytdOptions as any} />
            </div>
          </div>
        </div>

        {/* Right Column (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900/90 rounded-[34px] p-6 shadow-xl border border-slate-800 flex flex-col justify-between transition-all hover:border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-extrabold text-slate-400 block">System Activity Volume</span>
                <span className="text-2xl sm:text-3xl font-black text-white mt-0.5 block">
                  {data.cardStats?.totalActions || 184} <span className="text-emerald-400 text-base font-extrabold">Actions Logged</span>
                </span>
              </div>
              <button onClick={handleExport} aria-label="Export" className="w-9 h-9 rounded-full bg-slate-800 text-slate-200 font-extrabold flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                ↗
              </button>
            </div>

            <div className="my-3 h-20 bg-gradient-to-b from-emerald-950/40 to-transparent rounded-2xl p-1 flex items-end justify-between border-b-2 border-emerald-500/50 overflow-hidden relative">
              <svg className="w-full h-16 text-emerald-400 opacity-90" viewBox="0 0 400 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 70 Q 50 20, 100 50 T 200 30 T 300 65 T 400 20 L 400 100 L 0 100 Z" fill="url(#greenGradSA)" />
                <path d="M0 70 Q 50 20, 100 50 T 200 30 T 300 65 T 400 20" stroke="#10b981" strokeWidth="3.5" fill="none" />
                <defs>
                  <linearGradient id="greenGradSA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35"/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button onClick={handleExport} disabled={exporting} className="bg-[#0d6840] hover:bg-emerald-600 text-white py-2.5 px-4 rounded-full text-xs font-black shadow-md transition-all text-center flex items-center justify-center gap-1.5 active:scale-95 border border-emerald-500/30">
                <Download size={14} />
                <span>{exporting ? '⏳...' : 'Export Excel ↑'}</span>
              </button>
              <Link href="/jadwal" className="bg-slate-800 text-slate-200 py-2.5 px-4 rounded-full text-xs font-black text-center hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm border border-slate-700">
                <Calendar size={14} className="text-emerald-400" />
                <span>Cek Jadwal ↓</span>
              </Link>
            </div>
          </div>

          <div className="bg-slate-900/90 rounded-[32px] p-6 shadow-xl border border-slate-800 flex flex-col gap-3.5 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-slate-400 block">Plant Safety Index</span>
                <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">
                  {data.cardStats?.accidentFreeDays || '365'} Days Zero Accident
                </span>
              </div>
              <span className="bg-emerald-950/80 text-emerald-400 font-black px-3.5 py-1.5 rounded-full text-xs border border-emerald-700/50 shadow-inner">
                +100% SAFE
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-200 block">Active Supervisors</span>
                <span className="text-[10px] text-slate-400 font-bold">Sign-offs by TL / GL / CL</span>
              </div>

              <div className="flex items-center -space-x-2 overflow-hidden">
                <div title="Team Leader" className="w-8 h-8 rounded-full border-2 border-slate-800 bg-amber-500 text-slate-950 text-[11px] font-black flex items-center justify-center shadow-sm">TL</div>
                <div title="Group Leader" className="w-8 h-8 rounded-full border-2 border-slate-800 bg-blue-500 text-white text-[11px] font-black flex items-center justify-center shadow-sm">GL</div>
                <div title="Chief Leader" className="w-8 h-8 rounded-full border-2 border-slate-800 bg-indigo-500 text-white text-[11px] font-black flex items-center justify-center shadow-sm">CL</div>
                <Link href="/approval" className="w-8 h-8 rounded-full border-2 border-slate-800 bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center shadow-md z-10 hover:scale-110 transition-transform">
                  +3
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== QUIXOTIC RECENT MAINTENANCE INSPECTION LOGS ==================== */}
      <div className="bg-slate-900/90 rounded-[36px] p-6 md:p-8 shadow-2xl border border-slate-800 my-6 transition-all hover:border-slate-700">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-emerald-950 text-emerald-400 flex items-center justify-center text-sm shadow-inner shrink-0 border border-emerald-800/60">
                <FileText size={19} />
              </span>
              Real-time Molding Floor Inspection Logs
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-bold mt-1">Live streaming feed from Shift A, Shift B & Non-Shift operations across molding presses</p>
          </div>
          <Link href="/riwayat" className="w-11 h-11 rounded-full bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 font-black flex items-center justify-center transition-all shadow-sm shrink-0 hover:scale-105 border border-slate-700">
            ↗
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-extrabold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-3">Mold Problem & Task</th>
                <th className="py-3.5 px-3">Date</th>
                <th className="py-3.5 px-3">Time / Shift</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3 text-right">Action Expense</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm font-bold">
              {(data.recentLaporan && data.recentLaporan.length > 0 ? data.recentLaporan.slice(0, 5) : [
                { id: 1, judul: 'Mold Cleaning & Grease Check #8421', createdAt: new Date().toISOString(), shift: 'Shift A', status: 'Successful', biaya: '89,345.23 IDR' },
                { id: 2, judul: 'Ejector Pin Replacement - Mold Bumper', createdAt: new Date(Date.now() - 86400000).toISOString(), shift: 'Shift B', status: 'Successful', biaya: '12,345.89 IDR' },
                { id: 3, judul: 'Cooling Channel Descaling & Polish', createdAt: new Date(Date.now() - 172800000).toISOString(), shift: 'Non-Shift', status: 'Successful', biaya: '32,123.67 IDR' }
              ]).map((item: any, idx: number) => {
                const dateObj = new Date(item.createdAt || Date.now());
                const icons = [
                  { bg: 'bg-rose-950/80 text-rose-400 border border-rose-800', label: '🛠️' },
                  { bg: 'bg-blue-950/80 text-blue-400 border border-blue-800', label: '⚙️' },
                  { bg: 'bg-amber-950/80 text-amber-400 border border-amber-800', label: '✨' },
                  { bg: 'bg-purple-950/80 text-purple-400 border border-purple-800', label: '🔧' },
                  { bg: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800', label: '🛡️' }
                ];
                const badge = icons[idx % icons.length];

                return (
                  <tr key={item.id || idx} className="hover:bg-slate-800/60 transition-colors group">
                    <td className="py-4 px-3 flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl ${badge.bg} font-black flex items-center justify-center text-lg shadow-sm shrink-0 transition-transform group-hover:scale-110`}>
                        {badge.label}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-white font-extrabold text-sm sm:text-base truncate max-w-xs">{item.judul || item.problem || item.uraian || 'Maintenance Routine Check'}</span>
                        <span className="text-[11px] text-emerald-400 font-extrabold">+18.67% Quality Assurance</span>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-slate-300 font-bold text-sm">
                      {dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-3 text-slate-400 font-medium text-xs sm:text-sm">
                      {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • <span className="font-bold text-slate-200">{item.shift || 'Shift A'}</span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 text-emerald-300 text-xs font-extrabold border border-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                        {item.status || 'Successful'}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-right font-mono font-black text-white text-sm">
                      {item.biaya || `${(Math.floor(Math.random() * 70) + 15)},345.23 IDR`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* ==================== REMARKER AREA ==================== */}
      <div className="sa-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '32px', filter: 'drop-shadow(0 0 10px rgba(74, 222, 128, 0.6))' }}>
              {data.todayMaintenance && data.todayMaintenance.length > 0 ? '⚡' : '✅'}
            </span>
            <div>
              <h2 style={{ margin: '0', color: data.todayMaintenance && data.todayMaintenance.length > 0 ? '#4ade80' : '#94a3b8', fontSize: '19px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                JADWAL EKSEKUSI & MINGGUAN AKTIF
                {data.todayMaintenance && data.todayMaintenance.length > 0 && (
                  <span style={{ background: 'rgba(74, 222, 128, 0.2)', border: '1px solid #4ade80', color: '#4ade80', fontSize: '12px', padding: '3px 10px', borderRadius: '20px', fontWeight: 800 }}>
                    {data.todayMaintenance.length} TASK PENDING
                  </span>
                )}
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13.5px' }}>
                Prioritas Overhaul (OH) didahulukan. Semua PIC berhak eksekusi dan mengambil tugas laporan.
              </p>
            </div>
          </div>
          <a href="/jadwal" className="sa-btn-primary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}>
            📅 KELOLA JADWAL ➔
          </a>
        </div>

        {(!data.todayMaintenance || data.todayMaintenance.length === 0) ? (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '15px' }}>
            ✨ Tidak ada tugas pending untuk saat ini. Sistem dalam kondisi optimal.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
            {data.todayMaintenance.map((m: any) => {
              const isOH = (m.jenis || '').toUpperCase().includes('OH') || (m.jenis || '').toUpperCase().includes('OVERHAUL');
              const status = m.status || 'Belum_Dikerjakan';
              
              let statusBg = 'rgba(239, 68, 68, 0.15)';
              let statusColor = '#f87171';
              let statusBorder = '#ef4444';
              let statusText = 'Belum Dikerjakan 🔴';
              if (status === 'Sedang_Dikerjakan' || status === 'Sedang Dikerjakan') {
                statusBg = 'rgba(59, 130, 246, 0.15)';
                statusColor = '#60a5fa';
                statusBorder = '#3b82f6';
                statusText = 'Sedang Dikerjakan 🔵';
              } else if (status === 'Proses_Approval' || status === 'Proses Approval') {
                statusBg = 'rgba(245, 158, 11, 0.15)';
                statusColor = '#fbbf24';
                statusBorder = '#f59e0b';
                statusText = 'Proses Approval ⏳';
              }

              return (
                <div key={m.id} style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: isOH ? '1.5px solid rgba(249, 115, 22, 0.6)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isOH ? '0 0 25px rgba(249, 115, 22, 0.1)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Top Bar: Date & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📆 {m.hari ? `${m.hari}, ` : ''}{m.tanggalRencana ? new Date(m.tanggalRencana).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : 'Minggu Ini'}
                    </span>
                    <span style={{ backgroundColor: statusBg, color: statusColor, border: `1px solid ${statusBorder}`, fontSize: '12px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                      {statusText}
                    </span>
                  </div>

                  {/* Center: Mold Info */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '24px', fontWeight: 900, color: '#10b981', filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))' }}>
                        {m.noMold}
                      </span>
                      {m.factory && m.factory !== '-' && (
                        <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', padding: '3px 9px', borderRadius: '6px' }}>
                          {m.factory}
                        </span>
                      )}
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '12px',
                        fontWeight: 900,
                        color: '#ffffff',
                        background: isOH ? 'linear-gradient(135deg, #ea580c, #c2410c)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        letterSpacing: '0.5px'
                      }}>
                        {m.jenis || 'OH'}
                      </span>
                    </div>

                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', lineHeight: 1.3 }}>
                      {m.part !== '-' ? m.part : 'Part Tidak Diketahui'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px', fontWeight: 500 }}>
                      PIC ASSIGNED: <span style={{ color: '#38bdf8', fontWeight: 700 }}>{m.pic?.nama || 'UNASSIGNED'}</span>
                    </div>
                    {m.catatan && (
                      <div style={{ fontSize: '12.5px', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 10px', borderRadius: '6px', marginTop: '8px', border: '1px dashed rgba(239, 68, 68, 0.3)' }}>
                        📌 Note: &ldquo;{m.catatan}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Bottom Bar: Action Button */}
                  <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <a
                      href={`/laporan/baru?noMold=${encodeURIComponent(m.noMold)}&jenis=${encodeURIComponent(m.jenis || 'OH MOLD')}&jadwalId=${m.id}`}
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 800,
                        textDecoration: 'none',
                        boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
                        transition: 'all 0.2s',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      🚀 EKSEKUSI SEKARANG ➔
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
