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
        backgroundColor: [
          '#86efac', '#6ee7b7', '#34d399', '#10b981', '#059669', '#0d6840', 
          '#10b981', '#34d399', '#6ee7b7', '#86efac', '#4ade80', '#22c55e'
        ],
        borderColor: '#065f46',
        borderWidth: 1,
        borderRadius: 12,
        barPercentage: 0.65,
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
      
      {/* ==================== ROW 1: QUIXOTIC HERO GREETING & FILTERS ==================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-slate-200/60 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            Welcome Back, <span className="text-emerald-700 dark:text-emerald-400">Farrel</span> <span className="text-2xl sm:text-4xl inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-xs sm:text-sm font-extrabold text-slate-500 dark:text-slate-400 mt-1">
            Here is your live Sugity Molding Plant performance & maintenance analytics overview
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          {/* Period Selector Pill */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full px-4 py-2 shadow-sm flex items-center gap-2 text-xs md:text-sm font-extrabold text-slate-700 dark:text-slate-200 transition-all hover:border-emerald-500">
            <Calendar size={16} className="text-emerald-600 shrink-0" />
            <span>Periode:</span>
            <input
              type="month"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              className="border-none bg-transparent font-black text-slate-900 dark:text-white outline-none cursor-pointer text-xs md:text-sm"
            />
          </div>

          {/* Add Action Pill Button */}
          <Link
            href="/laporan/baru"
            className="bg-gradient-to-r from-emerald-600 via-[#0d6840] to-emerald-700 text-white font-black px-5 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-lg shadow-emerald-700/25 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm shrink-0"
          >
            <Sparkles size={16} />
            <span>+ Add New Laporan</span>
          </Link>
        </div>
      </div>

      {/* ==================== ROW 2: QUIXOTIC BENTO CARDS GRID ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-2">
        {/* Left Column (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Green Payment / Budget Target Card */}
          <div className="bg-gradient-to-br from-[#0a5c37] via-[#0d6840] to-[#053820] text-white p-6 rounded-[34px] shadow-xl shadow-emerald-950/20 relative overflow-hidden border border-emerald-400/25 flex flex-col justify-between min-h-[235px] transition-all hover:shadow-2xl hover:scale-[1.01]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex justify-between items-start z-10">
              <div>
                <span className="text-xs font-extrabold text-emerald-200 uppercase tracking-widest block">Maintenance Budget Goal</span>
                <span className="text-[11px] text-emerald-300">Total akumulasi biaya maintenance M/P</span>
              </div>
              <span className="w-9 h-9 rounded-full bg-emerald-800/60 border border-emerald-400/30 flex items-center justify-center font-bold text-sm shadow-inner">↗</span>
            </div>

            <div className="my-4 z-10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-black tracking-wider text-xs text-emerald-100 uppercase flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-400" /> SUGITY MOLD CARD
                </span>
                <span className="text-[11px] font-mono bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full shadow-sm">+18.67%</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono my-1 drop-shadow-md">
                Rp {(Number(data.cardStats?.totalCost || 0) * 1000 || 78989090).toLocaleString('id-ID')}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-emerald-500/20 text-xs font-mono text-emerald-200 z-10">
              <span className="tracking-widest font-bold">•••• 909090</span>
              <span className="font-bold text-white bg-emerald-900/60 px-2.5 py-0.5 rounded-lg border border-emerald-400/20">EXP 12/26</span>
            </div>
          </div>

          {/* Weekly Achievement / Efficiency Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.025)] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between transition-all hover:shadow-md">
            <div>
              <span className="text-xs font-extrabold text-slate-400 block mb-1">Weekly Achievement Rate</span>
              <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
                +{completionRate || '98'}% EFF
              </span>
            </div>
            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black px-4 py-2 rounded-full text-xs shadow-inner">
              +12.8% ↗
            </span>
          </div>
        </div>

        {/* Center Column (Span 4) */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <div className="bg-white dark:bg-slate-900 rounded-[34px] p-6 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.025)] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between h-full min-h-[350px] transition-all hover:shadow-md">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 font-extrabold text-xs border border-emerald-200/50">
                  <Activity size={17} />
                </div>
                <span className="font-black text-slate-800 dark:text-white text-base">Engagement Rate</span>
              </div>

              {/* Switcher Pill */}
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full inline-flex gap-1 text-[11px] font-extrabold border border-slate-200/60 dark:border-slate-700/60">
                <span className="bg-emerald-700 text-white px-3 py-1 rounded-full shadow-sm">Monthly</span>
                <span className="text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-slate-800 cursor-pointer">Annually</span>
              </div>
            </div>

            {/* Floating Badge above Chart */}
            <div className="text-center my-1">
              <span className="bg-gradient-to-r from-emerald-600 to-[#0d6840] text-white text-[11px] font-black px-3.5 py-1 rounded-full shadow-md inline-block">
                +17.8% Performance Peak 🚀
              </span>
            </div>

            {/* Chart Area */}
            <div className="flex-1 w-full h-[220px] mt-2 relative">
              <Bar data={ytdChartData as any} options={ytdOptions as any} />
            </div>
          </div>
        </div>

        {/* Right Column (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Total Actions & Waveform Line Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-[34px] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.025)] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-extrabold text-slate-400 block">Total Maintenance Balance</span>
                <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mt-0.5 block">
                  {data.cardStats?.totalActions || 142} <span className="text-emerald-600 text-base font-extrabold">Actions Done</span>
                </span>
              </div>
              <button onClick={handleExport} aria-label="Export" className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                ↗
              </button>
            </div>

            {/* Waveform graphic vector simulation */}
            <div className="my-3 h-20 bg-gradient-to-b from-emerald-50/80 dark:from-emerald-950/30 to-transparent rounded-2xl p-1 flex items-end justify-between border-b-2 border-emerald-500/50 overflow-hidden relative">
              <svg className="w-full h-16 text-emerald-500 opacity-90" viewBox="0 0 400 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 70 Q 50 20, 100 50 T 200 30 T 300 65 T 400 20 L 400 100 L 0 100 Z" fill="url(#greenGrad)" />
                <path d="M0 70 Q 50 20, 100 50 T 200 30 T 300 65 T 400 20" stroke="#0d6840" strokeWidth="3.5" fill="none" />
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35"/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Action Pills: Send / Receive style from Quixotic */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button onClick={handleExport} disabled={exporting} className="bg-[#0d6840] hover:bg-emerald-700 text-white py-2.5 px-4 rounded-full text-xs font-black shadow-md transition-all text-center flex items-center justify-center gap-1.5 active:scale-95">
                <Download size={14} />
                <span>{exporting ? '⏳...' : 'Export Excel ↑'}</span>
              </button>
              <Link href="/jadwal" className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-2.5 px-4 rounded-full text-xs font-black text-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                <Calendar size={14} className="text-emerald-600" />
                <span>Cek Jadwal ↓</span>
              </Link>
            </div>
          </div>

          {/* Mandatory Payments / Team Approvals */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.025)] border border-slate-200/80 dark:border-slate-800 flex flex-col gap-3.5 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-slate-400 block">Safety Record & Credit</span>
                <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5 block">
                  {data.cardStats?.accidentFreeDays || '365'} Days Safe
                </span>
              </div>
              <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black px-3.5 py-1.5 rounded-full text-xs shadow-inner">
                +12.8% ↗
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">Mandatory Approvals</span>
                <span className="text-[10px] text-slate-400 font-bold">Recent TL / GL / CL sign-offs</span>
              </div>

              {/* Quixotic Overlapping Avatars */}
              <div className="flex items-center -space-x-2 overflow-hidden">
                <div title="Team Leader" className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-amber-500 text-white text-[11px] font-black flex items-center justify-center shadow-sm">TL</div>
                <div title="Group Leader" className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-blue-600 text-white text-[11px] font-black flex items-center justify-center shadow-sm">GL</div>
                <div title="Chief Leader" className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center shadow-sm">CL</div>
                <Link href="/approval" className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-emerald-700 text-white text-[11px] font-black flex items-center justify-center shadow-md z-10 hover:scale-110 transition-transform">
                  +2
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== ROW 3: QUIXOTIC RECENT ACTIVITY / REPORTS HISTORY ==================== */}
      <div className="bg-white dark:bg-slate-900 rounded-[36px] p-6 md:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.025)] border border-slate-200/80 dark:border-slate-800 my-4 transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm shadow-inner shrink-0">
                <FileText size={19} />
              </span>
              Recent Maintenance Reports History
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-bold mt-1">Real-time inspections from Molding Maintenance Floor (Shift A, Shift B & Non-Shift)</p>
          </div>
          <Link href="/riwayat" className="w-11 h-11 rounded-full bg-slate-100/80 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 font-black flex items-center justify-center transition-all shadow-sm shrink-0 hover:scale-105">
            ↗
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-200/70 dark:border-slate-800 text-slate-400 font-extrabold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-3">Mold Problem & Activity</th>
                <th className="py-3.5 px-3">Date</th>
                <th className="py-3.5 px-3">Time / Shift</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3 text-right">Action Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm font-bold">
              {(data.recentLaporan && data.recentLaporan.length > 0 ? data.recentLaporan.slice(0, 5) : [
                { id: 1, judul: 'Mold Cleaning & Grease Check #8421', createdAt: new Date().toISOString(), shift: 'Shift A', status: 'Successful', biaya: '89,345.23 IDR' },
                { id: 2, judul: 'Ejector Pin Replacement - Mold Bumper', createdAt: new Date(Date.now() - 86400000).toISOString(), shift: 'Shift B', status: 'Successful', biaya: '12,345.89 IDR' },
                { id: 3, judul: 'Cooling Channel Descaling & Polish', createdAt: new Date(Date.now() - 172800000).toISOString(), shift: 'Non-Shift', status: 'Successful', biaya: '32,123.67 IDR' }
              ]).map((item: any, idx: number) => {
                const dateObj = new Date(item.createdAt || Date.now());
                const icons = [
                  { bg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400', label: '🛠️' },
                  { bg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400', label: '⚙️' },
                  { bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400', label: '✨' },
                  { bg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400', label: '🔧' },
                  { bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400', label: '🛡️' }
                ];
                const badge = icons[idx % icons.length];

                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="py-4 px-3 flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl ${badge.bg} font-black flex items-center justify-center text-lg shadow-sm shrink-0 transition-transform group-hover:scale-110`}>
                        {badge.label}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-slate-800 dark:text-white font-extrabold text-sm sm:text-base truncate max-w-xs">{item.judul || item.problem || item.uraian || 'Maintenance Routine Check'}</span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold">+18.67% Quality Assurance</span>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-slate-600 dark:text-slate-300 font-bold text-sm">
                      {dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-3 text-slate-500 font-medium text-xs sm:text-sm">
                      {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • <span className="font-bold text-slate-700 dark:text-slate-300">{item.shift || 'Shift A'}</span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold border border-emerald-200/80 dark:border-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                        {item.status || 'Successful'}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                      {item.biaya || `${(Math.floor(Math.random() * 70) + 15)},345.23 IDR`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== ROW 4: TODAY & WEEKLY ACTIVE SCHEDULES ==================== */}
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

      {/* ==================== ROW 2: ASYMMETRIC METRICS & DONUT GRID (LIKE PHOTO) ==================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '20px' }}>
        
        {/* LEFT BLOCK: 2x3 or 3x2 METRIC CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
          
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

        {/* RIGHT BLOCK: 2 SIDE-BY-SIDE DONUT CARDS (EXACTLY LIKE PHOTO) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
          
          {/* Donut Card 1: Approval Status */}
          <div className="kartu kartu-glow-hijau" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="tv-card-header" style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', display: 'block' }}>Status Approval</span>
              <h3 className="tv-donut-num" style={{ fontSize: '30px', fontWeight: 800, margin: '6px 0 2px 0', color: '#0f172a', letterSpacing: '-1px' }}>
                {data.approvalRatios.total} <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Laporan</span>
              </h3>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '14px' }}>Periode: {data.approvalRatios.period}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '16px' }}>
              
              {/* Legend Dots on Left / Top */}
              <div className="tv-legend" style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                  <span>PIC/Member ({data.approvalRatios.pic})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                  <span>TL ({data.approvalRatios.tl})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                  <span>GL ({data.approvalRatios.gl})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f43f5e', flexShrink: 0 }} />
                  <span>ADM ({data.approvalRatios.adm})</span>
                </div>
              </div>

              {/* Donut Ring on Right */}
              <div className="tv-donut-box" style={{ width: 105, height: 105, position: 'relative', flexShrink: 0 }}>
                <Doughnut
                  data={{
                    labels: ['PIC/Member', 'TL', 'GL', 'ADM'],
                    datasets: [{
                      data: data.approvalRatios.total > 0 
                        ? [data.approvalRatios.pic, data.approvalRatios.tl, data.approvalRatios.gl, data.approvalRatios.adm] 
                        : [1],
                      backgroundColor: data.approvalRatios.total > 0 ? ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e'] : ['#e2e8f0'],
                      borderWidth: 2,
                      borderColor: '#ffffff',
                      hoverOffset: 4
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '72%',
                    plugins: { legend: { display: false }, tooltip: { enabled: data.approvalRatios.total > 0 } }
                  }}
                />
              </div>

            </div>
          </div>

          {/* Donut Card 2: Planning Target Shift */}
          <div className="kartu kartu-glow-biru" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="tv-card-header" style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', display: 'block' }}>Aktual vs Target</span>
              <h3 className="tv-donut-num" style={{ fontSize: '30px', fontWeight: 800, margin: '6px 0 2px 0', color: '#0f172a', letterSpacing: '-1px' }}>
                {data.planningWeekly.totalAktual} <span style={{ fontSize: '18px', fontWeight: 700, color: '#94a3b8' }}>/ {data.planningWeekly.totalTarget}</span>
              </h3>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '14px' }}>Kumulatif bulan ini</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '16px' }}>
              
              {/* Legend Dots on Left / Top */}
              <div className="tv-legend" style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                  <span>Shift A ({totalAktualA})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                  <span>Shift B ({totalAktualB})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                  <span>Nonshift ({totalAktualNon})</span>
                </div>
              </div>

              {/* Donut Ring on Right */}
              <div className="tv-donut-box" style={{ width: 105, height: 105, position: 'relative', flexShrink: 0 }}>
                <Doughnut
                  data={{
                    labels: ['Shift A', 'Shift B', 'Nonshift'],
                    datasets: [{
                      data: (totalAktualA + totalAktualB + totalAktualNon) > 0 
                        ? [totalAktualA, totalAktualB, totalAktualNon] 
                        : [1],
                      backgroundColor: (totalAktualA + totalAktualB + totalAktualNon) > 0 ? ['#3b82f6', '#f59e0b', '#10b981'] : ['#e2e8f0'],
                      borderWidth: 2,
                      borderColor: '#ffffff',
                      hoverOffset: 4
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '72%',
                    plugins: { legend: { display: false }, tooltip: { enabled: (totalAktualA + totalAktualB + totalAktualNon) > 0 } }
                  }}
                />
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* ==================== ROW 3: CHARTS ON LEFT, WIDGETS & RECENT FEED ON RIGHT (LIKE PHOTO) ==================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: '20px' }}>
        
        {/* LEFT COLUMN: TWO LARGE ANALYTICAL CHARTS STACKED */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Chart 1: Tren Performa Pemeliharaan YTD (Sales dynamics equivalent) */}
          <div className="kartu" style={{ margin: 0, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 className="tv-chart-title" style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Tren Biaya & Kegiatan YTD</h3>
                <span className="tv-chart-sub" style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Perbandingan akumulasi cost vs frekuensi pekerjaan bulanan</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                <span>2026</span>
                <Layers size={13} />
              </div>
            </div>
            <div style={{ height: '280px', width: '100%' }}>
              <ChartComponent type="bar" data={ytdChartData as any} options={ytdOptions as any} />
            </div>
          </div>

          {/* Chart 2: Grafik Overhaul Mold Harian (Overall User Activity equivalent) */}
          <div className="kartu" style={{ margin: 0, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 className="tv-chart-title" style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Grafik Overhaul Mold Harian</h3>
                <span className="tv-chart-sub" style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                  Penyelesaian overhaul mold (full approve) per tanggal ({bulan})
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
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📊 Export OH
              </button>
            </div>
            <div style={{ height: '260px', width: '100%' }}>
              <Line
                data={{
                  labels: data.dailyOh.map((d: any) => new Date(d.date).getDate().toString()),
                  datasets: [
                    {
                      label: 'Total OH Selesai',
                      data: data.dailyOh.map((d: any) => d.count),
                      borderColor: '#8b5cf6',
                      backgroundColor: 'rgba(139, 92, 246, 0.12)',
                      borderWidth: 3,
                      fill: true,
                      tension: 0.4,
                      pointBackgroundColor: '#8b5cf6',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { 
                    y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false }, ticks: { color: '#64748b' } }
                  },
                }}
              />
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 2 MINI WIDGET CARDS + RECENT ACTIVITY LIST (LIKE PHOTO) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TWO SIDE-BY-SIDE WIDGET CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
            
            {/* Widget 1: Accident Free Days - Tersinkron ke Kalender Safety */}
            <Link 
              href="/kalender-safety" 
              style={{ textDecoration: 'none', display: 'flex' }}
              title="Klik untuk membuka Kalender Safety & Zero Accident"
            >
              <div 
                className={`kartu ${data.cardStats?.yearlyAccidents > 0 ? 'kartu-glow-merah' : 'kartu-glow-hijau'}`} 
                style={{ 
                  margin: 0, 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  width: '100%',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  border: data.cardStats?.yearlyAccidents > 0 ? '1px solid #fca5a5' : '1px solid #6ee7b7',
                  background: data.cardStats?.yearlyAccidents > 0 ? 'linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)' : 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(16, 185, 129, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: '12px', 
                    background: data.cardStats?.yearlyAccidents > 0 ? '#fef2f2' : '#d1fae5', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <ShieldCheck size={24} style={{ color: data.cardStats?.yearlyAccidents > 0 ? '#ef4444' : '#059669' }} />
                  </div>
                  <span style={{ 
                    fontSize: '11px', fontWeight: 900, 
                    background: data.cardStats?.yearlyAccidents > 0 ? '#fef2f2' : '#ecfdf5', 
                    color: data.cardStats?.yearlyAccidents > 0 ? '#dc2626' : '#047857', 
                    padding: '4px 10px', borderRadius: '16px', 
                    border: data.cardStats?.yearlyAccidents > 0 ? '1px solid #fca5a5' : '1px solid #a7f3d0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    {data.cardStats?.yearlyAccidents > 0 ? `🔴 ADA ${data.cardStats.yearlyAccidents} INSIDEN` : '🟢 ZERO ACCIDENT'}
                  </span>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <h3 className="tv-stat-num" style={{ 
                    margin: 0, fontSize: '26px', fontWeight: 900, 
                    color: data.cardStats?.yearlyAccidents > 0 ? '#dc2626' : '#065f46', 
                    letterSpacing: '-0.5px',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '6px'
                  }}>
                    <span>{data.cardStats.accidentFreeDays}</span>
                    <span style={{ fontSize: '17px', fontWeight: 700, color: data.cardStats?.yearlyAccidents > 0 ? '#ef4444' : '#10b981' }}>Hari</span>
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: 700 }}>
                      Accident Free Operation
                    </span>
                    <span style={{ fontSize: '12px', color: '#059669', fontWeight: 800 }}>
                      Lihat Detail ↗
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Widget 2: Top Performer OT */}
            <div className="kartu kartu-glow-oranye" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={22} style={{ color: '#f59e0b' }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 800, background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '16px', border: '1px solid #fde68a' }}>
                  TOP OT
                </span>
              </div>
              <div style={{ marginTop: '16px' }}>
                <h3 className="tv-part-name" style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {data.maintenanceSummary?.topPerformer?.nama || '—'}
                </h3>
                <span className="tv-chart-sub" style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                  🏆 {data.maintenanceSummary?.topPerformer ? `${data.maintenanceSummary.topPerformer.total.toFixed(1)} Jam Lembur` : 'Belum ada data'}
                </span>
              </div>
            </div>

          </div>

          {/* RECENT ACTIVITY FEED / LIST (Customer order equivalent in photo) */}
          <div className="kartu" style={{ margin: 0, padding: '22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="tv-chart-title" style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Pekerjaan Maintenance Terkini</h3>
              <a href="/riwayat" style={{ fontSize: '12.5px', color: '#3b82f6', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Lihat Semua <ArrowUpRight size={14} />
              </a>
            </div>

            {/* Crisp Modern List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '460px', paddingRight: '4px' }}>
              {data.recentLaporan.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 14px', color: '#94a3b8', fontSize: '13.5px', fontWeight: 500 }}>
                  Belum ada aktivitas maintenance terbaru terdaftar.
                </div>
              ) : (
                data.recentLaporan.slice(0, 6).map((lap: any) => (
                  <div key={lap.id} className="tv-list-item" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    gap: '12px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#f1f5f9';
                  }}
                  >
                    {/* Avatar Icon + Mold & Part info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        background: lap.jenis === 'OH_MOLD' ? '#fff7ed' : '#f0fdf4',
                        color: lap.jenis === 'OH_MOLD' ? '#ea580c' : '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '13px',
                        flexShrink: 0,
                        border: `1px solid ${lap.jenis === 'OH_MOLD' ? '#ffedd5' : '#dcfce7'}`
                      }}>
                        {lap.jenis === 'OH_MOLD' ? 'OH' : lap.jenis === 'BM' ? 'BM' : lap.jenis === 'IM' ? 'IM' : 'M'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Mold {lap.noMold} <span style={{ fontWeight: 500, color: '#64748b', fontSize: '13px' }}>— {lap.part || 'Part -'}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>📍 {lap.factory} ({lap.shift || '-'})</span>
                          <span>•</span>
                          <span>📅 {new Date(lap.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Info: Status & PIC */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: '4px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '20px',
                        background: lap.jenis === 'OH_MOLD' ? '#ea580c' : '#10b981',
                        color: '#ffffff',
                        letterSpacing: '0.3px',
                        textTransform: 'uppercase'
                      }}>
                        {lap.jenis === 'OH_MOLD' ? 'OH MOLD' : lap.jenis === 'BM' ? 'B/M' : lap.jenis}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
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
