'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { showToast } from '@/components/ui/Toast'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js'
import { 
  Clock, 
  Search, 
  UserCheck, 
  Award, 
  TrendingUp, 
  Calendar, 
  Download, 
  Save, 
  Check, 
  X, 
  Users, 
  Filter, 
  BarChart3, 
  FileText,
  RefreshCw
} from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, Tooltip, Legend)

interface UserOT {
  id: number
  nama: string
  shift: string
  role: string
  factory: string
  totalPlan: number
  totalAktual: number
  entries: { tanggal: string; jamRencana: number; jamAktual: number }[]
}

const SHIFT_LABELS: Record<string, string> = {
  Nonshift: 'Nonshift',
  Shift_A: 'Shift A',
  Shift_B: 'Shift B',
}

const SHIFT_COLORS: Record<string, { plan: string; aktual: string }> = {
  Nonshift: { plan: 'rgba(99, 102, 241, 0.75)', aktual: 'rgba(99, 102, 241, 1)' },
  Shift_A: { plan: 'rgba(245, 158, 11, 0.75)', aktual: 'rgba(245, 158, 11, 1)' },
  Shift_B: { plan: 'rgba(16, 185, 129, 0.75)', aktual: 'rgba(16, 185, 129, 1)' },
}

export default function OvertimePage() {
  const [tab, setTab] = useState<'input' | 'grafik'>('input')
  const [bulan, setBulan] = useState(() => new Date().toISOString().slice(0, 7))
  const [users, setUsers] = useState<UserOT[]>([])
  const [loading, setLoading] = useState(true)

  // Input form & filters
  const [searchInput, setSearchInput] = useState('')
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('ALL')
  const [selectedUser, setSelectedUser] = useState<UserOT | null>(null)
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10))
  const [jamRencana, setJamRencana] = useState('')
  const [jamAktual, setJamAktual] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Export state
  const [exporting, setExporting] = useState(false)

  const fetchUsers = () => {
    setLoading(true)
    fetch(`/api/overtime/users?bulan=${bulan}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data)
      })
      .catch(() => showToast('Gagal memuat data overtime', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  }, [bulan])

  // Group users by shift
  const usersByShift = useMemo(() => {
    const groups: Record<string, UserOT[]> = { Nonshift: [], Shift_A: [], Shift_B: [] }
    users.forEach((u) => {
      const key = u.shift as string
      if (!groups[key]) groups[key] = []
      groups[key].push(u)
    })
    return groups
  }, [users])

  // Filter users for right list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = !searchInput || u.nama.toLowerCase().includes(searchInput.toLowerCase())
      const matchesShift = selectedShiftFilter === 'ALL' || u.shift === selectedShiftFilter
      return matchesSearch && matchesShift
    })
  }, [users, searchInput, selectedShiftFilter])

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalPlan = users.reduce((s, u) => s + u.totalPlan, 0)
    const totalAktual = users.reduce((s, u) => s + u.totalAktual, 0)
    const topPerformer = [...users].sort(
      (a, b) => (b.totalPlan + b.totalAktual) - (a.totalPlan + a.totalAktual)
    )[0]
    return { totalPlan, totalAktual, topPerformer }
  }, [users])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) {
      showToast('Pilih nama terlebih dahulu!', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/overtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          tanggal,
          jamRencana: Number(jamRencana || 0),
          jamAktual: Number(jamAktual || 0),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal menyimpan')
      }
      showToast(`✅ Overtime ${selectedUser.nama} berhasil disimpan!`, 'sukses' as any)
      setJamRencana('')
      setJamAktual('')
      fetchUsers()
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan overtime', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const [tahun] = bulan.split('-')
      const res = await fetch(`/api/dashboard/export-excel?tahun=${tahun}`)
      if (!res.ok) throw new Error('Export gagal')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Laporan_Tahunan_${tahun}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      showToast('📊 File Excel berhasil diunduh!', 'sukses' as any)
    } catch {
      showToast('Gagal export Excel', 'error')
    } finally {
      setExporting(false)
    }
  }

  const buildChartData = (shiftKey: string) => {
    const shiftUsers = usersByShift[shiftKey] || []
    const colors = SHIFT_COLORS[shiftKey] || SHIFT_COLORS.Nonshift
    return {
      labels: shiftUsers.map((u) => u.nama),
      datasets: [
        {
          label: 'Target (Jam)',
          data: shiftUsers.map((u) => u.totalPlan),
          backgroundColor: colors.plan,
          borderColor: colors.plan.replace('0.75', '1'),
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: 'Aktual (Jam)',
          data: shiftUsers.map((u) => u.totalAktual),
          backgroundColor: colors.aktual,
          borderColor: colors.aktual,
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    }
  }

  const chartOptions = (title: string) => ({
    responsive: true,
    plugins: {
      legend: { position: 'top' as const, labels: { font: { family: 'Inter', size: 12, weight: 600 as const } } },
      title: { display: true, text: title, font: { family: 'Inter', size: 15, weight: 800 as const } },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Jam', font: { weight: 700 as const } } },
      x: { ticks: { font: { size: 11, weight: 600 as const } } }
    },
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '35px' }}>
      {/* HEADER HERO */}
      <div className="kartu" style={{
        padding: '24px 28px',
        borderRadius: '20px',
        background: 'var(--kertas)',
        border: '1px solid var(--garis)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--oranye) 0%, #b8541e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 6px 16px rgba(221, 107, 40, 0.3)'
          }}>
            <Clock size={26} strokeWidth={2.2} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--teks)', margin: 0, letterSpacing: '-0.4px' }}>
              Manajemen Overtime & Jam Kerja
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--teks-redup)', margin: '3px 0 0 0', fontWeight: 500 }}>
              Pencatatan efisien jam rencana vs aktual personil maintenance tanpa gulir layar berlebihan.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--krem)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--garis)' }}>
            <Calendar size={16} style={{ color: 'var(--teks-redup)' }} />
            <input
              type="month"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              style={{ background: 'transparent', border: 'none', fontWeight: 700, fontSize: '13.5px', color: 'var(--teks)', outline: 'none', cursor: 'pointer' }}
            />
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'linear-gradient(135deg, #1d6f42 0%, #155331 100%)', color: '#fff', 
              border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: 800, 
              fontSize: '13.5px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(29, 111, 66, 0.25)'
            }}
          >
            <Download size={16} />
            {exporting ? 'Mengunduh...' : 'Export Excel Tahunan'}
          </button>
        </div>
      </div>

      {/* SUMMARY STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div className="kartu" style={{ padding: '20px', borderRadius: '16px', borderLeft: '5px solid var(--hijau)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div>
            <span style={{ fontSize: '11.5px', color: 'var(--teks-redup)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px' }}>Total Plan Bulan Ini</span>
            <h2 style={{ margin: '6px 0 0 0', color: 'var(--hijau)', fontSize: '26px', fontWeight: 900 }}>
              {summaryStats.totalPlan.toFixed(1)} <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--teks-redup)' }}>Jam</span>
            </h2>
          </div>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534' }}>
            <Calendar size={24} />
          </div>
        </div>

        <div className="kartu" style={{ padding: '20px', borderRadius: '16px', borderLeft: '5px solid var(--oranye)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div>
            <span style={{ fontSize: '11.5px', color: 'var(--teks-redup)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px' }}>Total Aktual Bulan Ini</span>
            <h2 style={{ margin: '6px 0 0 0', color: 'var(--oranye)', fontSize: '26px', fontWeight: 900 }}>
              {summaryStats.totalAktual.toFixed(1)} <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--teks-redup)' }}>Jam</span>
            </h2>
          </div>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c2410c' }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="kartu" style={{ padding: '20px', borderRadius: '16px', borderLeft: '5px solid #6366f1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div>
            <span style={{ fontSize: '11.5px', color: 'var(--teks-redup)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px' }}>Pencapaian (Akt/Plan)</span>
            <h2 style={{ margin: '6px 0 0 0', color: '#4338ca', fontSize: '26px', fontWeight: 900 }}>
              {summaryStats.totalPlan > 0
                ? `${((summaryStats.totalAktual / summaryStats.totalPlan) * 100).toFixed(1)}%`
                : '—'}
            </h2>
          </div>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="kartu" style={{ padding: '20px', borderRadius: '16px', borderLeft: '5px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div>
            <span style={{ fontSize: '11.5px', color: 'var(--teks-redup)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px' }}>🏆 Top Performer</span>
            <h2 style={{ margin: '6px 0 0 0', color: '#b45309', fontSize: '17px', fontWeight: 900, lineHeight: 1.3 }}>
              {summaryStats.topPerformer
                ? `${summaryStats.topPerformer.nama}`
                : 'Belum ada'}
            </h2>
            {summaryStats.topPerformer && (
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#d97706', marginTop: '2px' }}>
                Total: {(summaryStats.topPerformer.totalPlan + summaryStats.topPerformer.totalAktual).toFixed(1)} jam
              </div>
            )}
          </div>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
            <Award size={26} />
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div style={{ display: 'flex', gap: '10px', background: 'var(--krem)', padding: '6px', borderRadius: '16px', border: '1px solid var(--garis)', width: 'fit-content' }}>
        <button
          type="button"
          onClick={() => setTab('input')}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            background: tab === 'input' ? 'linear-gradient(135deg, var(--oranye) 0%, #b8541e 100%)' : 'transparent',
            color: tab === 'input' ? '#ffffff' : 'var(--teks-redup)',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: tab === 'input' ? '0 3px 12px rgba(221, 107, 40, 0.3)' : 'none',
            display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Clock size={18} />
          📝 Input & Daftar Personil
        </button>
        <button
          type="button"
          onClick={() => setTab('grafik')}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            background: tab === 'grafik' ? 'linear-gradient(135deg, var(--hijau) 0%, #155331 100%)' : 'transparent',
            color: tab === 'grafik' ? '#ffffff' : 'var(--teks-redup)',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: tab === 'grafik' ? '0 3px 12px rgba(29, 111, 66, 0.3)' : 'none',
            display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <BarChart3 size={18} />
          📊 Grafik & Rekapitulasi
        </button>
      </div>

      {/* TAB: INPUT */}
      {tab === 'input' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', alignItems: 'start' }}>
          
          {/* KOLOM KIRI: FORM INPUT */}
          <div className="kartu" style={{ 
            padding: '26px', 
            borderRadius: '20px', 
            border: '1px solid var(--garis)', 
            background: 'var(--kertas)', 
            boxShadow: '0 6px 25px rgba(0,0,0,0.03)',
            position: 'sticky',
            top: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Clock size={22} style={{ color: 'var(--oranye)' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--teks)', margin: 0 }}>Form Jam Kerja</h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--teks-redup)', marginBottom: '18px', lineHeight: 1.4 }}>
              Pilih personil pada daftar di sebelah kanan, atau cari nama untuk mencatat jam target & aktual.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* SELECTED USER BANNER / SEARCH FIELD */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--teks)', display: 'block', marginBottom: '6px' }}>
                  Personil yang Dipilih:
                </label>
                
                {selectedUser ? (
                  <div style={{ 
                    padding: '14px 16px', 
                    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', 
                    border: '1.5px solid #22c55e', 
                    borderRadius: '14px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#15803d', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px' }}>
                        {selectedUser.nama.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 900, color: '#14532d', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {selectedUser.nama}
                          <span style={{ fontSize: '11px', background: '#fff', color: '#166534', padding: '2px 8px', borderRadius: '10px', fontWeight: 800, border: '1px solid #86efac' }}>
                            {SHIFT_LABELS[selectedUser.shift] || selectedUser.shift}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600, marginTop: '2px' }}>
                          Bulan ini — Plan: <b>{selectedUser.totalPlan.toFixed(1)}h</b> | Aktual: <b>{selectedUser.totalAktual.toFixed(1)}h</b>
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSelectedUser(null)} 
                      style={{ border: 'none', background: '#ffffff', color: '#dc2626', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                      title="Batalkan Pilihan Personil"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div style={{
                    padding: '16px',
                    borderRadius: '14px',
                    border: '2px dashed var(--garis)',
                    background: 'var(--krem)',
                    textAlign: 'center',
                    color: 'var(--teks-redup)',
                    fontSize: '13.5px',
                    fontWeight: 600
                  }}>
                    👈 Belum ada personil terpilih. Klik salah satu kartu nama pada daftar personil di samping!
                  </div>
                )}
              </div>

              {/* INPUT TANGGAL & TARGET */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--teks)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                    <Calendar size={14} /> Tanggal Overtime:
                  </label>
                  <input 
                    type="date" 
                    value={tanggal} 
                    onChange={(e) => setTanggal(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid var(--garis)', fontSize: '14px', fontWeight: 600, background: '#fff', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--teks)', display: 'block', marginBottom: '6px' }}>
                    Jam Target (Jam):
                  </label>
                  <input 
                    type="number" min="0" step="0.5" placeholder="cth: 2.0" 
                    value={jamRencana} onChange={(e) => setJamRencana(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid var(--garis)', fontSize: '14px', fontWeight: 600, background: '#fff', outline: 'none' }}
                  />
                </div>
              </div>

              {/* INPUT JAM AKTUAL */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--teks)', display: 'block', marginBottom: '6px' }}>
                  Jam Aktual Kerja (Jam):
                </label>
                <input 
                  type="number" min="0" step="0.5" placeholder="cth: 2.5" 
                  value={jamAktual} onChange={(e) => setJamAktual(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid var(--garis)', fontSize: '14px', fontWeight: 600, background: '#fff', outline: 'none' }}
                />
              </div>

              {/* TOMBOL SUBMIT */}
              <button 
                type="submit" 
                disabled={submitting || !selectedUser} 
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: !selectedUser ? '#cbd5e1' : 'linear-gradient(135deg, var(--hijau) 0%, #155331 100%)',
                  color: !selectedUser ? '#64748b' : '#ffffff',
                  border: 'none', padding: '14px', borderRadius: '14px', fontWeight: 800, fontSize: '15px',
                  cursor: !selectedUser ? 'not-allowed' : 'pointer',
                  boxShadow: !selectedUser ? 'none' : '0 6px 18px rgba(29, 111, 66, 0.3)',
                  transition: 'all 0.2s', marginTop: '4px'
                }}
              >
                <Save size={18} />
                {submitting ? 'Menyimpan ke Database...' : 'Simpan Jam Overtime'}
              </button>
            </form>
          </div>

          {/* KOLOM KANAN: DAFTAR PERSONIL DENGAN SCROLL BOX BERSAHAJUTNYA */}
          <div className="kartu" style={{ 
            padding: '24px 26px', 
            borderRadius: '20px', 
            border: '1px solid var(--garis)', 
            background: 'var(--kertas)',
            boxShadow: '0 6px 25px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={22} style={{ color: 'var(--oranye)' }} />
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--teks)', margin: 0 }}>
                  Daftar Personil Maintenance
                </h2>
                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 800 }}>
                  {filteredUsers.length} Orang
                </span>
              </div>
            </div>

            {/* SEARCH BAR & SHIFT PILL FILTERS (MENGHILANGKAN NEED SCROLL PANJANG) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', background: 'var(--krem)', padding: '14px', borderRadius: '16px', border: '1px solid var(--garis)' }}>
              {/* Search Field */}
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--teks-redup)' }} />
                <input
                  type="text"
                  placeholder="Ketik nama personil untuk menyaring cepat..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '10px', border: '1px solid var(--garis)', fontSize: '13.5px', background: '#fff', outline: 'none' }}
                />
                {searchInput && (
                  <button type="button" onClick={() => setSearchInput('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: 'var(--teks-redup)', cursor: 'pointer', fontSize: '14px', fontWeight: 800 }}>✕</button>
                )}
              </div>

              {/* Shift Switcher Pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--teks-redup)', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Filter size={13} /> Filter Shift:
                </span>
                {[
                  { id: 'ALL', label: 'Semua Shift', icon: '🌐', count: users.length },
                  { id: 'Nonshift', label: 'Nonshift', icon: '🕐', count: (usersByShift.Nonshift || []).length },
                  { id: 'Shift_A', label: 'Shift A', icon: '🌅', count: (usersByShift.Shift_A || []).length },
                  { id: 'Shift_B', label: 'Shift B', icon: '🌙', count: (usersByShift.Shift_B || []).length }
                ].map(item => {
                  const active = selectedShiftFilter === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedShiftFilter(item.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 800,
                        border: active ? 'none' : '1px solid var(--garis)',
                        background: active ? 'var(--teks)' : '#ffffff',
                        color: active ? '#ffffff' : 'var(--teks-redup)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{item.icon} {item.label}</span>
                      <span style={{ background: active ? 'rgba(255,255,255,0.2)' : 'var(--krem)', padding: '1px 7px', borderRadius: '10px', fontSize: '11px' }}>
                        {item.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* KOTAK GRID USER DENGAN BATAS TINGGI (SCROLL DALAM BOX, TANPA SCROLL WEB PANJANG) */}
            <div style={{ 
              maxHeight: '440px', 
              overflowY: 'auto', 
              paddingRight: '6px',
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', 
              gap: '10px',
              alignContent: 'start'
            }}>
              {filteredUsers.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '40px 20px', textAlign: 'center', color: 'var(--teks-redup)', background: 'var(--krem)', borderRadius: '16px', border: '1px dashed var(--garis)' }}>
                  <UserCheck size={36} style={{ color: 'var(--teks-redup)', opacity: 0.5, margin: '0 auto 10px auto' }} />
                  <p style={{ fontWeight: 800, fontSize: '14.5px', color: 'var(--teks)' }}>Tidak Ada Personil Yang Sesuai</p>
                  <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>Coba ubah kata kunci pencarian atau ganti filter shift di atas.</p>
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = selectedUser?.id === u.id
                  const badgeColor = u.shift === 'Nonshift' ? '#6366f1' : u.shift === 'Shift_A' ? '#d97706' : '#15803d'
                  const badgeBg = u.shift === 'Nonshift' ? '#e0e7ff' : u.shift === 'Shift_A' ? '#fef3c7' : '#dcfce7'

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUser(u)}
                      style={{
                        padding: '12px 14px',
                        border: isSelected ? '2px solid #22c55e' : '1px solid var(--garis)',
                        borderRadius: '14px',
                        background: isSelected ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        textAlign: 'left',
                        boxShadow: isSelected ? '0 4px 14px rgba(34, 197, 94, 0.2)' : '0 2px 5px rgba(0,0,0,0.02)',
                        transition: 'all 0.15s',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      className="hover-row"
                    >
                      {isSelected && (
                        <div style={{ position: 'absolute', top: 0, right: 0, background: '#22c55e', color: '#fff', padding: '2px 8px', borderBottomLeftRadius: '10px', fontSize: '10px', fontWeight: 900 }}>
                          DIPILIH ✓
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingRight: isSelected ? '55px' : '0' }}>
                        <span style={{ fontWeight: 800, fontSize: '13.5px', color: isSelected ? '#15803d' : 'var(--teks)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {u.nama}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ fontSize: '11px', background: badgeBg, color: badgeColor, padding: '2px 8px', borderRadius: '8px', fontWeight: 800 }}>
                          {SHIFT_LABELS[u.shift] || u.shift}
                        </span>
                        <span style={{ fontSize: '11.5px', color: 'var(--teks-redup)', fontWeight: 600 }}>
                          Plan: <b style={{ color: 'var(--teks)' }}>{u.totalPlan.toFixed(1)}h</b> | Akt: <b style={{ color: 'var(--oranye)' }}>{u.totalAktual.toFixed(1)}h</b>
                        </span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--teks-redup)', marginTop: '12px', textAlign: 'center', fontStyle: 'italic' }}>
              💡 Tips: Gulir di dalam area daftar di atas untuk melihat nama lainnya tanpa memperpanjang layar halaman web.
            </div>
          </div>
        </div>
      )}

      {/* TAB: GRAFIK */}
      {tab === 'grafik' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {loading ? (
            <div className="kartu" style={{ padding: '60px', textAlign: 'center' }}>
              <RefreshCw size={32} className="spin-animation" style={{ margin: '0 auto 12px auto', color: 'var(--oranye)', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontWeight: 700 }}>Memuat Data Grafik Overtime...</p>
            </div>
          ) : (
            <>
              {/* 3 Chart per Shift */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
                {Object.entries(SHIFT_LABELS).map(([shiftKey, shiftLabel]) => {
                  const shiftUsers = usersByShift[shiftKey] || []
                  if (shiftUsers.length === 0) return (
                    <div key={shiftKey} className="kartu" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '18px', border: '1px solid var(--garis)' }}>
                      <BarChart3 size={36} style={{ color: 'var(--teks-redup)', opacity: 0.4, margin: '0 auto 10px auto' }} />
                      <p style={{ fontWeight: 800, fontSize: '15px', color: 'var(--teks)' }}>{shiftLabel}</p>
                      <p style={{ fontSize: '13px', color: 'var(--teks-redup)' }}>Belum ada pencatan overtime pada {shiftLabel}</p>
                    </div>
                  )
                  return (
                    <div key={shiftKey} className="kartu" style={{ padding: '22px', borderRadius: '18px', border: '1px solid var(--garis)', background: 'var(--kertas)' }}>
                      <Bar
                        data={buildChartData(shiftKey)}
                        options={chartOptions(`Akumulasi Jam Overtime (${shiftLabel})`)}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Tabel Rekap */}
              <div className="kartu" style={{ padding: '0', borderRadius: '20px', border: '1px solid var(--garis)', background: 'var(--kertas)', overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', background: 'var(--krem)', borderBottom: '1px solid var(--garis)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--teks)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} style={{ color: 'var(--oranye)' }} />
                    Rekapitulasi Lengkap Bulan {new Date(bulan + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </h3>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--teks-redup)' }}>
                    Total: {users.length} Personil
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--krem)', borderBottom: '2px solid var(--garis)' }}>
                        <th style={{ padding: '14px 22px', fontSize: '12.5px', fontWeight: 800, color: 'var(--teks-redup)', textTransform: 'uppercase' }}>Nama Personil</th>
                        <th style={{ padding: '14px 22px', fontSize: '12.5px', fontWeight: 800, color: 'var(--teks-redup)', textTransform: 'uppercase' }}>Shift Kerja</th>
                        <th style={{ padding: '14px 22px', fontSize: '12.5px', fontWeight: 800, color: 'var(--teks-redup)', textTransform: 'uppercase', textAlign: 'right' }}>Target Plan</th>
                        <th style={{ padding: '14px 22px', fontSize: '12.5px', fontWeight: 800, color: 'var(--teks-redup)', textTransform: 'uppercase', textAlign: 'right' }}>Aktual Kerja</th>
                        <th style={{ padding: '14px 22px', fontSize: '12.5px', fontWeight: 800, color: 'var(--teks-redup)', textTransform: 'uppercase', textAlign: 'right' }}>Pencapaian (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(SHIFT_LABELS).map(([shiftKey, shiftLabel]) =>
                        (usersByShift[shiftKey] || []).map((u, index) => {
                          const badgeColor = u.shift === 'Nonshift' ? '#6366f1' : u.shift === 'Shift_A' ? '#d97706' : '#15803d'
                          const badgeBg = u.shift === 'Nonshift' ? '#e0e7ff' : u.shift === 'Shift_A' ? '#fef3c7' : '#dcfce7'
                          
                          return (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--garis)' }}>
                              <td style={{ padding: '14px 22px', fontWeight: 800, color: 'var(--teks)', fontSize: '14px' }}>{u.nama}</td>
                              <td style={{ padding: '14px 22px' }}>
                                <span style={{ fontSize: '12px', background: badgeBg, color: badgeColor, padding: '4px 10px', borderRadius: '12px', fontWeight: 800 }}>
                                  {shiftLabel}
                                </span>
                              </td>
                              <td style={{ padding: '14px 22px', textAlign: 'right', fontWeight: 700, fontSize: '14px' }}>{u.totalPlan.toFixed(1)} Jam</td>
                              <td style={{ padding: '14px 22px', textAlign: 'right', fontWeight: 700, fontSize: '14px', color: 'var(--oranye)' }}>{u.totalAktual.toFixed(1)} Jam</td>
                              <td style={{ padding: '14px 22px', textAlign: 'right', fontWeight: 800, fontSize: '14px', color: u.totalPlan > 0 && u.totalAktual >= u.totalPlan ? '#166534' : 'var(--teks-redup)' }}>
                                {u.totalPlan > 0 ? `${((u.totalAktual / u.totalPlan) * 100).toFixed(0)}%` : '—'}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--krem)', fontWeight: 900, borderTop: '2px solid var(--garis)', fontSize: '15px' }}>
                        <td colSpan={2} style={{ padding: '16px 22px', color: 'var(--teks)' }}>TOTAL KESELURUHAN</td>
                        <td style={{ padding: '16px 22px', textAlign: 'right', color: 'var(--hijau-tua)' }}>{summaryStats.totalPlan.toFixed(1)} Jam</td>
                        <td style={{ padding: '16px 22px', textAlign: 'right', color: 'var(--oranye)' }}>{summaryStats.totalAktual.toFixed(1)} Jam</td>
                        <td style={{ padding: '16px 22px', textAlign: 'right', color: '#4338ca' }}>
                          {summaryStats.totalPlan > 0
                            ? `${((summaryStats.totalAktual / summaryStats.totalPlan) * 100).toFixed(0)}%`
                            : '—'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
