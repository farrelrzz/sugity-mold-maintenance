'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { confirmDialog } from '@/components/ui/ConfirmModal'

export default function SparepartPage() {
  const { data: session } = useSession()
  const [spareparts, setSpareparts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string, type: 'sukses' | 'error' } | null>(null)

  const [form, setForm] = useState({ id: 0, nama: '', hargaSatuan: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canEdit = !!session?.user

  const fetchSpareparts = async () => {
    try {
      const res = await fetch('/api/sparepart')
      const data = await res.json()
      if (res.ok) setSpareparts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSpareparts()
  }, [])

  const showToast = (msg: string, type: 'sukses' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nama || !form.hargaSatuan) return showToast('Harap lengkapi semua field', 'error')

    setSubmitting(true)
    try {
      const url = isEditing ? `/api/sparepart/${form.id}` : '/api/sparepart'
      const method = isEditing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: form.nama, hargaSatuan: form.hargaSatuan })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(isEditing ? 'Sparepart berhasil diperbarui' : 'Sparepart berhasil ditambahkan', 'sukses')
        setForm({ id: 0, nama: '', hargaSatuan: '' })
        setIsEditing(false)
        fetchSpareparts()
      } else {
        showToast(data.error || 'Terjadi kesalahan', 'error')
      }
    } catch (err) {
      showToast('Gagal terhubung ke server', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (sp: any) => {
    setForm({ id: sp.id, nama: sp.nama, hargaSatuan: sp.hargaSatuan.toString() })
    setIsEditing(true)
  }

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmDialog({
      title: 'Hapus Sparepart?',
      message: 'Apakah Anda yakin ingin menghapus sparepart ini dari katalog?',
      type: 'danger',
      confirmText: 'Ya, Hapus'
    })
    if (!isConfirmed) return
    try {
      const res = await fetch(`/api/sparepart/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('Sparepart dihapus', 'sukses')
        fetchSpareparts()
      } else {
        const data = await res.json()
        showToast(data.error || 'Gagal menghapus', 'error')
      }
    } catch (err) {
      showToast('Gagal terhubung', 'error')
    }
  }

  return (
    <div className="fade-in">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'sukses' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--biru-gelap)', marginBottom: '8px' }}>
          Katalog Sparepart
        </h1>
        <p style={{ color: 'var(--teks-redup)' }}>Kelola data harga satuan sparepart untuk perhitungan M/P Cost Laporan.</p>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* FORM SECTION */}
        {canEdit && (
          <div className="kartu" style={{ flex: '1 1 350px' }}>
            <p className="label-besar">{isEditing ? 'Edit Sparepart' : 'Tambah Sparepart Baru'}</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label-input">Nama / Drawing Number</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Misal: O-Ring NBR70"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label-input">Harga Satuan (Rp)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="Misal: 15000"
                  min="0"
                  value={form.hargaSatuan}
                  onChange={(e) => setForm({ ...form, hargaSatuan: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="tombol-utama" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Tambah Sparepart')}
                </button>
                {isEditing && (
                  <button 
                    type="button" 
                    className="tombol-sekunder" 
                    onClick={() => { setIsEditing(false); setForm({ id: 0, nama: '', hargaSatuan: '' }) }}
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* LIST SECTION */}
        <div className="kartu" style={{ flex: '2 1 600px' }}>
          <p className="label-besar">Daftar Sparepart Tersimpan</p>
          {loading ? (
            <p style={{ color: 'var(--teks-redup)' }}>Memuat data...</p>
          ) : spareparts.length === 0 ? (
            <p style={{ color: 'var(--teks-redup)' }}>Belum ada data sparepart.</p>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--garis)', color: 'var(--teks-redup)' }}>
                    <th style={{ padding: '12px 8px' }}>No</th>
                    <th style={{ padding: '12px 8px' }}>Nama Sparepart</th>
                    <th style={{ padding: '12px 8px' }}>Harga Satuan</th>
                    {canEdit && <th style={{ padding: '12px 8px', textAlign: 'center' }}>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {spareparts.map((sp, idx) => (
                    <tr key={sp.id} style={{ borderBottom: '1px solid var(--garis-halus)' }}>
                      <td style={{ padding: '12px 8px', width: '50px' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>{sp.nama}</td>
                      <td style={{ padding: '12px 8px' }}>Rp {Number(sp.hargaSatuan).toLocaleString('id-ID')}</td>
                      {canEdit && (
                        <td style={{ padding: '12px 8px', textAlign: 'center', width: '120px' }}>
                          <button 
                            type="button"
                            className="pilih-btn"
                            onClick={() => handleEdit(sp)}
                            style={{ padding: '4px 8px', marginRight: '6px' }}
                          >
                            ✏️
                          </button>
                          <button 
                            type="button"
                            className="pilih-btn"
                            onClick={() => handleDelete(sp.id)}
                            style={{ padding: '4px 8px', color: 'var(--merah)', borderColor: 'var(--merah-transparan)' }}
                          >
                            🗑️
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
