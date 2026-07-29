'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { showToast } from '@/components/ui/Toast'
import Pagination from '@/components/ui/Pagination'

interface Outhouse {
  id: number
  nama: string
  alamat: string | null
  kota: string | null
}

interface MoldBookEntry {
  noMold: string
  mc: string | null
  factory: string
  part: string | null
  tonase: string | null
  customer: string | null
  model: string | null
  coreStd: string | null
  cavStd: string | null
  heaterStd: any
  outhouseId: number | null
  lokasiMold: string | null
  dimensiW: string | null
  dimensiH: string | null
  dimensiT: string | null
  fotoMold: string[] | null
  fotoProduk: string[] | null
  outhouse?: Outhouse | null
}

export default function MoldBookPage() {
  const { data: session } = useSession()
  const [molds, setMolds] = useState<MoldBookEntry[]>([])
  const [outhouses, setOuthouses] = useState<Outhouse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [factoryFilter, setFactoryFilter] = useState<'ALL' | 'F2' | 'F3' | 'F4' | 'OUTHOUSE'>('ALL')
  const [sortOption, setSortOption] = useState<'noMold_asc' | 'noMold_desc' | 'part_asc' | 'customer_asc' | 'model_asc' | 'factory_asc'>('noMold_asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)

  // Modal open states
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMold, setEditingMold] = useState<MoldBookEntry | null>(null)

  // Form states
  const [formNoMold, setFormNoMold] = useState('')
  const [formMc, setFormMc] = useState('')
  const [formPart, setFormPart] = useState('')
  const [formFactory, setFormFactory] = useState('F2') // F2, F3, F4, OUTHOUSE
  const [formTonase, setFormTonase] = useState('')
  const [formCustomer, setFormCustomer] = useState('')
  const [formModel, setFormModel] = useState('')
  const [formCoreStd, setFormCoreStd] = useState('')
  const [formCavStd, setFormCavStd] = useState('')
  const [formHeaterStd, setFormHeaterStd] = useState('')
  
  const [formDimensiW, setFormDimensiW] = useState('')
  const [formDimensiH, setFormDimensiH] = useState('')
  const [formDimensiT, setFormDimensiT] = useState('')
  
  // Outhouse states
  const [formOuthouseId, setFormOuthouseId] = useState('') // '' = none, 'NEW' = create new, else ID
  const [formOthNama, setFormOthNama] = useState('')
  const [formOthAlamat, setFormOthAlamat] = useState('')
  const [formOthKota, setFormOthKota] = useState('')

  // Photos
  const [fotoMoldPaths, setFotoMoldPaths] = useState<string[]>([])
  const [fotoMoldFiles, setFotoMoldFiles] = useState<File[]>([])
  const [fotoProdukPaths, setFotoProdukPaths] = useState<string[]>([])
  const [fotoProdukFiles, setFotoProdukFiles] = useState<File[]>([])

  const [submitting, setSubmitting] = useState(false)

  const userRole = session?.user?.role
  const bisaEdit = userRole === 'ADM' || userRole === 'SUPER_ADMIN'

  const fetchMolds = () => {
    setLoading(true)
    fetch(`/api/mold-book?query=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) showToast(data.error, 'error')
        else {
          setMolds(data)
          setPage(1)
        }
      })
      .catch(() => showToast('Gagal memuat data Mold Book', 'error'))
      .finally(() => setLoading(false))
  }

  const fetchOuthouses = () => {
    fetch('/api/outhouse')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setOuthouses(data)
      })
  }

  useEffect(() => {
    fetchMolds()
    fetchOuthouses()
  }, [search])

  const filteredMolds = (factoryFilter === 'ALL'
    ? molds
    : factoryFilter === 'OUTHOUSE'
      ? molds.filter(m => m.outhouseId !== null || (m.factory !== 'F2' && m.factory !== 'F3' && m.factory !== 'F4'))
      : molds.filter((m) => m.factory === factoryFilter)
  ).sort((a, b) => {
    if (sortOption === 'noMold_asc') return a.noMold.localeCompare(b.noMold, undefined, { numeric: true })
    if (sortOption === 'noMold_desc') return b.noMold.localeCompare(a.noMold, undefined, { numeric: true })
    if (sortOption === 'part_asc') return (a.part || '').localeCompare(b.part || '')
    if (sortOption === 'customer_asc') return (a.customer || '').localeCompare(b.customer || '')
    if (sortOption === 'model_asc') return (a.model || '').localeCompare(b.model || '')
    if (sortOption === 'factory_asc') return (a.factory || '').localeCompare(b.factory || '')
    return 0
  })

  const totalPages = Math.ceil(filteredMolds.length / pageSize)
  const pagedMolds = filteredMolds.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => { setPage(1) }, [factoryFilter])

  const resetForm = () => {
    setFormNoMold('')
    setFormMc('')
    setFormPart('')
    setFormFactory('F2')
    setFormTonase('')
    setFormCustomer('')
    setFormModel('')
    setFormCoreStd('')
    setFormCavStd('')
    setFormHeaterStd('')
    setFormDimensiW('')
    setFormDimensiH('')
    setFormDimensiT('')
    setFormOuthouseId('')
    setFormOthNama('')
    setFormOthAlamat('')
    setFormOthKota('')
    setFotoMoldPaths([])
    setFotoMoldFiles([])
    setFotoProdukPaths([])
    setFotoProdukFiles([])
  }

  const handleOpenAdd = () => {
    resetForm()
    setShowAddModal(true)
  }

  const handleOpenEdit = (m: MoldBookEntry) => {
    setEditingMold(m)
    setFormNoMold(m.noMold)
    setFormMc(m.mc || '')
    setFormPart(m.part || '')
    setFormFactory(m.outhouseId ? 'OUTHOUSE' : m.factory)
    setFormTonase(m.tonase || '')
    setFormCustomer(m.customer || '')
    setFormModel(m.model || '')
    setFormCoreStd(m.coreStd || '')
    setFormCavStd(m.cavStd || '')
    setFormDimensiW(m.dimensiW || '')
    setFormDimensiH(m.dimensiH || '')
    setFormDimensiT(m.dimensiT || '')
    
    setFormOuthouseId(m.outhouseId ? String(m.outhouseId) : '')
    setFormOthNama('')
    setFormOthAlamat('')
    setFormOthKota('')

    setFormHeaterStd(Array.isArray(m.heaterStd) ? m.heaterStd.join(', ') : '')
    
    setFotoMoldPaths(Array.isArray(m.fotoMold) ? m.fotoMold : (m.fotoMold ? [m.fotoMold] : []))
    setFotoProdukPaths(Array.isArray(m.fotoProduk) ? m.fotoProduk : (m.fotoProduk ? [m.fotoProduk] : []))
    setFotoMoldFiles([])
    setFotoProdukFiles([])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'mold' | 'produk') => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    if (type === 'mold') setFotoMoldFiles(prev => [...prev, ...files])
    else setFotoProdukFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number, type: 'mold' | 'produk') => {
    if (type === 'mold') setFotoMoldFiles(prev => prev.filter((_, i) => i !== index))
    else setFotoProdukFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removePath = (index: number, type: 'mold' | 'produk') => {
    if (type === 'mold') setFotoMoldPaths(prev => prev.filter((_, i) => i !== index))
    else setFotoProdukPaths(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (noMold: string, files: File[], type: 'mold' | 'produk'): Promise<string[]> => {
    if (files.length === 0) return []
    const fd = new FormData()
    fd.append('noMold', noMold)
    fd.append('tipe', type)
    files.forEach(f => fd.append('files', f))
    
    const res = await fetch('/api/mold-book/upload', { method: 'POST', body: fd })
    if (!res.ok) throw new Error('Gagal upload foto')
    const data = await res.json()
    return data.paths || []
  }

  const createOrGetOuthouse = async (): Promise<number | null> => {
    if (formFactory !== 'OUTHOUSE') return null
    if (formOuthouseId !== 'NEW') return formOuthouseId ? Number(formOuthouseId) : null
    
    if (!formOthNama) throw new Error('Nama Outhouse wajib diisi')
    
    const res = await fetch('/api/outhouse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: formOthNama, alamat: formOthAlamat, kota: formOthKota })
    })
    if (!res.ok) throw new Error('Gagal menyimpan Outhouse baru')
    const data = await res.json()
    fetchOuthouses()
    return data.id
  }

  const processFormSubmit = async (method: 'POST' | 'PUT') => {
    if (!formNoMold || !formPart) {
      showToast('Nomor Mold dan Nama Part wajib diisi!', 'error')
      return
    }
    setSubmitting(true)

    try {
      let finalOuthouseId: number | null = null
      try {
        finalOuthouseId = await createOrGetOuthouse()
      } catch (e: any) {
        showToast(e.message, 'error')
        setSubmitting(false)
        return
      }

      // Upload photos
      const newMoldPaths = await uploadImages(formNoMold, fotoMoldFiles, 'mold')
      const newProdukPaths = await uploadImages(formNoMold, fotoProdukFiles, 'produk')

      const finalMoldPaths = [...fotoMoldPaths, ...newMoldPaths]
      const finalProdukPaths = [...fotoProdukPaths, ...newProdukPaths]

      const heaters = formHeaterStd
        ? formHeaterStd.split(',').map((v) => Number(v.trim())).filter((v) => !isNaN(v))
        : []

      const finalFactory = formFactory === 'OUTHOUSE' ? 'F2' : formFactory // Database factory requires F2/F3/F4

      const res = await fetch('/api/mold-book', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noMold: formNoMold,
          mc: formMc,
          part: formPart,
          factory: finalFactory,
          outhouseId: finalOuthouseId,
          tonase: formTonase,
          customer: formCustomer,
          model: formModel,
          coreStd: formCoreStd,
          cavStd: formCavStd,
          dimensiW: formDimensiW,
          dimensiH: formDimensiH,
          dimensiT: formDimensiT,
          heaterStd: heaters,
          fotoMold: finalMoldPaths,
          fotoProduk: finalProdukPaths,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal menyimpan', 'error')
      } else {
        showToast(`Mold berhasil ${method === 'POST' ? 'ditambahkan' : 'diperbarui'}! ✓`)
        setShowAddModal(false)
        setEditingMold(null)
        fetchMolds()
      }
    } catch (err) {
      console.error(err)
      showToast('Kesalahan jaringan saat menyimpan', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (noMold: string) => {
    if (!confirm(`Hapus mold "${noMold}" secara permanen?`)) return
    try {
      const res = await fetch(`/api/mold-book/${encodeURIComponent(noMold)}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('Mold dihapus!')
        setEditingMold(null)
        fetchMolds()
      } else {
        showToast('Gagal menghapus', 'error')
      }
    } catch {
      showToast('Error jaringan', 'error')
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <p className="label-besar" style={{ margin: 0 }}>📚 Mold Book Specification</p>
          <span style={{ fontSize: '12px', color: 'var(--teks-redup)' }}>
            {bisaEdit ? 'Kamu memiliki hak akses untuk mengedit data.' : 'Hanya akun ADM / GL yang memiliki hak edit.'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {bisaEdit && (
            <button className="tombol-utama" onClick={handleOpenAdd} style={{ margin: 0 }}>
              + Tambah Mold
            </button>
          )}
        </div>
      </div>

      <div className="kartu" style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label className="kecil" style={{ margin: 0, fontWeight: 700, color: '#003b30', fontSize: '14px' }}>🔍 Cari & Urutkan Data Mold</label>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Ketik kata kunci... contoh: N15, Bumper, TAM"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: '1 1 280px', margin: 0, padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: '#fff', color: '#1e293b' }}
          />
          <select
            value={sortOption}
            onChange={(e) => { setSortOption(e.target.value as any); setPage(1); }}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#1e293b', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', outline: 'none', minWidth: '220px' }}
          >
            <option value="noMold_asc">🔤 Urut No Mold (A - Z) ↑</option>
            <option value="noMold_desc">🔤 Urut No Mold (Z - A) ↓</option>
            <option value="part_asc">📦 Urut Nama Part / Produk</option>
            <option value="customer_asc">🏢 Urut Customer</option>
            <option value="model_asc">🏭 Urut Model</option>
            <option value="factory_asc">📍 Urut Lokasi / Factory</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>Lokasi:</span>
          {(['ALL', 'F2', 'F3', 'F4', 'OUTHOUSE'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFactoryFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: '20px', border: '1.5px solid',
                borderColor: factoryFilter === f ? 'var(--hijau-tua)' : 'var(--garis)',
                background: factoryFilter === f ? 'var(--hijau-tua)' : '#fff',
                color: factoryFilter === f ? '#fff' : 'var(--teks)',
                fontSize: '12px', fontWeight: factoryFilter === f ? '700' : '500', cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {f === 'ALL' ? 'Semua Lokasi' : f === 'OUTHOUSE' ? '🌐 Outhouse' : `Factory ${f.slice(1)}`}
            </button>
          ))}
        </div>
      </div>

      <div id="mb-hasil">
        {loading ? (
          <div className="kosong">Memuat data...</div>
        ) : filteredMolds.length === 0 ? (
          <div className="kartu"><p className="kosong">Tidak ada mold yang ditemukan.</p></div>
        ) : (
          <div className="kartu" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pagedMolds.map((m) => {
              const heaterTxt = Array.isArray(m.heaterStd) ? m.heaterStd.join(', ') : ''
              const lokTag = m.outhouseId ? (m.outhouse?.nama || 'Outhouse') : (m.lokasiMold || m.factory)
              
              return (
                <div className="entri" key={m.noMold} style={{ padding: '12px 16px', marginBottom: '4px', borderRadius: '10px', border: '1px solid #e2e8f0', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
                  <div className="baris-atas" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className={`tag ${m.factory === 'F2' ? 'biru' : m.factory === 'F3' ? 'oranye' : 'netral'}`} style={{ fontWeight: 700, padding: '4px 12px', borderRadius: '14px', fontSize: '12px' }}>
                        {m.outhouseId ? '🌐 Outhouse' : m.factory}
                      </span>
                      <b style={{ fontSize: '16px', color: 'var(--hijau-tua)', fontWeight: 800 }}>{m.noMold}</b>
                      <span style={{ fontSize: '14px', color: '#334155', fontWeight: 600 }}>&mdash; {m.part || '-'}</span>
                    </div>
                    {bisaEdit && (
                      <button type="button" onClick={() => handleOpenEdit(m)} style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#334155', borderRadius: '8px', padding: '6px 14px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}>📝 Edit</button>
                    )}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '13px', color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '12px', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <span>📦 <b style={{ color: '#0f172a' }}>Cust:</b> {m.customer || '-'}</span>
                    <span>•</span>
                    <span>🏭 <b style={{ color: '#0f172a' }}>Model:</b> {m.model || '-'}</span>
                    <span>•</span>
                    <span>⚙️ <b style={{ color: '#0f172a' }}>Tonase:</b> {m.tonase || '-'}</span>
                    <span>•</span>
                    <span>🔧 <b style={{ color: '#0f172a' }}>M/C:</b> {m.mc || '-'}</span>
                    <span>•</span>
                    <span>📍 <b style={{ color: '#0f172a' }}>Lokasi:</b> {lokTag}</span>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '12.5px', color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '0 4px' }}>
                    <span>💧 <b>Core:</b> {m.coreStd || '-'} L/mnt</span>
                    <span>💧 <b>Cav:</b> {m.cavStd || '-'} L/mnt</span>
                    {heaterTxt && <span>🔥 <b>Heater:</b> {heaterTxt} Ω</span>}
                    {(m.dimensiW || m.dimensiH || m.dimensiT) && 
                      <span>📏 <b>Dimensi:</b> {m.dimensiW || '?'} x {m.dimensiH || '?'} x {m.dimensiT || '?'} mm</span>}
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {m.fotoMold && m.fotoMold.length > 0 && (
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold' }}>Foto Mold:</p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {m.fotoMold.map((f, i) => (
                            <a key={i} href={f} target="_blank" rel="noreferrer">
                              <img src={f} alt="Mold" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--garis)' }} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {m.fotoProduk && m.fotoProduk.length > 0 && (
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold' }}>Foto Produk:</p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {m.fotoProduk.map((f, i) => (
                            <a key={i} href={f} target="_blank" rel="noreferrer">
                              <img src={f} alt="Produk" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--garis)' }} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            
            <Pagination
              currentPage={page}
              totalItems={filteredMolds.length}
              itemsPerPage={pageSize}
              onPageChange={setPage}
              onItemsPerPageChange={setPageSize}
              itemLabel="mold"
              pageSizeOptions={[6, 8, 12, 20, 50]}
            />
          </div>
        )}
      </div>

      {/* FORM MODAL (ADD & EDIT) */}
      {(showAddModal || editingMold) && (
        <div className="cs-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddModal(false); setEditingMold(null) } }}>
          <div className="cs-box" style={{ maxWidth: '650px', width: '100%' }}>
            <div className="cs-topbar">
              <b>{editingMold ? `📝 Edit Mold: ${editingMold.noMold}` : '➕ Tambah Mold Baru'}</b>
              <button type="button" className="cs-btn-tutup" onClick={() => { setShowAddModal(false); setEditingMold(null) }}>✕</button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); processFormSubmit(editingMold ? 'PUT' : 'POST') }} className="cs-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              
              <div className="baris2">
                <div>
                  <label className="kecil">Nomor Mold *</label>
                  <input type="text" value={formNoMold} onChange={(e) => setFormNoMold(e.target.value)} required readOnly={!!editingMold} style={editingMold ? { background: '#eee' } : {}} />
                </div>
                <div>
                  <label className="kecil">Nama Part *</label>
                  <input type="text" value={formPart} onChange={(e) => setFormPart(e.target.value)} required />
                </div>
              </div>

              {/* LOKASI / OUTHOUSE */}
              <div className="kartu" style={{ margin: '10px 0', padding: '10px', background: '#f8f9fa' }}>
                <div className="baris2">
                  <div>
                    <label className="kecil">Factory / Lokasi *</label>
                    <select value={formFactory} onChange={(e) => setFormFactory(e.target.value)}>
                      <option value="F2">Factory 2</option>
                      <option value="F3">Factory 3</option>
                      <option value="F4">Factory 4</option>
                      <option value="OUTHOUSE">🌐 Outhouse (Luar Pabrik)</option>
                    </select>
                  </div>
                  {formFactory === 'OUTHOUSE' && (
                    <div>
                      <label className="kecil">Pilih Outhouse *</label>
                      <select value={formOuthouseId} onChange={(e) => setFormOuthouseId(e.target.value)} required>
                        <option value="">-- Pilih Outhouse --</option>
                        {outhouses.map(o => (
                          <option key={o.id} value={o.id}>{o.nama}</option>
                        ))}
                        <option value="NEW">+ Tambah Outhouse Baru</option>
                      </select>
                    </div>
                  )}
                </div>

                {formFactory === 'OUTHOUSE' && formOuthouseId === 'NEW' && (
                  <div style={{ marginTop: '10px', padding: '10px', border: '1px dashed #ccc', borderRadius: '6px', background: '#fff' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold' }}>Input Outhouse Baru</p>
                    <div className="baris2">
                      <input type="text" placeholder="Nama Outhouse *" value={formOthNama} onChange={e => setFormOthNama(e.target.value)} required />
                      <input type="text" placeholder="Kota (Opsional)" value={formOthKota} onChange={e => setFormOthKota(e.target.value)} />
                    </div>
                    <textarea placeholder="Alamat lengkap (Opsional)" value={formOthAlamat} onChange={e => setFormOthAlamat(e.target.value)} rows={2} style={{ marginTop: '10px', width: '100%', resize: 'none' }}></textarea>
                  </div>
                )}
              </div>

              <div className="baris2">
                <div>
                  <label className="kecil">Model</label>
                  <input type="text" value={formModel} onChange={(e) => setFormModel(e.target.value)} />
                </div>
                <div>
                  <label className="kecil">Tonase</label>
                  <input type="text" value={formTonase} onChange={(e) => setFormTonase(e.target.value)} />
                </div>
              </div>

              <div className="baris2">
                <div>
                  <label className="kecil">Customer</label>
                  <input type="text" value={formCustomer} onChange={(e) => setFormCustomer(e.target.value)} />
                </div>
                <div>
                  <label className="kecil">Machine (M/C)</label>
                  <input type="text" value={formMc} onChange={(e) => setFormMc(e.target.value)} />
                </div>
              </div>

              <div className="baris2">
                <div>
                  <label className="kecil">Cooling Core Std (L/mnt)</label>
                  <input type="text" value={formCoreStd} onChange={(e) => setFormCoreStd(e.target.value)} />
                </div>
                <div>
                  <label className="kecil">Cooling Cavity Std (L/mnt)</label>
                  <input type="text" value={formCavStd} onChange={(e) => setFormCavStd(e.target.value)} />
                </div>
              </div>

              <label className="kecil">Heater Std (Ω) &mdash; pisahkan dengan koma</label>
              <input type="text" value={formHeaterStd} onChange={(e) => setFormHeaterStd(e.target.value)} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
                <div><label className="kecil">Dimensi W (mm)</label><input type="text" value={formDimensiW} onChange={e => setFormDimensiW(e.target.value)} /></div>
                <div><label className="kecil">Dimensi H (mm)</label><input type="text" value={formDimensiH} onChange={e => setFormDimensiH(e.target.value)} /></div>
                <div><label className="kecil">Dimensi T (mm)</label><input type="text" value={formDimensiT} onChange={e => setFormDimensiT(e.target.value)} /></div>
              </div>

              {/* UPLOAD MULTIPLE PHOTOS */}
              <div className="baris2" style={{ marginTop: '16px', gap: '20px' }}>
                <div>
                  <label className="kecil" style={{ fontWeight: 'bold' }}>📷 Upload Foto Mold</label>
                  <input type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, 'mold')} />
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {fotoMoldPaths.map((p, i) => (
                      <div key={'old-'+i} style={{ position: 'relative' }}>
                        <img src={p} alt="Mold" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                        <button type="button" onClick={() => removePath(i, 'mold')} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', border: 'none', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                    {fotoMoldFiles.map((f, i) => (
                      <div key={'new-'+i} style={{ position: 'relative' }}>
                        <img src={URL.createObjectURL(f)} alt="New Mold" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '2px solid var(--hijau-tua)' }} />
                        <button type="button" onClick={() => removeFile(i, 'mold')} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', border: 'none', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="kecil" style={{ fontWeight: 'bold' }}>🖼️ Upload Foto Produk</label>
                  <input type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, 'produk')} />
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {fotoProdukPaths.map((p, i) => (
                      <div key={'old-'+i} style={{ position: 'relative' }}>
                        <img src={p} alt="Produk" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                        <button type="button" onClick={() => removePath(i, 'produk')} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', border: 'none', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                    {fotoProdukFiles.map((f, i) => (
                      <div key={'new-'+i} style={{ position: 'relative' }}>
                        <img src={URL.createObjectURL(f)} alt="New Produk" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '2px solid var(--hijau-tua)' }} />
                        <button type="button" onClick={() => removeFile(i, 'produk')} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', border: 'none', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {editingMold ? (
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="button" className="pilih-btn" onClick={() => handleDelete(formNoMold)} style={{ background: 'var(--merah-bg)', color: 'var(--merah)', borderColor: '#eac9c4', flex: 1, padding: '12px' }}>
                    🗑️ Hapus
                  </button>
                  <button type="submit" className="tombol-utama" disabled={submitting} style={{ flex: 1, margin: 0, padding: '12px' }}>
                    {submitting ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                  </button>
                </div>
              ) : (
                <button type="submit" className="tombol-utama" disabled={submitting} style={{ width: '100%', marginTop: '20px', marginInline: 0 }}>
                  {submitting ? 'Menyimpan...' : '💾 Simpan Mold Baru'}
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  )
}
