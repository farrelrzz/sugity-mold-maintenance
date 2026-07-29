'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import Pagination from '@/components/ui/Pagination'

const MONTH_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const WEEKDAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

interface SafetyRecord {
  id: number
  date: string
  year: number
  month: number
  day: number
  status: 'NO_ACCIDENT' | 'ACCIDENT'
  keterangan?: string | null
  updatedBy: number
  updatedAt: string
  user: {
    nama: string
    username: string
    role: string
  }
}

interface SafetyHistory {
  id: number
  date: string
  status: string
  keterangan?: string | null
  action: string
  modifiedBy: number
  createdAt: string
  user: {
    nama: string
    username: string
    role: string
  }
}

export default function KalenderSafetyPage() {
  const { data: session } = useSession()
  const currentRole = (session?.user as any)?.role || ''
  const isAuthorized = ['TL', 'GL', 'CL', 'ADM', 'SUPER_ADMIN'].includes(currentRole)

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [activeTab, setActiveTab] = useState<'CALENDAR' | 'HISTORY'>('CALENDAR')

  const [records, setRecords] = useState<SafetyRecord[]>([])
  const [history, setHistory] = useState<SafetyHistory[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [toast, setToast] = useState<{ message: string; type: 'sukses' | 'error' | 'info' } | null>(null)

  // Modal Editing Day
  const [editingDay, setEditingDay] = useState<{
    day: number
    dateStr: string
    status: 'NO_ACCIDENT' | 'ACCIDENT'
    keterangan: string
    existing?: SafetyRecord
  } | null>(null)
  const [saveLoading, setSaveLoading] = useState<boolean>(false)

  // History Pagination & Filter
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'ACCIDENT' | 'NO_ACCIDENT'>('ALL')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)

  const showToast = (message: string, type: 'sukses' | 'error' | 'info' = 'sukses') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/safety-calendar?year=${selectedYear}`)
      if (res.ok) {
        const data = await res.json()
        setRecords(data.records || [])
        setHistory(data.history || [])
      } else {
        showToast('Gagal memuat data kalender safety', 'error')
      }
    } catch {
      showToast('Terjadi kesalahan jaringan', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedYear])

  // Map day record quickly
  const getRecordForDay = (m: number, d: number): SafetyRecord | undefined => {
    return records.find((r) => r.month === m && r.day === d)
  }

  const getMonthStats = (m: number) => {
    const daysInM = new Date(selectedYear, m, 0).getDate()
    let noAccident = 0
    let accident = 0
    let unrecorded = 0

    for (let d = 1; d <= daysInM; d++) {
      const rec = getRecordForDay(m, d)
      if (!rec) unrecorded++
      else if (rec.status === 'NO_ACCIDENT') noAccident++
      else if (rec.status === 'ACCIDENT') accident++
    }

    return { daysInM, noAccident, accident, unrecorded }
  }

  const yearlyStats = useMemo(() => {
    let totalNoAcc = 0
    let totalAcc = 0
    let totalUnrec = 0

    for (let m = 1; m <= 12; m++) {
      const st = getMonthStats(m)
      totalNoAcc += st.noAccident
      totalAcc += st.accident
      totalUnrec += st.unrecorded
    }

    return { totalNoAcc, totalAcc, totalUnrec }
  }, [records, selectedYear])

  // Action Helpers
  const handleOpenDayModal = (m: number, d: number) => {
    const dateStr = `${selectedYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const existing = getRecordForDay(m, d)

    setEditingDay({
      day: d,
      dateStr,
      status: existing ? existing.status : 'NO_ACCIDENT',
      keterangan: existing?.keterangan || '',
      existing
    })
  }

  const handleSaveDay = async () => {
    if (!editingDay || !isAuthorized) return
    setSaveLoading(true)
    try {
      const res = await fetch('/api/safety-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_DAY',
          year: selectedYear,
          month: selectedMonth,
          day: editingDay.day,
          status: editingDay.status,
          keterangan: editingDay.keterangan.trim()
        })
      })

      if (res.ok) {
        showToast(`Status tanggal ${editingDay.day} ${MONTH_NAMES[selectedMonth]} berhasil disimpan ✓`, 'sukses')
        setEditingDay(null)
        fetchData()
      } else {
        const err = await res.json()
        showToast(err.error || 'Gagal menyimpan data hari', 'error')
      }
    } catch {
      showToast('Terjadi kesalahan koneksi saat menyimpan', 'error')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleBulkFillMonth = async (m: number) => {
    if (!isAuthorized) return
    if (!window.confirm(`Yakin ingin mengisi OTOMATIS seluruh hari di bulan ${MONTH_NAMES[m]} ${selectedYear} yang belum tercatat menjadi NO ACCIDENT (Zero Accident)?`)) {
      return
    }

    try {
      const res = await fetch('/api/safety-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BULK_FILL_MONTH',
          year: selectedYear,
          month: m,
          status: 'NO_ACCIDENT'
        })
      })

      if (res.ok) {
        showToast(`Seluruh hari di bulan ${MONTH_NAMES[m]} ${selectedYear} berhasil dipercayakan No Accident! ✓`, 'sukses')
        fetchData()
      } else {
        const err = await res.json()
        showToast(err.error || 'Gagal mengisi otomatis', 'error')
      }
    } catch {
      showToast('Terjadi kesalahan saat mengisi otomatis', 'error')
    }
  }

  // Filter & Paginate History
  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      if (historyFilter === 'ALL') return true
      return h.status === historyFilter
    })
  }, [history, historyFilter])

  const currentHistorySlice = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredHistory.slice(start, start + itemsPerPage)
  }, [filteredHistory, currentPage, itemsPerPage])

  const daysInSelectedMonth = new Date(selectedYear, selectedMonth, 0).getDate()

  if (session && !isAuthorized) {
    return (
      <div className="kartu" style={{ padding: '50px 30px', textAlign: 'center', borderRadius: '16px', border: '1px solid var(--merah-bg)', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{ fontSize: '52px', marginBottom: '16px' }}>🛡️🔒</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--teks)', marginBottom: '10px' }}>Akses Terbatas</h2>
        <p style={{ fontSize: '14.5px', color: 'var(--teks-redup)', lineHeight: 1.6, marginBottom: '24px' }}>
          Hanya <b>Team Leader (TL), Group Leader (GL), Chief Leader (CL), dan Administrator (ADM)</b> yang berwenang untuk mengakses dan mengelola Kalender Safety.
        </p>
        <button 
          type="button" 
          className="tombol-utama" 
          onClick={() => window.location.href = '/dashboard'} 
          style={{ padding: '12px 24px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Kembali ke Dashboard
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '14px 22px',
          borderRadius: '12px',
          backgroundColor: toast.type === 'sukses' ? '#065f46' : toast.type === 'error' ? '#991b1b' : '#1e40af',
          color: '#ffffff',
          fontWeight: 700,
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '15px'
        }}>
          <span>{toast.type === 'sukses' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
        color: '#ffffff',
        padding: '28px 32px',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(6, 78, 59, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '38px' }}>🛡️</span>
              <div>
                <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px' }}>
                  Kalender Safety & Zero Accident
                </h1>
                <p style={{ margin: '6px 0 0', fontSize: '14.5px', color: '#a7f3d0', fontWeight: 500 }}>
                  Pemantauan K3 Tahunan (Green Cross) Departemen Molding Maintenance & Pencatatan Riwayat Insiden Kerja
                </p>
              </div>
            </div>
          </div>

          {/* Year Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.15)',
            padding: '8px 16px',
            borderRadius: '14px',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.25)'
          }}>
            <button
              onClick={() => setSelectedYear((y) => y - 1)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '18px',
                fontWeight: 900,
                cursor: 'pointer',
                padding: '4px 10px',
                borderRadius: '8px',
                transition: 'background 0.2s'
              }}
              title="Tahun sebelumnya"
            >
              ◀
            </button>
            <span style={{ fontSize: '18px', fontWeight: 900, minWidth: '100px', textAlign: 'center', letterSpacing: '1px' }}>
              TAHUN {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear((y) => y + 1)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '18px',
                fontWeight: 900,
                cursor: 'pointer',
                padding: '4px 10px',
                borderRadius: '8px',
                transition: 'background 0.2s'
              }}
              title="Tahun berikutnya"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Role Access Information Banner */}
        <div style={{
          background: isAuthorized ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
          border: `1px solid ${isAuthorized ? '#6ee7b7' : '#fde68a'}`,
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px'
        }}>
          <span style={{ fontSize: '22px' }}>{isAuthorized ? '👑' : '👁️'}</span>
          <div>
            {isAuthorized ? (
              <span>
                <b>Hak Akses Terverifikasi (Role: {currentRole})</b> — Anda diizinkan untuk <b>mengisi dan mengubah</b> status kecelakaan (Accident / No Accident) pada setiap bulan/hari di kalender ini.
              </span>
            ) : (
              <span>
                <b>Mode Lihat (Read-Only)</b> — Anda masuk dengan role <b>{currentRole || 'Member'}</b>. Sesuai kebijakan keselamatan, <b>hanya Team Leader (TL), Group Leader (GL), Chief Leader (CL), dan Admin (ADM)</b> yang berwenang mengisi atau mengubah kalender safety.
              </span>
            )}
          </div>
        </div>

        {/* Yearly KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '4px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px 20px', borderRadius: '14px', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ color: '#6ee7b7', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>🟢 Total No Accident</div>
            <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '4px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span>{yearlyStats.totalNoAcc}</span>
              <span style={{ fontSize: '15px', color: '#d1fae5', fontWeight: 600 }}>Hari</span>
            </div>
          </div>

          <div style={{ background: yearlyStats.totalAcc > 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.1)', padding: '16px 20px', borderRadius: '14px', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ color: '#fca5a5', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>🔴 Total Insiden / Accident</div>
            <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '4px', color: yearlyStats.totalAcc > 0 ? '#fee2e2' : '#fff', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span>{yearlyStats.totalAcc}</span>
              <span style={{ fontSize: '15px', color: '#fee2e2', fontWeight: 600 }}>Insiden</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px 20px', borderRadius: '14px', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ color: '#fde68a', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>⚪ Hari Belum Diisi / Neutral</div>
            <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '4px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span>{yearlyStats.totalUnrec}</span>
              <span style={{ fontSize: '15px', color: '#fef3c7', fontWeight: 600 }}>Hari</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px 20px', borderRadius: '14px', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ color: '#a7f3d0', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>🏆 Status Keselamatan</div>
            <div style={{ fontSize: '19px', fontWeight: 900, marginTop: '8px', color: yearlyStats.totalAcc === 0 ? '#4de69d' : '#f87171' }}>
              {yearlyStats.totalAcc === 0 ? '✨ ZERO ACCIDENT TAHAPAN INI' : '⚠️ PERLU TINDAKAN PREVENTIF'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div style={{ display: 'flex', gap: '14px', borderBottom: '2px solid var(--abu-border)', paddingBottom: '16px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('CALENDAR')}
          style={{
            background: activeTab === 'CALENDAR' ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)' : '#ffffff',
            color: activeTab === 'CALENDAR' ? '#ffffff' : '#334155',
            border: activeTab === 'CALENDAR' ? '1px solid #047857' : '2px solid #cbd5e1',
            padding: '14px 28px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'CALENDAR' ? '0 6px 16px rgba(4, 120, 87, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '18px' }}>📅</span>
          <span>Kalender Bulanan & Tahunan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('HISTORY')}
          style={{
            background: activeTab === 'HISTORY' ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)' : '#ffffff',
            color: activeTab === 'HISTORY' ? '#ffffff' : '#334155',
            border: activeTab === 'HISTORY' ? '1px solid #047857' : '2px solid #cbd5e1',
            padding: '14px 28px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'HISTORY' ? '0 6px 16px rgba(4, 120, 87, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '18px' }}>📜</span>
          <span>Riwayat Perubahan & Audit Log</span>
          <span style={{
            background: activeTab === 'HISTORY' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
            color: activeTab === 'HISTORY' ? '#fff' : '#1e293b',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 900
          }}>
            {history.length}
          </span>
        </button>
      </div>

      {loading && (
        <div className="kartu" style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '18px', fontWeight: 600 }}>
          ⏳ Memuat data kalender keselamatan...
        </div>
      )}

      {!loading && activeTab === 'CALENDAR' && (
        <>
          {/* SECTION 1: 12 MONTHS YEARLY OVERVIEW GRID */}
          <div className="kartu" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p className="label-besar" style={{ margin: 0 }}>📆 Rekapitulasi 12 Bulan ({selectedYear})</p>
                <p className="pertanyaan" style={{ margin: '4px 0 0' }}>Klik pada kartu bulan untuk melihat detail harian atau melakukan pengisian insiden</p>
              </div>
              <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: 600 }}>
                💡 Bulan terpilih saat ini: <b style={{ color: '#065f46' }}>{MONTH_NAMES[selectedMonth]} {selectedYear}</b>
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const stats = getMonthStats(m)
                const isCurrent = selectedMonth === m
                const hasAccident = stats.accident > 0

                return (
                  <div
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    style={{
                      border: isCurrent ? '2px solid #10b981' : hasAccident ? '1px solid #fca5a5' : '1px solid var(--abu-border)',
                      background: isCurrent ? '#f0fdf4' : hasAccident ? '#fff5f5' : '#ffffff',
                      borderRadius: '16px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isCurrent ? '0 6px 18px rgba(16, 185, 129, 0.18)' : '0 2px 8px rgba(0,0,0,0.03)',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {isCurrent && (
                      <span style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: '#10b981',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        textTransform: 'uppercase'
                      }}>
                        Terpilih
                      </span>
                    )}

                    <div>
                      <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>{MONTH_NAMES[m]}</div>
                      <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>{stats.daysInM} Hari Kalender</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 700 }}>
                        <span style={{ color: '#059669' }}>🟢 {stats.noAccident} Aman</span>
                        {stats.accident > 0 && (
                          <span style={{ color: '#dc2626', fontWeight: 800 }}>🔴 {stats.accident} Insiden</span>
                        )}
                      </div>

                      {/* Mini Progress Bar */}
                      <div style={{ height: '7px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', display: 'flex' }}>
                        <div style={{
                          width: `${(stats.noAccident / stats.daysInM) * 100}%`,
                          background: '#10b981',
                          transition: 'width 0.3s'
                        }} />
                        <div style={{
                          width: `${(stats.accident / stats.daysInM) * 100}%`,
                          background: '#ef4444',
                          transition: 'width 0.3s'
                        }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SECTION 2: INTERACTIVE MONTHLY EDITOR GRID */}
          <div className="kartu" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Detail Hari & Pengisian Status
                </span>
                <h2 style={{ margin: '3px 0 0', fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>
                  Bulan {MONTH_NAMES[selectedMonth]} {selectedYear}
                </h2>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {isAuthorized && (
                  <button
                    onClick={() => handleBulkFillMonth(selectedMonth)}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      color: '#fff',
                      border: 'none',
                      padding: '11px 20px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    title="Isi otomatis semua hari di bulan ini menjadi No Accident"
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <span>✨</span>
                    <span>Isi Semua Hari Menjadi (No Accident)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Daily Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '12px' }}>
              {Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1).map((d) => {
                const rec = getRecordForDay(selectedMonth, d)
                const isAccident = rec?.status === 'ACCIDENT'
                const isNoAccident = rec?.status === 'NO_ACCIDENT'
                const dateObj = new Date(selectedYear, selectedMonth - 1, d)
                const weekday = WEEKDAY_NAMES[dateObj.getDay()]
                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6

                return (
                  <div
                    key={d}
                    onClick={() => handleOpenDayModal(selectedMonth, d)}
                    style={{
                      border: isAccident ? '2px solid #fca5a5' : isNoAccident ? '2px solid #a7f3d0' : '1px dashed #cbd5e1',
                      background: isAccident ? 'linear-gradient(180deg, #fff5f5 0%, #fef2f2 100%)' : isNoAccident ? 'linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%)' : '#fafafa',
                      borderRadius: '14px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '120px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)'; }}
                  >
                    {/* Top: Date number and Weekday */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '22px', fontWeight: 900, color: isAccident ? '#991b1b' : isNoAccident ? '#065f46' : '#334155' }}>
                        {d}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: isWeekend ? '#e11d48' : '#64748b',
                        background: isWeekend ? '#ffe4e6' : '#f1f5f9',
                        padding: '2px 8px',
                        borderRadius: '8px'
                      }}>
                        {weekday}
                      </span>
                    </div>

                    {/* Middle: Status Badge */}
                    <div style={{ margin: '6px 0' }}>
                      {isAccident ? (
                        <div style={{ background: '#dc2626', color: '#fff', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px', width: '100%', justifyContent: 'center', boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)' }}>
                          <span>🔴</span>
                          <span>ACCIDENT</span>
                        </div>
                      ) : isNoAccident ? (
                        <div style={{ background: '#10b981', color: '#fff', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px', width: '100%', justifyContent: 'center' }}>
                          <span>🟢</span>
                          <span>No Accident</span>
                        </div>
                      ) : (
                        <div style={{ color: '#94a3b8', fontSize: '12.5px', fontWeight: 600, fontStyle: 'italic', textAlign: 'center' }}>
                          ⚪ Belum Diisi
                        </div>
                      )}
                    </div>

                    {/* Bottom: Modifier Note / Info */}
                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '8px', marginTop: '4px', fontSize: '11.5px', color: '#64748b' }}>
                      {rec ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 700, color: isAccident ? '#991b1b' : '#065f46', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            👤 {rec.user?.nama || 'System'} ({rec.user?.role || ''})
                          </span>
                          {rec.keterangan && (
                            <span style={{ fontStyle: 'italic', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              💬 &quot;{rec.keterangan}&quot;
                            </span>
                          )}
                        </div>
                      ) : (
                        <div style={{ color: '#cbd5e1', textAlign: 'center' }}>
                          Klik untuk isi &rarr;
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {!loading && activeTab === 'HISTORY' && (
        <div className="kartu" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '2px solid var(--abu-border)', paddingBottom: '14px' }}>
            <div>
              <p className="label-besar" style={{ margin: 0 }}>📜 Riwayat Perubahan & Catatan Insiden</p>
              <p className="pertanyaan" style={{ margin: '4px 0 0' }}>Semua riwayat pembaruan status No Accident / Accident tercatat dengan nama user (GL/CL)</p>
            </div>

            {/* Filter Toggle */}
            <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '6px', borderRadius: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setHistoryFilter('ALL'); setCurrentPage(1); }}
                style={{
                  border: 'none',
                  background: historyFilter === 'ALL' ? '#ffffff' : 'transparent',
                  color: historyFilter === 'ALL' ? '#0f172a' : '#64748b',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  boxShadow: historyFilter === 'ALL' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer'
                }}
              >
                Semua Riwayat
              </button>
              <button
                onClick={() => { setHistoryFilter('ACCIDENT'); setCurrentPage(1); }}
                style={{
                  border: 'none',
                  background: historyFilter === 'ACCIDENT' ? '#fee2e2' : 'transparent',
                  color: historyFilter === 'ACCIDENT' ? '#b91c1c' : '#64748b',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  boxShadow: historyFilter === 'ACCIDENT' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer'
                }}
              >
                🔴 Hanya Accident / Insiden
              </button>
              <button
                onClick={() => { setHistoryFilter('NO_ACCIDENT'); setCurrentPage(1); }}
                style={{
                  border: 'none',
                  background: historyFilter === 'NO_ACCIDENT' ? '#d1fae5' : 'transparent',
                  color: historyFilter === 'NO_ACCIDENT' ? '#047857' : '#64748b',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  boxShadow: historyFilter === 'NO_ACCIDENT' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer'
                }}
              >
                🟢 No Accident & Bulk Fill
              </button>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '15px', fontWeight: 600 }}>
              Tidak ada riwayat perubahan yang sesuai dengan filter ini.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '12px 16px' }}>Tanggal Target</th>
                      <th style={{ padding: '12px 16px' }}>Status Safety</th>
                      <th style={{ padding: '12px 16px' }}>Keterangan / Kronologi</th>
                      <th style={{ padding: '12px 16px' }}>Diperbarui Oleh (GL/CL)</th>
                      <th style={{ padding: '12px 16px' }}>Waktu Pembaruan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentHistorySlice.map((item) => {
                      const isAcc = item.status === 'ACCIDENT'
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                          <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a' }}>
                            📅 {item.date}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {isAcc ? (
                              <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '12.5px' }}>
                                🔴 ACCIDENT
                              </span>
                            ) : (
                              <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '4px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '12.5px' }}>
                                🟢 No Accident
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', maxWidth: '400px', color: '#334155', fontWeight: 500 }}>
                            {item.keterangan || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Tidak ada keterangan khusus</span>}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.user?.nama || 'System User'}</div>
                            <div style={{ fontSize: '12px', color: '#358c63', fontWeight: 700 }}>Role: {item.user?.role || 'GL/CL'}</div>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px' }}>
                            {new Date(item.createdAt).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalItems={filteredHistory.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemLabel="catatan riwayat"
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </>
          )}
        </div>
      )}

      {/* DIALOG MODAL UPDATE HARI */}
      {editingDay && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Atur Status & Catatan Harian
                </span>
                <h3 style={{ margin: '3px 0 0', fontSize: '19px', fontWeight: 900 }}>
                  📅 Tanggal {editingDay.day} {MONTH_NAMES[selectedMonth]} {selectedYear}
                </h3>
              </div>
              <button
                onClick={() => setEditingDay(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#fff',
                  width: '34px', height: '34px',
                  borderRadius: '50%',
                  fontSize: '18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {!isAuthorized ? (
                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #f59e0b',
                  padding: '14px',
                  borderRadius: '12px',
                  color: '#92400e',
                  fontSize: '14px'
                }}>
                  <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span>🔒 Akses Terbatas (Role Anda: {currentRole})</span>
                  </div>
                  <span>Hanya user dengan role <b>Team Leader (TL), Group Leader (GL), Chief Leader (CL), dan Admin (ADM)</b> yang dapat mengubah atau mengisi status kecelakaan pada kalender safety ini.</span>
                </div>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '12px' }}>
                      Pilih Status Keselamatan:
                    </label>
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setEditingDay({ ...editingDay, status: 'NO_ACCIDENT' })}
                        style={{
                          flex: '1 1 200px',
                          padding: '16px',
                          borderRadius: '16px',
                          border: editingDay.status === 'NO_ACCIDENT' ? '3px solid #059669' : '1px solid #cbd5e1',
                          background: editingDay.status === 'NO_ACCIDENT' ? 'linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)' : '#f8fafc',
                          color: editingDay.status === 'NO_ACCIDENT' ? '#065f46' : '#64748b',
                          fontWeight: 800,
                          fontSize: '15px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: editingDay.status === 'NO_ACCIDENT' ? '0 8px 20px rgba(5, 150, 105, 0.25)' : 'none',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                          position: 'relative'
                        }}
                      >
                        {editingDay.status === 'NO_ACCIDENT' && (
                          <span style={{ background: '#059669', color: '#fff', fontSize: '11px', fontWeight: 900, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>
                            ✓ Terpilih
                          </span>
                        )}
                        <span style={{ fontSize: '32px' }}>🟢</span>
                        <span>NO ACCIDENT (Aman)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingDay({ ...editingDay, status: 'ACCIDENT' })}
                        style={{
                          flex: '1 1 200px',
                          padding: '16px',
                          borderRadius: '16px',
                          border: editingDay.status === 'ACCIDENT' ? '3px solid #dc2626' : '1px solid #cbd5e1',
                          background: editingDay.status === 'ACCIDENT' ? 'linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%)' : '#f8fafc',
                          color: editingDay.status === 'ACCIDENT' ? '#991b1b' : '#64748b',
                          fontWeight: 800,
                          fontSize: '15px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: editingDay.status === 'ACCIDENT' ? '0 8px 20px rgba(220, 38, 38, 0.25)' : 'none',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                          position: 'relative'
                        }}
                      >
                        {editingDay.status === 'ACCIDENT' && (
                          <span style={{ background: '#dc2626', color: '#fff', fontSize: '11px', fontWeight: 900, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>
                            ✓ Terpilih
                          </span>
                        )}
                        <span style={{ fontSize: '32px' }}>🔴</span>
                        <span>ACCIDENT (Insiden!)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                      Catatan / Keterangan (Opsional, Wajib saat Accident):
                    </label>
                    <textarea
                      value={editingDay.keterangan}
                      onChange={(e) => setEditingDay({ ...editingDay, keterangan: e.target.value })}
                      placeholder={
                        editingDay.status === 'ACCIDENT'
                          ? 'Tulis kronologi insiden kerja, korban, atau lokasi kejadian secara jelas...'
                          : 'Contoh: Pekerjaan maintenance mold M24 aman dan terkendali...'
                      }
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '14px',
                        border: '2px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '14.5px',
                        color: '#0f172a',
                        fontWeight: 500,
                        outline: 'none',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </>
              )}

              {editingDay.existing && (
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '14px', fontSize: '13.5px', color: '#334155' }}>
                  <b>ℹ️ Info Terakhir Diperbarui:</b> oleh <b>{editingDay.existing.user?.nama}</b> ({editingDay.existing.user?.role}) pada {new Date(editingDay.existing.updatedAt).toLocaleString('id-ID')}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              background: '#f1f5f9',
              padding: '18px 24px',
              borderTop: '2px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={() => setEditingDay(null)}
                style={{
                  background: '#ffffff',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '13px 22px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s'
                }}
              >
                Tutup / Batal
              </button>
              {isAuthorized && (
                <button
                  type="button"
                  disabled={saveLoading}
                  onClick={handleSaveDay}
                  style={{
                    background: editingDay.status === 'ACCIDENT' 
                      ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' 
                      : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: '#ffffff',
                    border: editingDay.status === 'ACCIDENT' ? '1px solid #b91c1c' : '1px solid #047857',
                    padding: '14px 28px',
                    borderRadius: '12px',
                    fontSize: '15.5px',
                    fontWeight: 900,
                    cursor: saveLoading ? 'not-allowed' : 'pointer',
                    boxShadow: editingDay.status === 'ACCIDENT'
                      ? '0 6px 18px rgba(220, 38, 38, 0.4)'
                      : '0 6px 18px rgba(5, 150, 105, 0.4)',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    transition: 'transform 0.15s, box-shadow 0.15s'
                  }}
                  onMouseEnter={(e) => { !saveLoading && (e.currentTarget.style.transform = 'translateY(-2px)'); }}
                  onMouseLeave={(e) => { !saveLoading && (e.currentTarget.style.transform = 'translateY(0)'); }}
                >
                  {saveLoading ? '⏳ Menyimpan...' : editingDay.status === 'ACCIDENT' ? '💾 Simpan Status (ACCIDENT!)' : '💾 Simpan Status (No Accident)'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
