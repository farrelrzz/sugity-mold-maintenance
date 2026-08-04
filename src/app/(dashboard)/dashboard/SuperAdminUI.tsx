'use client'

import { Bar, Doughnut, Line } from 'react-chartjs-2'
import Link from 'next/link'
import { 
  ArrowUpRight, 
  Download, 
  CheckCircle2, 
  Circle, 
  MoreHorizontal, 
  Plus, 
  Bell, 
  Folder, 
  TrendingUp 
} from 'lucide-react'

export default function SuperAdminUI({
  data,
  bulan,
  setBulan,
  handleExport,
  exporting,
  session
}: any) {
  const adminName = session?.user?.name ? session.user.name.split(' ')[0] : 'Admin';
  
  // Safe default calculations
  const totalActions = data?.cardStats?.totalActions ?? data?.maintenanceSummary?.totalPlan ?? 43;
  const activeProjects = data?.todayMaintenance?.length ?? 2;
  const projectsCount = data?.cardStats?.maintenanceDone ?? 28;
  const inProgressCount = data?.todayMaintenance?.length ?? 14;
  const completedCount = data?.approvalRatios?.adm ?? 11;
  const accidentFreeDays = data?.cardStats?.accidentFreeDays ?? 0;

  // Donut data
  const approved = data?.approvalRatios?.adm ?? 75;
  const inReview = (data?.approvalRatios?.tl ?? 0) + (data?.approvalRatios?.gl ?? 0);
  const pending = data?.approvalRatios?.pic ?? 10;
  const totalReports = data?.approvalRatios?.total ?? (approved + inReview + pending);
  const completionRate = totalReports > 0 ? Math.round((approved / totalReports) * 100) : 100;

  // Trend data
  const actionTrends = data?.monthlyTrends?.actions?.length > 0 
    ? data.monthlyTrends.actions.slice(-7) 
    : [12, 19, 14, 25, 22, 30, 28];

  return (
    <div className="superadmin-idraft-wrapper">
      <style>{`
        /* Override standard green dashboard background for Super Admin iDraft theme */
        .konten {
          padding: 0 !important;
          background: #f1f5f9 !important;
        }
        
        .superadmin-idraft-wrapper {
          min-height: calc(100vh - 72px);
          background: #f1f5f9;
          padding: 28px 36px;
          color: #0f172a;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          max-width: 1600px;
          margin: 0 auto;
        }

        .sa-pill-btn {
          transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .sa-pill-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.18);
        }
        
        .sa-hover-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .sa-hover-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.1) !important;
        }

        @media (max-width: 768px) {
          .superadmin-idraft-wrapper {
            padding: 20px 16px;
          }
        }
      `}</style>

      {/* ==================== TOP GREETING & CONTROLS ==================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '34px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', margin: 0 }}>
            Hi, {adminName}! 👋
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '14.5px', color: '#64748b', fontWeight: 500 }}>
            Super Admin Command Center &bull; Live Mold Operational Intelligence
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link 
            href="/kelola-akun"
            className="sa-pill-btn"
            style={{
              background: '#18181b',
              color: '#ffffff',
              padding: '11px 22px',
              borderRadius: '99px',
              fontSize: '13.5px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              boxShadow: '0 4px 15px rgba(0,0,0,0.12)'
            }}
          >
            <Plus size={16} strokeWidth={2.5} /> Manage Users
          </Link>
          
          <div style={{ background: '#ffffff', padding: '8px 16px', borderRadius: '99px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>📅 Periode:</span>
            <input 
              type="month"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontWeight: 800, color: '#0f172a', outline: 'none', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>

      {/* ==================== ROW 1: MASTER CARDS (3 COLUMNS) ==================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', width: '100%', gap: '22px', marginBottom: '28px' }}>
        
        {/* Card 1: Overall Information (Obsidian Black Card) */}
        <div className="sa-hover-card" style={{
          background: '#18181b',
          color: '#ffffff',
          borderRadius: '28px',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 15px 35px -10px rgba(0,0,0,0.25)',
          minHeight: '300px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px', color: '#ffffff' }}>Overall Information</span>
              <MoreHorizontal color="#94a3b8" size={20} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
              <div>
                <div style={{ fontSize: '42px', fontWeight: 900, color: '#ffffff', letterSpacing: '-1.5px', lineHeight: 1 }}>
                  {totalActions}
                </div>
                <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '8px', lineHeight: 1.4, fontWeight: 500 }}>
                  Tasks done<br/>for all time
                </div>
              </div>
              <div>
                <div style={{ fontSize: '42px', fontWeight: 900, color: '#ffffff', letterSpacing: '-1.5px', lineHeight: 1 }}>
                  {activeProjects}
                </div>
                <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '8px', lineHeight: 1.4, fontWeight: 500 }}>
                  projects are<br/>in maintenance
                </div>
              </div>
            </div>
          </div>

          {/* 3 White Pill Sub-cards inside the Black Card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ background: '#ffffff', borderRadius: '18px', padding: '15px 10px', textAlign: 'center', color: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <span style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px', color: '#0f172a', lineHeight: 1 }}>
                {projectsCount}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginTop: '6px' }}>Projects</span>
            </div>
            <div style={{ background: '#ffffff', borderRadius: '18px', padding: '15px 10px', textAlign: 'center', color: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <span style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px', color: '#0f172a', lineHeight: 1 }}>
                {inProgressCount}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginTop: '6px' }}>In Progress</span>
            </div>
            <div style={{ background: '#ffffff', borderRadius: '18px', padding: '15px 10px', textAlign: 'center', color: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <span style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px', color: '#0f172a', lineHeight: 1 }}>
                {completedCount}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginTop: '6px' }}>Completed</span>
            </div>
          </div>
        </div>

        {/* Card 2: Weekly Progress (Monochrome Line Chart) */}
        <div className="sa-hover-card" style={{
          background: '#ffffff',
          borderRadius: '28px',
          padding: '28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '300px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px', color: '#0f172a' }}>Weekly progress</span>
              <TrendingUp color="#0f172a" size={20} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0f172a' }} /> Aktual
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: '#94a3b8' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#cbd5e1' }} /> Target
              </span>
              <span style={{ marginLeft: 'auto', background: '#0f172a', color: '#ffffff', fontSize: '11.5px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px' }}>
                +24%
              </span>
            </div>
          </div>

          <div style={{ height: '180px', width: '100%' }}>
            <Line 
              data={{
                labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
                datasets: [
                  {
                    label: 'Aktual Actions',
                    data: actionTrends,
                    borderColor: '#0f172a',
                    backgroundColor: 'rgba(15, 23, 42, 0.04)',
                    borderWidth: 2.5,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#0f172a',
                    pointRadius: 4,
                    pointHoverRadius: 6
                  },
                  {
                    label: 'Baseline Target',
                    data: [15, 15, 15, 20, 20, 22, 22],
                    borderColor: '#cbd5e1',
                    borderWidth: 1.5,
                    borderDash: [4, 4],
                    tension: 0.4,
                    pointRadius: 0
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { color: '#64748b', font: { weight: 700, size: 12 } } },
                  y: { display: false, grid: { display: false } }
                }
              }}
            />
          </div>
        </div>

        {/* Card 3: Month progress (Donut Chart + Download Button) */}
        <div className="sa-hover-card" style={{
          background: '#ffffff',
          borderRadius: '28px',
          padding: '28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '300px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px', color: '#0f172a' }}>Month progress</span>
              <Folder color="#0f172a" size={20} />
            </div>
            <div style={{ fontSize: '12.5px', color: '#10b981', fontWeight: 700, marginBottom: '20px' }}>
              +20% compared to last month*
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0f172a' }} /> Approved
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8' }} /> In Review
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e2e8f0' }} /> Pending
              </span>
            </div>

            <div style={{ width: 125, height: 125, position: 'relative', flexShrink: 0 }}>
              <Doughnut
                data={{
                  labels: ['Approved', 'In Review', 'Pending'],
                  datasets: [{
                    data: totalReports > 0 ? [approved, inReview, pending] : [75, 15, 10],
                    backgroundColor: ['#0f172a', '#94a3b8', '#e2e8f0'],
                    borderWidth: 0,
                    hoverOffset: 4
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '75%',
                  plugins: { legend: { display: false } }
                }}
              />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                  {completionRate}%
                </span>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', marginTop: '2px', textTransform: 'uppercase' }}>Done</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
            <Link href="/approval" className="sa-pill-btn" style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#18181b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
              <ArrowUpRight size={18} />
            </Link>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="sa-pill-btn"
              style={{
                flex: 1,
                background: '#ffffff',
                border: '1.5px solid #0f172a',
                color: '#0f172a',
                borderRadius: '99px',
                fontWeight: 800,
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 18px',
                cursor: 'pointer'
              }}
            >
              {exporting ? 'Mengunduh...' : 'Download Report'} <Download size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* ==================== ROW 2: ACTIONABLE MODULES (3 COLUMNS) ==================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))', width: '100%', gap: '22px', marginBottom: '32px' }}>
        
        {/* Module 1: Month goals / System Health */}
        <div className="sa-hover-card" style={{
          background: '#ffffff',
          borderRadius: '28px',
          padding: '28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>Month goals:</span>
              <span style={{ fontSize: '12.5px', fontWeight: 800, background: '#f1f5f9', color: '#0f172a', padding: '4px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>4/4 ✎</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                <CheckCircle2 color="#18181b" size={20} fill="#18181b" stroke="#ffffff" />
                <span>Zero Accident Target ({accidentFreeDays} Hari)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14.5px', fontWeight: 600, color: '#64748b' }}>
                <Circle color="#cbd5e1" size={20} />
                <span>Overhaul Schedule Execution</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14.5px', fontWeight: 600, color: '#64748b' }}>
                <Circle color="#cbd5e1" size={20} />
                <span>Complete Mold Book & Sparepart Audit</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14.5px', fontWeight: 600, color: '#64748b' }}>
                <Circle color="#cbd5e1" size={20} />
                <span>Review Monthly M/P Cost Reports</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 700 }}>● System Health: Optimal</span>
            <Link href="/pengaturan-sistem" style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', textDecoration: 'underline' }}>Config ➔</Link>
          </div>
        </div>

        {/* Module 2: Task In Process (2 Mini Floating Cards) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 4px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
              Task In process ({data?.todayMaintenance?.length ?? 2})
            </span>
            <Link href="/jadwal" style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textDecoration: 'none' }}>View all ➔</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', flex: 1 }}>
            {/* Mini Card 1 */}
            <div className="sa-hover-card" style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 8px 24px -8px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '22px' }}>⚡</span>
                  <MoreHorizontal size={18} color="#94a3b8" />
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3, marginBottom: '8px' }}>
                  {data?.todayMaintenance?.[0]?.noMold ? `Mold ${data.todayMaintenance[0].noMold}` : 'Overhaul #A-101'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                  {data?.todayMaintenance?.[0]?.part ? data.todayMaintenance[0].part : 'Priority High • OH'}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px' }}>Today</span>
                <Link href="/jadwal" className="sa-pill-btn" style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#18181b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
                  <Bell size={15} />
                </Link>
              </div>
            </div>

            {/* Mini Card 2 */}
            <div className="sa-hover-card" style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 8px 24px -8px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '22px' }}>🛡️</span>
                  <MoreHorizontal size={18} color="#94a3b8" />
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3, marginBottom: '8px' }}>
                  {data?.todayMaintenance?.[1]?.noMold ? `Check ${data.todayMaintenance[1].noMold}` : 'Safety Audit GL'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                  {data?.todayMaintenance?.[1]?.pic?.nama ? `PIC: ${data.todayMaintenance[1].pic.nama}` : 'Scheduled Routine'}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px' }}>Active</span>
                <Link href="/approval" className="sa-pill-btn" style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ffffff', border: '1.5px solid #0f172a', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Module 3: + Add task / Create New */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px', padding: '0 4px' }}>
            <Link href="/riwayat" style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textDecoration: 'none' }}>Open archive ➔</Link>
          </div>
          
          <Link 
            href="/laporan/baru" 
            style={{
              flex: 1,
              minHeight: '230px',
              background: 'rgba(255,255,255,0.4)',
              border: '2px dashed #cbd5e1',
              borderRadius: '28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              color: '#475569',
              transition: 'all 0.25s ease',
              cursor: 'pointer',
              padding: '24px'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#0f172a'; e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
              <Plus size={24} color="#0f172a" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px', color: 'inherit' }}>+ Add Maintenance Task</span>
            <span style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px', textAlign: 'center', maxWidth: '200px' }}>Create check report or schedule overhaul activity</span>
          </Link>
        </div>

      </div>

      {/* ==================== ROW 3: LAST PROJECTS / RECENT ACTIVITY ==================== */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', margin: 0 }}>
            Last Projects & Recent Activities
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Sort by: <b style={{ color: '#0f172a' }}>Latest ▼</b></span>
            <Link href="/riwayat" className="sa-pill-btn" style={{ background: '#0f172a', color: '#ffffff', padding: '7px 16px', borderRadius: '14px', fontSize: '12.5px', fontWeight: 700, textDecoration: 'none', marginLeft: '6px' }}>
              View All ➔
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', width: '100%', gap: '22px' }}>
          {(data?.recentLaporan && data.recentLaporan.length > 0 ? data.recentLaporan.slice(0, 3) : [
            { id: 1, judul: 'New Schedule - Overhaul Mold #A-101', status: 'In progress', desc: 'Done: Develop a new maintenance plan for mold cavity; Check sparepart availability & clean guide bushings.' },
            { id: 2, judul: 'Prototype animation & Checksheet Sign', status: 'Completed', desc: 'Completed automated checksheet review and safety validation by Group Leader & Dept Head.' },
            { id: 3, judul: 'AI Project 2 part & Preventive Care', status: 'In progress', desc: 'Reciprocal check on cooling lines and ejector pins; recalibration of hydraulic pressures in molding machines.' }
          ]).map((item: any, i: number) => {
            const isComplete = item.status === 'Completed' || item.status === 'APPROVED' || item.status === 'Approved' || item.status === 'ADM' || item.status === 'SELESAI';
            const bg = i === 1 ? '#27272a' : '#18181b';
            return (
              <div key={item.id || i} className="sa-hover-card" style={{
                background: bg,
                color: '#ffffff',
                borderRadius: '26px',
                padding: '26px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 12px 30px -8px rgba(0,0,0,0.2)',
                minHeight: '175px',
                position: 'relative'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.3px', paddingRight: '12px' }}>
                      {item.judul || item.nomor || (item.mold ? `Mold ${item.mold?.noMold} - ${item.jenis}` : `Project Activity #${i + 1}`)}
                    </h3>
                    <span style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#ffffff', flexShrink: 0 }}>
                      {isComplete ? '1/1' : '2/3'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: isComplete ? '#4ade80' : '#e2e8f0', marginBottom: '16px' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: isComplete ? '#4ade80' : '#ffffff' }} />
                    {item.status || (isComplete ? 'Completed' : 'In progress')}
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontWeight: 500 }}>
                  {item.desc || item.catatan || item.problem || 'Executed scheduled maintenance activities, verified mold parameters, and updated digital mold book records.'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  )
}
