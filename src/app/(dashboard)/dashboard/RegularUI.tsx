'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
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
  UserCheck,
  Plus,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

// Quixotic role theme palettes
const ROLE_THEMES: Record<string, {
  name: string;
  primary: string;
  dark: string;
  light: string;
  badgeBg: string;
  badgeText: string;
  border: string;
  gradient: string;
  cardGrad: string;
  accent: string;
  glow: string;
  barBg: string;
  chartBorder: string;
}> = {
  ADM: {
    name: 'Admin Department • Section Head',
    primary: '#2563eb',
    dark: '#1e3a8a',
    light: '#eff6ff',
    badgeBg: '#dbeafe',
    badgeText: '#1d4ed8',
    border: '#bfdbfe',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    cardGrad: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
    accent: '#3b82f6',
    glow: 'rgba(37, 99, 235, 0.18)',
    barBg: 'rgba(59, 130, 246, 0.45)',
    chartBorder: '#2563eb'
  },
  GL: {
    name: 'Group Leader • Operational Command',
    primary: '#059669',
    dark: '#064e3b',
    light: '#ecfdf5',
    badgeBg: '#d1fae5',
    badgeText: '#047857',
    border: '#a7f3d0',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    cardGrad: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    accent: '#10b981',
    glow: 'rgba(16, 185, 129, 0.18)',
    barBg: 'rgba(16, 185, 129, 0.45)',
    chartBorder: '#10b981'
  },
  CL: {
    name: 'Chief Leader • Floor Supervision',
    primary: '#0284c7',
    dark: '#082f49',
    light: '#f0f9ff',
    badgeBg: '#e0f2fe',
    badgeText: '#0369a1',
    border: '#bae6fd',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    cardGrad: 'linear-gradient(135deg, #075985 0%, #0284c7 100%)',
    accent: '#38bdf8',
    glow: 'rgba(2, 132, 199, 0.18)',
    barBg: 'rgba(14, 165, 233, 0.45)',
    chartBorder: '#0284c7'
  },
  TL: {
    name: 'Team Leader • Mold Specialist',
    primary: '#7c3aed',
    dark: '#4c1d95',
    light: '#f5f3ff',
    badgeBg: '#ede9fe',
    badgeText: '#6d28d9',
    border: '#ddd6fe',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    cardGrad: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
    accent: '#a78bfa',
    glow: 'rgba(124, 58, 237, 0.18)',
    barBg: 'rgba(139, 92, 246, 0.45)',
    chartBorder: '#7c3aed'
  },
  PIC: {
    name: 'Technician Engineer • PIC',
    primary: '#ea580c',
    dark: '#7c2d12',
    light: '#fff7ed',
    badgeBg: '#ffedd5',
    badgeText: '#c2410c',
    border: '#fed7aa',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    cardGrad: 'linear-gradient(135deg, #9a3412 0%, #f97316 100%)',
    accent: '#fb923c',
    glow: 'rgba(234, 88, 12, 0.18)',
    barBg: 'rgba(249, 115, 22, 0.45)',
    chartBorder: '#ea580c'
  },
  MEMBER: {
    name: 'Sugity Member • Operator',
    primary: '#ea580c',
    dark: '#7c2d12',
    light: '#fff7ed',
    badgeBg: '#ffedd5',
    badgeText: '#c2410c',
    border: '#fed7aa',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    cardGrad: 'linear-gradient(135deg, #9a3412 0%, #f97316 100%)',
    accent: '#fb923c',
    glow: 'rgba(234, 88, 12, 0.18)',
    barBg: 'rgba(249, 115, 22, 0.45)',
    chartBorder: '#ea580c'
  }
};

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
  handleExport,
  session
}: any) {
  const userRole = (session?.user?.role || 'MEMBER').toUpperCase();
  const userName = session?.user?.name ? session.user.name.split(' ')[0] : 'Engineer';
  const theme = ROLE_THEMES[userRole] || ROLE_THEMES.MEMBER;
  const [chartTab, setChartTab] = useState<'Monthly' | 'Annually'>('Monthly');

  // Safe KPI calculations
  const totalCost = Number(data?.cardStats?.totalCost || 0);
  const totalActions = Number(data?.cardStats?.totalActions || 0);
  const maintenanceDone = Number(data?.cardStats?.maintenanceDone || 0);
  const accidentFreeDays = Number(data?.cardStats?.accidentFreeDays || 0);
  const completionRate = totalActions > 0 ? Math.round((maintenanceDone / totalActions) * 100) : 100;
  const urgentCount = data?.todayMaintenance?.length || 0;

  // Monthly trends chart data configured for Quixotic visual style
  const barChartLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'];
  const rawActions = data?.monthlyTrends?.actions || [12, 18, 25, 32, 28, 30];
  const displayActions = rawActions.slice(-6);

  // Identify highest bar index for Quixotic green bubble tag simulation
  const maxActionVal = Math.max(...displayActions, 1);
  const maxIdx = displayActions.indexOf(maxActionVal);

  // Line chart data for balance trend
  const lineChartData = {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
    datasets: [{
      label: 'Achievement Score',
      data: [65, 82, 74, 95, 88, 98],
      borderColor: theme.primary,
      backgroundColor: theme.glow,
      borderWidth: 3,
      tension: 0.4,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 5
    }]
  };

  return (
    <div className="quixotic-regular-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '40px', color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        /* Override base dashboard styles for Quixotic theme */
        .konten {
          background: #f8fafc !important;
        }
        
        .qx-card {
          background: #ffffff;
          border-radius: 28px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
          padding: 26px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .qx-card:hover {
          box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.08);
        }

        .qx-pill-btn {
          transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .qx-pill-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
        }

        @media (min-width: 1024px) {
          .tv-section-title { font-size: 26px !important; }
          .tv-mold-code { font-size: 32px !important; }
          .tv-part-name { font-size: 20px !important; }
          .tv-pic-label { font-size: 15.5px !important; }
          .tv-btn-action { font-size: 16px !important; padding: 14px 24px !important; }
        }
      `}</style>
      
      {/* ==================== WELCOME HEADER & CONTROLS ==================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.8px' }}>
              Welcome Back, {userName}
            </h1>
            <span style={{ 
              backgroundColor: theme.badgeBg, 
              color: theme.badgeText, 
              border: `1px solid ${theme.border}`,
              fontSize: '11.5px', 
              fontWeight: 800, 
              padding: '4px 12px', 
              borderRadius: '99px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {theme.name}
            </span>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
            Sugity Mold Maintenance &bull; Real-time Technical Command Dashboard
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Date Picker Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            padding: '8px 16px',
            borderRadius: '99px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <Calendar size={16} style={{ color: '#64748b' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Period:</span>
            <input
              type="month"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              style={{ 
                border: 'none', 
                background: 'transparent', 
                fontSize: '13.5px', 
                fontWeight: 800, 
                color: '#0f172a', 
                outline: 'none', 
                cursor: 'pointer',
                fontFamily: 'inherit' 
              }}
            />
          </div>

          <Link
            href="/laporan/baru"
            className="qx-pill-btn"
            style={{
              background: theme.gradient,
              color: '#ffffff',
              padding: '10px 22px',
              borderRadius: '99px',
              fontSize: '14px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              boxShadow: `0 6px 20px -4px ${theme.primary}66`
            }}
          >
            <Plus size={18} strokeWidth={2.5} /> Add New Laporan
          </Link>
        </div>
      </div>

      {/* ==================== CRITICAL SECTION 0: MOST VISIBLE REMINDER AT TOP ==================== */}
      <div style={{
        backgroundColor: urgentCount > 0 ? theme.light : '#ffffff',
        border: `2px solid ${urgentCount > 0 ? theme.primary : '#cbd5e1'}`,
        borderRadius: '28px',
        padding: '28px',
        boxShadow: urgentCount > 0 ? `0 15px 40px -10px ${theme.glow}` : '0 4px 15px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow Accent Header Ribbon */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: urgentCount > 0 ? theme.gradient : '#e2e8f0' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))' }}>
              {urgentCount > 0 ? '🔥' : '✅'}
            </span>
            <div>
              <h2 className="tv-section-title" style={{ margin: 0, color: '#0f172a', fontSize: '22px', fontWeight: 950, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                JADWAL MAINTENANCE MINGGUAN &amp; URGENT
                {urgentCount > 0 && (
                  <span style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '12px', fontWeight: 900, padding: '4px 12px', borderRadius: '99px', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)' }}>
                    {urgentCount} MOLD WAITING ACTION
                  </span>
                )}
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
                ⚠️ <b>REMINDER PRIORITAS:</b> Diurutkan berdasarkan hari terdekat &amp; urgensi (Overhaul diutamakan). Segera selesaikan sebelum tenggaraktu!
              </p>
            </div>
          </div>
          
          <Link href="/jadwal" className="qx-pill-btn tv-btn-action" style={{
            backgroundColor: '#ffffff',
            color: theme.primary,
            border: `2px solid ${theme.primary}`,
            padding: '11px 22px',
            borderRadius: '99px',
            fontSize: '13.5px',
            fontWeight: 800,
            textDecoration: 'none',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            whiteSpace: 'nowrap'
          }}>
            📅 Kelola Jadwal Mingguan →
          </Link>
        </div>

        {(!data.todayMaintenance || data.todayMaintenance.length === 0) ? (
          <div style={{ backgroundColor: '#ffffff', border: '2px dashed #cbd5e1', borderRadius: '20px', padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '15.5px', fontWeight: 700 }}>
            🎉 Tidak ada jadwal maintenance mingguan yang tertunda atau urgent saat ini. Seluruh mold dalam performa maksimal!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '20px' }}>
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
                  border: isOH ? '2.5px solid #f97316' : `1.5px solid ${theme.border}`,
                  borderRadius: '24px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isOH ? '0 10px 25px rgba(249, 115, 22, 0.12)' : '0 6px 18px rgba(0,0,0,0.04)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}>
                  {/* Top Bar: Date & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📆 {m.hari ? `${m.hari}, ` : ''}{m.tanggalRencana ? new Date(m.tanggalRencana).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : 'Minggu Ini'}
                    </span>
                    <span style={{ backgroundColor: statusBg, color: statusColor, fontSize: '12px', fontWeight: 800, padding: '4px 12px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                      {statusText}
                    </span>
                  </div>

                  {/* Center: Mold Info */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span className="tv-mold-code" style={{ fontSize: '26px', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.5px' }}>
                        {m.noMold}
                      </span>
                      {m.factory && m.factory !== '-' && (
                        <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#475569', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          {m.factory}
                        </span>
                      )}
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '12px',
                        fontWeight: 900,
                        color: '#ffffff',
                        background: isOH ? 'linear-gradient(135deg, #ea580c, #c2410c)' : theme.gradient,
                        padding: '5px 14px',
                        borderRadius: '99px',
                        letterSpacing: '0.5px',
                        boxShadow: isOH ? '0 4px 10px rgba(234, 88, 12, 0.3)' : `0 4px 10px ${theme.primary}40`
                      }}>
                        {m.jenis || 'OH'}
                      </span>
                    </div>

                    <div className="tv-part-name" style={{ fontSize: '17px', fontWeight: 850, color: '#1e293b', lineHeight: 1.3 }}>
                      {m.part !== '-' ? m.part : 'Part Tidak Diketahui'}
                    </div>
                    <div className="tv-pic-label" style={{ fontSize: '14px', color: '#64748b', marginTop: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      👤 Ditugaskan: <span style={{ color: '#0f172a', fontWeight: 800 }}>{m.pic?.nama || 'Semua Member & PIC'}</span>
                    </div>
                    {m.catatan && (
                      <div style={{ fontSize: '13px', color: '#dc2626', backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '10px', marginTop: '12px', fontWeight: 700, border: '1px dashed #fecaca' }}>
                        📌 Note: &ldquo;{m.catatan}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Bottom Bar: Action Button */}
                  <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                    <Link
                      href={`/laporan/baru?noMold=${encodeURIComponent(m.noMold)}&jenis=${encodeURIComponent(m.jenis || 'OH MOLD')}&jadwalId=${m.id}`}
                      className="qx-pill-btn tv-btn-action"
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        background: isOH ? 'linear-gradient(135deg, #ea580c, #c2410c)' : theme.gradient,
                        color: '#ffffff',
                        padding: '13px 20px',
                        borderRadius: '99px',
                        fontSize: '14.5px',
                        fontWeight: 850,
                        textDecoration: 'none',
                        boxShadow: isOH ? '0 6px 16px rgba(234, 88, 12, 0.3)' : `0 6px 16px ${theme.primary}40`,
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      🚀 Kerjakan Sekarang ➔
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================== QUIXOTIC ROW 1: THE 3 MASTER WIDGETS ==================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))', gap: '24px' }}>
        
        {/* Card 1: Digital Mold Badge (VISA Card Replica) */}
        <div className="qx-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 850, color: '#0f172a', margin: 0 }}>Operational Goal</h3>
                <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>Maintenance value goal</span>
              </div>
              <button title="View Details" style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#0f172a' }}>
                <ArrowUpRight size={18} />
              </button>
            </div>

            {/* Simulated Credit Card Badge */}
            <div style={{
              background: theme.cardGrad,
              borderRadius: '22px',
              padding: '24px',
              color: '#ffffff',
              boxShadow: `0 12px 30px -8px ${theme.primary}88`,
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              {/* Decorative circle glow in card */}
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                <span style={{ fontSize: '16px', fontWeight: 950, letterSpacing: '1px' }}>SUGITY {userRole}</span>
                <span style={{ fontSize: '20px', fontWeight: 800, opacity: 0.8 }}>)))</span>
              </div>
              
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: 600, textTransform: 'uppercase' }}>
                Estimated Maintenance Value
              </div>
              <div style={{ fontSize: '28px', fontWeight: 950, letterSpacing: '-0.5px', margin: '4px 0 24px 0' }}>
                Rp {(totalCost * 1000 || 78989000).toLocaleString('id-ID')}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', fontFamily: 'monospace', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                <span>•••• {userRole === 'ADM' ? '909090' : '482910'}</span>
                <span>EXP 12/28</span>
              </div>
            </div>
          </div>

          {/* Stat Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'block' }}>Weekly Maintenance</span>
              <span style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>+{totalActions} Laporan</span>
            </div>
            <span style={{ background: '#10b981', color: '#ffffff', padding: '6px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: 800, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>
              +12.8%
            </span>
          </div>
        </div>

        {/* Card 2: Engagement Rate Bar Chart (Quixotic Center Piece) */}
        <div className="qx-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={19} style={{ color: theme.primary }} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 850, color: '#0f172a', margin: 0 }}>Engagement Rate</h3>
              </div>

              {/* Pill Tabs */}
              <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '99px', border: '1px solid #e2e8f0', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setChartTab('Monthly')}
                  style={{
                    background: chartTab === 'Monthly' ? theme.primary : 'transparent',
                    color: chartTab === 'Monthly' ? '#ffffff' : '#64748b',
                    border: 'none',
                    padding: '5px 14px',
                    borderRadius: '99px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: chartTab === 'Monthly' ? `0 2px 8px ${theme.primary}66` : 'none'
                  }}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setChartTab('Annually')}
                  style={{
                    background: chartTab === 'Annually' ? theme.primary : 'transparent',
                    color: chartTab === 'Annually' ? '#ffffff' : '#64748b',
                    border: 'none',
                    padding: '5px 14px',
                    borderRadius: '99px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: chartTab === 'Annually' ? `0 2px 8px ${theme.primary}66` : 'none'
                  }}
                >
                  Annually
                </button>
              </div>
            </div>
          </div>

          {/* Quixotic Bubble Tag above max bar */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 -8px 0', position: 'relative', zIndex: 10 }}>
            <span style={{
              background: '#10b981',
              color: '#ffffff',
              fontSize: '11.5px',
              fontWeight: 850,
              padding: '3px 10px',
              borderRadius: '99px',
              boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
            }}>
              +17.8% &bull; Peak Performance
            </span>
          </div>

          <div style={{ height: '220px', width: '100%', marginTop: '10px' }}>
            <Bar
              data={{
                labels: barChartLabels,
                datasets: [{
                  label: 'Actions Completed',
                  data: displayActions,
                  backgroundColor: displayActions.map((v: any, idx: number) => idx === maxIdx ? theme.primary : theme.barBg),
                  hoverBackgroundColor: theme.primary,
                  borderRadius: 20,
                  borderSkipped: false,
                  barPercentage: 0.65
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { weight: 700, size: 12 }, color: '#64748b' } },
                  y: { display: false, grid: { display: false }, beginAtZero: true }
                }
              }}
            />
          </div>
        </div>

        {/* Card 3: Achievement Score & Balance Line Chart */}
        <div className="qx-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 850, color: '#0f172a', margin: 0 }}>Efficiency Score</h3>
                <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>Target achievement ratio</span>
              </div>
              <button title="Expand" style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#0f172a' }}>
                <ArrowUpRight size={18} />
              </button>
            </div>

            <div style={{ fontSize: '32px', fontWeight: 950, color: '#0f172a', letterSpacing: '-1px', margin: '4px 0 16px 0' }}>
              {completionRate}% <span style={{ fontSize: '16px', color: '#10b981', fontWeight: 800 }}>↗ Optimal</span>
            </div>
          </div>

          <div style={{ height: '140px', width: '100%' }}>
            <Line data={lineChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { x: { display: false }, y: { display: false } }
            }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
            <Link
              href="/approval"
              className="qx-pill-btn"
              style={{
                background: theme.primary,
                color: '#ffffff',
                padding: '11px',
                borderRadius: '99px',
                fontSize: '13px',
                fontWeight: 800,
                textAlign: 'center',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: `0 4px 12px ${theme.primary}55`
              }}
            >
              Approve <ArrowUp size={15} />
            </Link>
            <Link
              href="/jadwal"
              className="qx-pill-btn"
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                padding: '11px',
                borderRadius: '99px',
                fontSize: '13px',
                fontWeight: 800,
                textAlign: 'center',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              Inspect <ArrowDown size={15} />
            </Link>
          </div>
        </div>

      </div>

      {/* ==================== QUIXOTIC ROW 2: ACTIVITY TABLE & STACKED WIDGETS ==================== */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', width: '100%' }}>
        
        {/* Wide Left: Payment / Activity History */}
        <div className="qx-card" style={{ flex: '2 1 550px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '19px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
                  Recent Maintenance History
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Recent maintenance activities and inspection log</span>
              </div>
              <Link href="/riwayat" title="Open Archive" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', textDecoration: 'none' }}>
                <ArrowUpRight size={19} />
              </Link>
            </div>

            {/* Table Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.5fr 1.2fr 1.3fr 1.5fr', padding: '0 12px 12px 12px', borderBottom: '1px solid #e2e8f0', fontSize: '12.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              <div>Mold Activity</div>
              <div>Date</div>
              <div>Shift</div>
              <div>Status</div>
              <div style={{ textAlign: 'right' }}>Cost / Detail</div>
            </div>

            {/* List Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
              {(data?.recentLaporan && data.recentLaporan.length > 0 ? data.recentLaporan.slice(0, 5) : [
                { id: 1, judul: 'Mold #A-101 • Core Polish & Ejector Check', tanggal: '16 Jun 2026', shift: 'Shift A', status: 'Approved', biaya: '450 Ribu Rp' },
                { id: 2, judul: 'Mold #B-204 • Cooling Line Flush', tanggal: '15 Jun 2026', shift: 'Shift B', status: 'Approved', biaya: '320 Ribu Rp' },
                { id: 3, judul: 'Mold #C-109 • Preventive Routine', tanggal: '14 Jun 2026', shift: 'Nonshift', status: 'Approved', biaya: '180 Ribu Rp' },
                { id: 4, judul: 'Mold #A-302 • Guide Bushing Grease', tanggal: '13 Jun 2026', shift: 'Shift A', status: 'In Review', biaya: '210 Ribu Rp' },
                { id: 5, judul: 'Mold #D-401 • Overhaul Inspection Checksheet', tanggal: '12 Jun 2026', shift: 'Shift B', status: 'Approved', biaya: '890 Ribu Rp' }
              ]).map((item: any, i: number) => {
                const isApproved = item.status === 'Approved' || item.status === 'APPROVED' || item.status === 'ADM' || item.status === 'SELESAI';
                const icons = ['⚙️', '🔧', '🛡️', '📊', '⚡'];
                return (
                  <div key={item.id || i} style={{
                    display: 'grid',
                    gridTemplateColumns: '2.5fr 1.5fr 1.2fr 1.3fr 1.5fr',
                    alignItems: 'center',
                    padding: '14px 12px',
                    borderRadius: '16px',
                    transition: 'background 0.2s',
                    borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none'
                  }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: theme.light, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                        {icons[i % icons.length]}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                          {item.judul || item.nomor || (item.mold ? `Mold ${item.mold.noMold}` : `Maintenance #${i + 1}`)}
                        </div>
                        <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600 }}>{item.jenis || 'Routine Maint'}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#475569' }}>
                      {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : (item.tanggalRencana || '16 Jun 2026')}
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>
                      {item.shift || 'Shift A'}
                    </div>

                    <div>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        color: isApproved ? '#10b981' : '#f59e0b',
                        background: isApproved ? '#ecfdf5' : '#fef3c7',
                        padding: '4px 12px',
                        borderRadius: '99px'
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isApproved ? '#10b981' : '#f59e0b' }} />
                        {isApproved ? 'Successful' : 'In Review'}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
                      {item.biaya ? (typeof item.biaya === 'number' ? `Rp ${(item.biaya * 1000).toLocaleString('id-ID')}` : item.biaya) : '450.00 Ribu Rp'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
            <Link href="/riwayat" style={{ fontSize: '13.5px', fontWeight: 800, color: theme.primary, textDecoration: 'none' }}>
              View Complete Laporan Archive ➔
            </Link>
          </div>
        </div>

        {/* Right Stacked Column (~35%) */}
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Top Widget: Amount of credit / Total Maintenance Done */}
          <div className="qx-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: theme.light, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={20} style={{ color: theme.primary }} />
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 850, color: '#0f172a', margin: 0 }}>Completed Laporan</h4>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Total refund / achievement value</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '14px 0' }}>
                <span style={{ fontSize: '34px', fontWeight: 950, color: '#0f172a', letterSpacing: '-1px' }}>
                  {maintenanceDone} <span style={{ fontSize: '18px', color: '#64748b', fontWeight: 700 }}>Jobs</span>
                </span>
                <span style={{ background: '#10b981', color: '#ffffff', padding: '5px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 850 }}>
                  +12.8%
                </span>
              </div>
            </div>

            <Link href="/approval" style={{ fontSize: '13px', fontWeight: 800, color: theme.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px' }}>
              Check approval status ➔
            </Link>
          </div>

          {/* Bottom Widget: Mandatory Payments / Team On Duty */}
          <div className="qx-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 850, color: '#0f172a', margin: 0 }}>Active Team &amp; PICs</h4>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Recent duty maintenance engineers</span>
                </div>
                <Link href="/kehadiran" title="View Team" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', textDecoration: 'none' }}>
                  <ArrowUpRight size={17} />
                </Link>
              </div>

              {/* Avatars row */}
              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 10px 0' }}>
                {['Dilan (GL)', 'Rudi (TL)', 'Budi (PIC)', 'Farrel (ADM)'].map((name, idx) => {
                  const colors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6'];
                  return (
                    <div key={idx} title={name} style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: colors[idx],
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '15px',
                      border: '3px solid #ffffff',
                      marginLeft: idx > 0 ? '-12px' : '0',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}>
                      {name.charAt(0)}
                    </div>
                  );
                })}
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: theme.primary,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '14px',
                  border: '3px solid #ffffff',
                  marginLeft: '-12px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                  +8
                </div>
              </div>
            </div>

            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600, marginTop: '10px' }}>
              ● All shifts fully deployed on scheduled tasks.
            </span>
          </div>

        </div>

      </div>

      {/* ==================== ROW 3: TARGET & OVERTIME MANAGEMENT (QUIXOTIC CONTAINERS) ==================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))', gap: '24px', marginTop: '10px' }}>
        
        {/* Overtime Akumulasi */}
        <div className="qx-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>⏱️ Akumulasi Jam Lembur Anggota</h3>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Perbandingan jam lembur plan vs aktual bulan berjalan</span>
            </div>
            <Link href="/overtime" className="qx-pill-btn" style={{ fontSize: '12.5px', color: theme.primary, fontWeight: 800, textDecoration: 'none', background: theme.light, padding: '8px 16px', borderRadius: '99px', border: `1px solid ${theme.border}` }}>
              Kelola Overtime →
            </Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '14px' }}>
            {(['Nonshift', 'Shift_A', 'Shift_B'] as const).map((shiftKey) => {
              const ot = data?.overtime?.[shiftKey] || { labels: ['W1', 'W2', 'W3', 'W4'], plan: [10, 15, 12, 20], aktual: [12, 14, 15, 18] };
              const shiftLabel = shiftKey === 'Nonshift' ? 'Regu Nonshift' : shiftKey === 'Shift_A' ? 'Regu Shift A' : 'Regu Shift B';
              
              const colorPlan = '#e2e8f0';
              const colorAktual = shiftKey === 'Nonshift' ? '#10b981' : shiftKey === 'Shift_A' ? '#3b82f6' : '#f59e0b';
              
              if (!ot || ot.labels.length === 0) return null;
              return (
                <div key={shiftKey} style={{ height: '230px', width: '100%' }}>
                  <Bar
                    data={{
                      labels: ot.labels.map((name: string) => name.split(' ')[0]),
                      datasets: [
                        { label: 'Plan (Jam)', data: ot.plan, backgroundColor: colorPlan, borderRadius: 6, barPercentage: 0.65 },
                        { label: 'Aktual (Jam)', data: ot.aktual, backgroundColor: colorAktual, borderRadius: 6, barPercentage: 0.65 },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' as const, labels: { font: { size: 11, weight: 700 }, usePointStyle: true } },
                        title: { display: true, text: shiftLabel, font: { size: 14, weight: 850 }, color: '#334155', align: 'start' as const },
                      },
                      scales: { 
                        x: { grid: { display: false }, ticks: { color: '#64748b', font: { weight: 700 } } },
                        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#64748b' } } 
                      },
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Target Setter & Planning Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Chart Target vs Aktual */}
          <div className="qx-card">
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>📊 Target vs Aktual Maintenance</h3>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
              Target Bulan Ini: <b style={{ color: theme.primary }}>{data?.planningWeekly?.totalTarget || 40} mold</b> | Selesai: <b style={{ color: '#10b981' }}>{data?.planningWeekly?.totalAktual || 38} mold</b>
            </span>
            <div style={{ height: '240px', marginTop: '20px' }}>
              <Bar
                data={{
                  labels: (data?.planningWeekly?.weeks || ['W1', 'W2', 'W3', 'W4']).map((_: any, i: number) => `Week ${i + 1}`),
                  datasets: [
                    { label: 'Target A', data: data?.planningWeekly?.targetsA || [10, 10, 10, 10], backgroundColor: '#cbd5e1', borderRadius: 6 },
                    { label: 'Aktual A', data: data?.planningWeekly?.aktualA || [9, 11, 10, 8], backgroundColor: '#3b82f6', borderRadius: 6 },
                    { label: 'Target B', data: data?.planningWeekly?.targetsB || [10, 10, 10, 10], backgroundColor: '#e2e8f0', borderRadius: 6 },
                    { label: 'Aktual B', data: data?.planningWeekly?.aktualB || [10, 10, 12, 9], backgroundColor: '#f59e0b', borderRadius: 6 },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' as const, labels: { boxWidth: 12, font: { size: 11, weight: 700 } } } },
                  scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } },
                }}
              />
            </div>
          </div>

          {/* Form Setter Target */}
          <div className="qx-card" style={{ border: `2px solid ${theme.border}`, background: theme.light }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ width: 38, height: 38, borderRadius: '12px', background: '#ffffff', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.04)' }}>
                <Sparkles size={20} style={{ color: theme.primary }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>Kelola Target Maintenance Bulanan</h3>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>Periode Bulan Aktif: <b style={{ color: theme.primary }}>{bulan}</b></span>
              </div>
            </div>
            
            <form onSubmit={handleSaveTarget} style={{ marginTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>Target Shift A (Mold)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={targetA}
                    onChange={(e) => setTargetA(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '15px',
                      fontWeight: 850,
                      color: '#0f172a',
                      background: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>Target Shift B (Mold)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={targetB}
                    onChange={(e) => setTargetB(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '15px',
                      fontWeight: 850,
                      color: '#0f172a',
                      background: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                    }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submittingTarget}
                className="qx-pill-btn"
                style={{
                  width: '100%',
                  marginTop: '18px',
                  padding: '13px',
                  borderRadius: '99px',
                  background: theme.gradient,
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '14.5px',
                  border: 'none',
                  cursor: submittingTarget ? 'not-allowed' : 'pointer',
                  boxShadow: `0 6px 18px ${theme.primary}55`,
                }}
              >
                {submittingTarget ? '⏳ Menyimpan Target...' : '💾 Perbarui Target Bulan Ini'}
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  )
}
