'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { showToast } from '@/components/ui/Toast'
import { confirmDialog } from '@/components/ui/ConfirmModal'
import { Database, FileSpreadsheet, Calendar, ShieldAlert, CheckSquare } from 'lucide-react'

const MONTHS = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
]

export default function PengaturanSistemPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // State untuk Filter Export Database Master
  const currentYear = new Date().getFullYear()
  const [startMonth, setStartMonth] = useState('1')
  const [startYear, setStartYear] = useState(String(currentYear))
  const [endMonth, setEndMonth] = useState(String(new Date().getMonth() + 1))
  const [endYear, setEndYear] = useState(String(currentYear))
  const [allTime, setAllTime] = useState(false)
  const [exporting, setExporting] = useState(false)

  const yearsList = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2]

  useEffect(() => {
    if (session?.user?.role === 'SUPER_ADMIN') {
      fetch('/api/system-settings')
        .then(res => res.json())
        .then(data => {
          if (data.settings) {
            const mm = data.settings.find((s: any) => s.key === 'maintenance_mode')
            if (mm && mm.value === 'true') {
              setMaintenanceMode(true)
            }
          }
        })
        .finally(() => setLoading(false))
    }
  }, [session])

  if (status === 'loading') return <div style={{ padding: '20px' }}>Loading...</div>

  if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
    return (
      <div className="kartu" style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Akses Ditolak</h2>
        <p>Hanya Super Admin yang diizinkan untuk mengakses halaman ini.</p>
        <button className="tombol-utama" onClick={() => router.push('/dashboard')}>Kembali ke Dashboard</button>
      </div>
    )
  }

  const toggleMaintenance = async () => {
    const newValue = !maintenanceMode
    if (newValue) {
      const isConfirmed = await confirmDialog({
        title: 'Aktifkan Maintenance Mode?',
        message: 'AWAS! Mengaktifkan Maintenance Mode akan memblokir semua user (kecuali Super Admin) dari mengakses sistem. Lanjutkan?',
        type: 'danger',
        confirmText: 'Ya, Aktifkan'
      })
      if (!isConfirmed) return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/system-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'maintenance_mode', value: String(newValue) })
      })

      if (res.ok) {
        setMaintenanceMode(newValue)
        showToast(newValue ? 'Sistem sekarang dalam Maintenance Mode' : 'Maintenance Mode dinonaktifkan', 'sukses')
      } else {
        showToast('Gagal mengubah pengaturan', 'error')
      }
    } catch (error) {
      console.error(error)
      showToast('Terjadi kesalahan', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleExportMaster = async () => {
    setExporting(true)
    try {
      const query = new URLSearchParams({
        allTime: String(allTime),
        startMonth,
        startYear,
        endMonth,
        endYear
      })
      const res = await fetch(`/api/system-settings/export-master?${query.toString()}`)
      if (!res.ok) {
        const d = await res.json()
        showToast(d.error || 'Gagal mendownload Excel Database Master', 'error')
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const filename = allTime 
        ? `Database_Master_Sugity_All_Time.xlsx` 
        : `Database_Master_Sugity_${startYear}-${startMonth.padStart(2,'0')}_to_${endYear}-${endMonth.padStart(2,'0')}.xlsx`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      showToast('✅ Berhasil mengekspor Database Master Keseluruhan ke Excel!', 'sukses')
    } catch (err) {
      console.error('Export Error:', err)
      showToast('Terjadi kesalahan jaringan saat mengunduh Excel', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="kartu" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--hijau)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          ⚙️ Pengaturan Sistem Super Admin
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--teks)', opacity: 0.8 }}>
          Pusat kontrol eksekutif dan utilitas manajemen master data keseluruhan sistem Sugity Mold Maintenance.
        </p>
      </div>
      
      {loading ? (
        <p>Loading pengaturan...</p>
      ) : (
        <>
          {/* KARTU EXPORT DATABASE MASTER KESELURUHAN */}
          <div style={{
            border: '2px solid var(--header-border, var(--garis))',
            borderRadius: '16px',
            padding: '24px',
            background: 'var(--kertas)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
            transition: 'all 0.3s'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
              <div style={{ 
                padding: '12px', 
                background: 'var(--hijau-bg)', 
                color: 'var(--hijau)', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Database size={28} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--teks)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Export Database Master Keseluruhan
                  <span style={{ fontSize: '11px', background: 'var(--hijau)', color: '#fff', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>EXCEL 8 SHEETS</span>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--teks)', opacity: 0.8, lineHeight: '1.5', maxWidth: '680px' }}>
                  Unduh seluruh riwayat perbaikan, daftar checksheet, master mold book, data akun pengguna, jam lembur (overtime), rekap jadwal maintenance, katalog sparepart, hingga audit log ke dalam **1 file Excel multi-sheet**.
                </p>
              </div>
            </div>

            {/* BOX FILTER RENTANG WAKTU */}
            <div style={{
              background: 'var(--hijau-bg)',
              padding: '18px',
              borderRadius: '12px',
              border: '1px solid var(--garis)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', color: 'var(--teks)' }}>
                  <Calendar size={18} style={{ color: 'var(--hijau)' }} />
                  Filter Rentang Waktu (Dari Kapan Sampai Kapan)
                </div>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--teks)' }}>
                  <input 
                    type="checkbox" 
                    checked={allTime} 
                    onChange={e => setAllTime(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span>Semua Waktu (All Time Dump)</span>
                </label>
              </div>

              {!allTime && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  {/* DARI KAPAN */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--teks)', textTransform: 'uppercase', opacity: 0.7 }}>
                      🟢 Dari Bulan & Tahun Mulai:
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select 
                        value={startMonth}
                        onChange={e => setStartMonth(e.target.value)}
                        className="form-control"
                        style={{ flex: 3, padding: '10px', borderRadius: '8px', background: 'var(--kertas)', color: 'var(--teks)', border: '1px solid var(--garis)' }}
                      >
                        {MONTHS.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <select 
                        value={startYear}
                        onChange={e => setStartYear(e.target.value)}
                        className="form-control"
                        style={{ flex: 2, padding: '10px', borderRadius: '8px', background: 'var(--kertas)', color: 'var(--teks)', border: '1px solid var(--garis)' }}
                      >
                        {yearsList.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* SAMPAI KAPAN */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--teks)', textTransform: 'uppercase', opacity: 0.7 }}>
                      🔴 Sampai Bulan & Tahun Selesai:
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select 
                        value={endMonth}
                        onChange={e => setEndMonth(e.target.value)}
                        className="form-control"
                        style={{ flex: 3, padding: '10px', borderRadius: '8px', background: 'var(--kertas)', color: 'var(--teks)', border: '1px solid var(--garis)' }}
                      >
                        {MONTHS.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <select 
                        value={endYear}
                        onChange={e => setEndYear(e.target.value)}
                        className="form-control"
                        style={{ flex: 2, padding: '10px', borderRadius: '8px', background: 'var(--kertas)', color: 'var(--teks)', border: '1px solid var(--garis)' }}
                      >
                        {yearsList.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
              {allTime && (
                <div style={{ padding: '8px 12px', background: 'var(--kertas)', borderRadius: '8px', border: '1px solid var(--garis)', color: 'var(--teks)', fontSize: '13px', fontStyle: 'italic' }}>
                  ℹ️ Mode <b>All Time</b> diaktifkan: Semua riwayat dari awal penerapan sistem hingga hari ini akan dimasukkan tanpa pemodelan batas tanggal.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={handleExportMaster}
                disabled={exporting}
                style={{
                  padding: '12px 28px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--hijau) 0%, var(--hijau-tua) 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: exporting ? 'not-allowed' : 'pointer',
                  opacity: exporting ? 0.75 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.2s transform'
                }}
              >
                <FileSpreadsheet size={20} />
                {exporting ? '⏳ Mengekspor Database Master...' : '📥 Export Master Database (Excel)'}
              </button>
            </div>
          </div>

          {/* KARTU MAINTENANCE MODE */}
          <div style={{
            border: '1px solid var(--garis)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            background: maintenanceMode ? 'rgba(229, 62, 62, 0.08)' : 'var(--kertas)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            transition: 'background 0.3s'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', maxWidth: '600px' }}>
              <div style={{ 
                padding: '12px', 
                background: maintenanceMode ? '#fee2e2' : 'var(--hijau-bg)', 
                color: maintenanceMode ? '#dc2626' : 'var(--hijau)', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldAlert size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--teks)', marginBottom: '6px' }}>Maintenance Mode (Lockdown System)</h3>
                <p style={{ fontSize: '13px', color: 'var(--teks)', opacity: 0.8, lineHeight: '1.5' }}>
                  Jika diaktifkan, seluruh pengguna kecuali Super Admin akan diblokir dari mengakses dashboard dan fitur lainnya. Gunakan saat melakukan pemeliharaan server database atau update sistem krusial.
                </p>
              </div>
            </div>
            
            <button 
              onClick={toggleMaintenance}
              disabled={saving}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: maintenanceMode ? '#e53e3e' : '#38a169',
                color: '#fff',
                fontWeight: 700,
                fontSize: '14px',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {saving ? 'Menyimpan...' : maintenanceMode ? '🔓 Nonaktifkan Maintenance' : '🔒 Aktifkan Maintenance'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
