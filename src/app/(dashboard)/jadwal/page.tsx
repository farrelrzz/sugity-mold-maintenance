'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { showToast } from '@/components/ui/Toast'
import Pagination from '@/components/ui/Pagination'
import { Trash2, PlayCircle, AlertTriangle, X, Calendar, User, Wrench } from 'lucide-react'

interface MoldSpec {
  noMold: string;
  model?: string;
  customer?: string;
  part?: string;
}

const HARI_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export default function JadwalPage() {
  const { data: session } = useSession()
  const [jadwal, setJadwal] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModalItem, setDeleteModalItem] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(8)

  // State untuk form Tambah Jadwal
  const [showForm, setShowForm] = useState(false)
  const [bulan, setBulan] = useState(() => new Date().toISOString().slice(0, 7))
  const [mingguKe, setMingguKe] = useState(0)
  const [tanggal, setTanggal] = useState('')
  const [hari, setHari] = useState('Senin')
  const [jenis, setJenis] = useState('OH MOLD')
  const [catatan, setCatatan] = useState('')

  // Mold Search Autocomplete State
  const [moldSearch, setMoldSearch] = useState('')
  const [moldOptions, setMoldOptions] = useState<MoldSpec[]>([])
  const [showMoldDropdown, setShowMoldDropdown] = useState(false)
  const [selectedMold, setSelectedMold] = useState<MoldSpec | null>(null)
  const moldDropdownRef = useRef<HTMLDivElement>(null)

  // PIC List State
  const [picList, setPicList] = useState<any[]>([])
  const [selectedPicId, setSelectedPicId] = useState('')

  const [submitting, setSubmitting] = useState(false)

  // Helper kalkulasi minggu di dalam bulan
  const getWeeksInMonth = (bulanYYYYMM: string) => {
    const [tahun, bln] = bulanYYYYMM.split('-').map(Number)
    const weeks: Date[][] = []
    
    let cursor = new Date(tahun, bln - 1, 1)
    const selisih = cursor.getDay() === 0 ? -6 : 1 - cursor.getDay()
    cursor.setDate(cursor.getDate() + selisih)
    
    for (let i = 0; i < 6; i++) {
      let hariDiBulan = 0
      const weekDays: Date[] = []
      
      for (let d = 0; d < 7; d++) {
        const h = new Date(cursor)
        weekDays.push(h)
        if (h.getFullYear() === tahun && h.getMonth() === bln - 1) {
          hariDiBulan++
        }
        cursor.setDate(cursor.getDate() + 1)
      }
      if (hariDiBulan >= 1) {
        weeks.push(weekDays)
      }
    }
    return weeks
  }

  const weeksOfSelectedMonth = getWeeksInMonth(bulan)
  const selectedWeekDays = weeksOfSelectedMonth[mingguKe] || []

  const formatTanggalLokal = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  // Update tanggal dan hari saat minggu atau bulan berganti
  useEffect(() => {
    if (selectedWeekDays.length > 0) {
      // Cari hari kerja pertama (Senin - Jumat) yang ada di bulan ini atau default ke hari pertama
      const defaultDay = selectedWeekDays.find(d => d.getDay() !== 0 && d.getDay() !== 6) || selectedWeekDays[0]
      const strDate = formatTanggalLokal(defaultDay)
      setTanggal(strDate)
      setHari(HARI_NAMES[defaultDay.getDay()])
    }
  }, [mingguKe, bulan])

  // Handle klik di luar dropdown mold
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (moldDropdownRef.current && !moldDropdownRef.current.contains(e.target as Node)) {
        setShowMoldDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Fetch Mold Options when typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const url = moldSearch.trim()
        ? `/api/mold-book?query=${encodeURIComponent(moldSearch)}&limit=50`
        : `/api/mold-book?limit=50`
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setMoldOptions(data)
        })
        .catch(err => console.error('Error fetching mold:', err))
    }, 200)
    return () => clearTimeout(timer)
  }, [moldSearch])

  // Fetch Users & PICs
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.users && Array.isArray(data.users)) {
          // Tampilkan semua user teknisi / member PIC
          const pics = data.users.filter((u: any) => u.role === 'PIC' || u.shift !== 'Nonshift')
          setPicList(pics)
          if (pics.length > 0) {
            setSelectedPicId(String(pics[0].id))
          }
        }
      })
      .catch(err => console.error('Error fetching PIC list:', err))
  }, [])

  const fetchJadwal = () => {
    setLoading(true)
    fetch(`/api/jadwal-mingguan?search=${encodeURIComponent(search)}&sortBy=tanggalRencana&sortOrder=${sortOrder}`)
      .then(res => res.json())
      .then(data => {
        if (data.jadwal) {
          setJadwal(data.jadwal)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchJadwal()
    }, 500)
    return () => clearTimeout(delayDebounce)
  }, [search, sortOrder])

  const handleSimpanJadwal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMold) {
      showToast('⚠️ Pilih mold dari daftar pencarian terlebih dahulu!', 'error')
      return
    }
    if (!selectedPicId) {
      showToast('⚠️ Pilih PIC/Teknisi penanggung jawab!', 'error')
      return
    }
    if (!tanggal) {
      showToast('⚠️ Tanggal rencana wajib dipilih!', 'error')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        tanggalRencana: tanggal,
        noMold: selectedMold.noMold,
        picId: Number(selectedPicId),
        hari: hari,
        jenis: jenis,
        catatan: catatan
      }
      const res = await fetch('/api/jadwal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Gagal menyimpan jadwal')
      }
      showToast('✅ Jadwal maintenance berhasil ditambahkan!', 'sukses')
      // Reset form ringan & tutup
      setSelectedMold(null)
      setMoldSearch('')
      setCatatan('')
      setShowForm(false)
      fetchJadwal()
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan jaringan', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const executeDeleteJadwal = async () => {
    if (!deleteModalItem) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/jadwal/${deleteModalItem.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Gagal menghapus jadwal')
      }
      showToast('🗑️ Jadwal berhasil dihapus ✓', 'sukses')
      setDeleteModalItem(null)
      fetchJadwal()
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus jadwal', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="kartu" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--hijau-tua)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            📅 Jadwal Maintenance Mold
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--teks-redup)', margin: '4px 0 0 0' }}>
            Rencana pemeriksaan mingguan. Status berubah dinamis hingga selesai dievaluasi & approve ADM.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: showForm ? '#64748b' : 'var(--hijau-tua)',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease'
            }}
          >
            {showForm ? '✕ Tutup Form' : '+ Tambah Jadwal Maintenance'}
          </button>

          <input
            type="text"
            placeholder="Cari Mold, Jenis, Catatan..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              minWidth: '220px',
              outline: 'none',
              background: '#fff',
              color: '#1e293b',
              fontSize: '14px'
            }}
          />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              color: '#1e293b',
              outline: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            <option value="asc">Tanggal: Terdahulu (dd/mm/yyyy)</option>
            <option value="desc">Tanggal: Terbaru (dd/mm/yyyy)</option>
          </select>
        </div>
      </div>

      {/* Form Input Tambah Jadwal (TL / GL / CL / ADM / PIC) */}
      {showForm && (
        <form onSubmit={handleSimpanJadwal} style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b style={{ color: 'var(--hijau-tua)', fontSize: '16px' }}>📝 Form Rencana Maintenance Mingguan</b>
            <span style={{ fontSize: '12px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
              Akses: TL / GL / CL / ADM & Tim Maintenance
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {/* Bulan & Minggu */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Bulan Rencana</label>
              <input
                type="month"
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Pilih Minggu Ke-</label>
              <select
                value={mingguKe}
                onChange={(e) => setMingguKe(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', cursor: 'pointer' }}
              >
                {weeksOfSelectedMonth.map((week, i) => (
                  <option key={i} value={i}>
                    Minggu ke-{i + 1} ({week.length > 0 ? `${week[0].getDate()}/${week[0].getMonth()+1} - ${week[week.length-1].getDate()}/${week[week.length-1].getMonth()+1}` : ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Hari & Tanggal Spesifik dalam minggu itu */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Hari & Tanggal Pelaksaanaan</label>
              <select
                value={tanggal}
                onChange={(e) => {
                  const val = e.target.value
                  setTanggal(val)
                  const d = new Date(val)
                  setHari(HARI_NAMES[d.getDay()])
                }}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: 'var(--hijau-tua)' }}
              >
                {selectedWeekDays.map((d, i) => {
                  const str = formatTanggalLokal(d)
                  return (
                    <option key={i} value={str}>
                      {HARI_NAMES[d.getDay()]} ({d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })})
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Nomor Mold Autocomplete */}
            <div ref={moldDropdownRef} style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Nomor Mold</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Cari & Pilih Mold..."
                  value={selectedMold ? `${selectedMold.noMold} (${selectedMold.model || 'Model -'})` : moldSearch}
                  onChange={(e) => {
                    setSelectedMold(null)
                    setMoldSearch(e.target.value)
                    setShowMoldDropdown(true)
                  }}
                  onFocus={() => setShowMoldDropdown(true)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: selectedMold ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    background: selectedMold ? '#f0fdf4' : '#fff',
                    color: selectedMold ? '#15803d' : '#1e293b',
                    fontWeight: selectedMold ? 700 : 400,
                    fontSize: '14px'
                  }}
                />
                {selectedMold && (
                  <span
                    onClick={() => { setSelectedMold(null); setMoldSearch(''); }}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#dc2626', fontWeight: 800 }}
                    title="Hapus pilihan"
                  >
                    ✕
                  </span>
                )}
              </div>

              {showMoldDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 999, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                  {moldOptions.length === 0 ? (
                    <div style={{ padding: '10px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>Mold tidak ditemukan</div>
                  ) : (
                    moldOptions.map(m => (
                      <div
                        key={m.noMold}
                        onClick={() => {
                          setSelectedMold(m)
                          setShowMoldDropdown(false)
                        }}
                        style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '13px', transition: 'background 0.15s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                      >
                        <b style={{ color: 'var(--oranye-tua)', fontSize: '14px' }}>{m.noMold}</b> 
                        <span style={{ color: '#64748b', marginLeft: '6px' }}>&mdash; {m.model || '-'} ({m.customer || 'No Cust'})</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Jenis Maintenance */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Jenis Maintenance</label>
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="OH MOLD">OH MOLD</option>
                <option value="B/M">B/M</option>
                <option value="I/M">I/M</option>
                <option value="PM">PM</option>
                <option value="BM CHUCK">BM CHUCK</option>
                <option value="LAINNYA">LAINNYA</option>
              </select>
            </div>

            {/* Pilih PIC Ditugaskan */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>PIC Ditugaskan</label>
              <select
                value={selectedPicId}
                onChange={(e) => setSelectedPicId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', cursor: 'pointer' }}
              >
                {picList.length === 0 ? (
                  <option value="">Memuat data PIC...</option>
                ) : (
                  picList.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nama} ({u.shift || 'Member'})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Catatan */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Catatan / Instruksi Khusus (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Fokus cek heater zone 2 & cooling cavitation..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ background: 'var(--hijau-tua)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Menyimpan...' : '💾 Simpan Jadwal Maintenance'}
            </button>
          </div>
        </form>
      )}

      {/* Table Jadwal */}
      <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 800, color: '#475569', letterSpacing: '0.5px' }}>TANGGAL RENCANA</th>
              <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 800, color: '#475569', letterSpacing: '0.5px' }}>NO MOLD</th>
              <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 800, color: '#475569', letterSpacing: '0.5px' }}>JENIS MAINTENANCE</th>
              <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 800, color: '#475569', letterSpacing: '0.5px' }}>PIC</th>
              <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 800, color: '#475569', letterSpacing: '0.5px' }}>CATATAN</th>
              <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 800, color: '#475569', letterSpacing: '0.5px' }}>STATUS</th>
              <th style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 800, color: '#475569', letterSpacing: '0.5px', textAlign: 'center' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                  ⌛ Memuat jadwal maintenance mold...
                </td>
              </tr>
            ) : jadwal.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '15px' }}>
                  Tidak ada jadwal maintenance yang ditemukan.
                </td>
              </tr>
            ) : (
              jadwal.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((j) => {
                const isApprovedAdm = j.status === 'Sudah_Dikerjakan' || j.status === 'Sudah Dikerjakan' || j.status === 'Selesai'
                const isProses = j.status === 'Proses_Approval' || j.status === 'Proses Approval'
                const isSedang = j.status === 'Sedang_Dikerjakan' || j.status === 'Sedang Dikerjakan'
                
                let bgBadge = '#fee2e2'
                let colorBadge = '#991b1b'
                let textBadge = 'Belum Dikerjakan 🔴'

                if (isApprovedAdm) {
                  bgBadge = '#dcfce7'
                  colorBadge = '#166534'
                  textBadge = 'Selesai (Approved ADM) ✓'
                } else if (isProses) {
                  bgBadge = '#fef3c7'
                  colorBadge = '#92400e'
                  textBadge = 'Proses Approval ⏳'
                } else if (isSedang) {
                  bgBadge = '#dbeafe'
                  colorBadge = '#1e40af'
                  textBadge = 'Sedang Dikerjakan 🔵'
                }

                return (
                  <tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                      {j.hari ? `${j.hari}, ` : ''}{j.tanggalRencana ? new Date(j.tanggalRencana).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '15px', fontWeight: 800, color: 'var(--oranye-tua)' }}>{j.noMold}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                      <span style={{ background: '#e2e8f0', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>
                        {j.jenis || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>
                      👤 {j.pic?.nama || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', maxWidth: '220px' }}>
                      {j.catatan ? <i>&ldquo;{j.catatan}&rdquo;</i> : <span style={{ color: '#cbd5e1' }}>-</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontSize: '12px', 
                        fontWeight: 700,
                        background: bgBadge,
                        color: colorBadge,
                        display: 'inline-block',
                        whiteSpace: 'nowrap'
                      }}>
                        {textBadge}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            window.location.href = `/laporan/baru?noMold=${encodeURIComponent(j.noMold)}&jenis=${encodeURIComponent(j.jenis || 'OH MOLD')}&jadwalId=${j.id}`
                          }}
                          style={{
                            background: '#16a34a',
                            border: '1px solid #15803d',
                            color: '#ffffff',
                            padding: '7px 14px',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#15803d'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.transform = 'none'; }}
                          title="Kerjakan Laporan Maintenance"
                        >
                          <PlayCircle size={15} /> Kerjakan
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setDeleteModalItem(j)}
                          style={{
                            background: '#fff1f2',
                            border: '1px solid #fecdd3',
                            color: '#e11d48',
                            padding: '7px 13px',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 2px 4px rgba(225, 29, 72, 0.08)',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => { 
                            e.currentTarget.style.background = '#e11d48'; 
                            e.currentTarget.style.color = '#ffffff'; 
                            e.currentTarget.style.borderColor = '#be123c';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(225, 29, 72, 0.3)';
                          }}
                          onMouseLeave={(e) => { 
                            e.currentTarget.style.background = '#fff1f2'; 
                            e.currentTarget.style.color = '#e11d48'; 
                            e.currentTarget.style.borderColor = '#fecdd3';
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(225, 29, 72, 0.08)';
                          }}
                          title="Hapus jadwal maintenance ini"
                        >
                          <Trash2 size={15} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      
      {!loading && jadwal.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={jadwal.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemLabel="jadwal maintenance"
          pageSizeOptions={[5, 8, 15, 30]}
        />
      )}

      {/* Modal Konfirmasi Hapus Jadwal (Estetik & Rapi) */}
      {deleteModalItem && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteModalItem(null); }}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '460px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
          >
            {/* Header Dialog */}
            <div style={{ background: '#fff1f2', borderBottom: '1px solid #fecdd3', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
              <div style={{ width: 44, height: 44, borderRadius: '14px', background: '#ffe4e6', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#e11d48' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#991b1b', letterSpacing: '-0.3px' }}>
                  Konfirmasi Hapus Jadwal
                </h3>
                <span style={{ fontSize: '12.5px', color: '#e11d48', fontWeight: 600 }}>
                  Tindakan ini permanen dan tidak dapat dibatalkan
                </span>
              </div>
              <button 
                onClick={() => !deleting && setDeleteModalItem(null)}
                disabled={deleting}
                style={{ position: 'absolute', right: '20px', top: '22px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: deleting ? 'not-allowed' : 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Details */}
            <div style={{ padding: '22px 24px' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: '1.6', fontWeight: 500 }}>
                Apakah Anda yakin ingin menghapus schedule mingguan yang telah dibuat ini dari daftar antrean maintenance?
              </p>

              {/* Rincian Kartu Jadwal */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nomor Mold</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--oranye-tua)', background: '#fff', padding: '2px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                    {deleteModalItem.noMold}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#334155', fontWeight: 600 }}>
                  <Wrench size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
                  <span>Jenis: <b>{deleteModalItem.jenis || 'OH MOLD'}</b></span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#334155', fontWeight: 600 }}>
                  <Calendar size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Tanggal: <b>{deleteModalItem.hari ? `${deleteModalItem.hari}, ` : ''}{deleteModalItem.tanggalRencana ? new Date(deleteModalItem.tanggalRencana).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</b></span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#334155', fontWeight: 600 }}>
                  <User size={16} style={{ color: '#a855f7', flexShrink: 0 }} />
                  <span>PIC: <b>{deleteModalItem.pic?.nama || '-'}</b></span>
                </div>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setDeleteModalItem(null)}
                disabled={deleting}
                style={{
                  background: '#e2e8f0',
                  color: '#475569',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { if (!deleting) e.currentTarget.style.background = '#cbd5e1'; }}
                onMouseLeave={(e) => { if (!deleting) e.currentTarget.style.background = '#e2e8f0'; }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteJadwal}
                disabled={deleting}
                style={{
                  background: deleting ? '#fda4af' : '#e11d48',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  boxShadow: deleting ? 'none' : '0 4px 12px rgba(225, 29, 72, 0.35)',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => { if (!deleting) { e.currentTarget.style.background = '#be123c'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={(e) => { if (!deleting) { e.currentTarget.style.background = '#e11d48'; e.currentTarget.style.transform = 'none'; } }}
              >
                {deleting ? '⌛ Menghapus...' : <><Trash2 size={16} /> Ya, Hapus Jadwal</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

