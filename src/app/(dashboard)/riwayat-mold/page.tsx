'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { showToast } from '@/components/ui/Toast'

interface HistoryEntry {
  id: number
  tanggal: string
  jenis: string
  pic: string
  info: string | null
  countermeasure: string | null
  mpCost: number
  spCost: number
  totalCost: number
  checksheet?: {
    approvals: any[]
  } | null
}

interface MoldBookInfo {
  noMold: string
  mc: string | null
  factory: string
  shift: string | null
  part: string | null
  tonase: string | null
  customer: string | null
  model: string | null
  coreStd: string | null
  cavStd: string | null
  heaterStd: any
  fotoMold: string | null
  fotoProduk: string | null
}

interface HistoryData {
  mold: MoldBookInfo
  history: HistoryEntry[]
  summary: {
    totalActions: number
    totalCost: number
  }
}

interface ProblemItem {
  id: number
  tanggal: string
  jenis: string
  pic: string
  info: string | null
  countermeasure: string | null
}

interface ProblemGroup {
  noMold: string
  part: string
  items: ProblemItem[]
}

interface ProblemData {
  query: string
  groups: ProblemGroup[]
  totalCount: number
}

export default function RiwayatMoldPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [query, setQuery] = useState('')
  const [moldList, setMoldList] = useState<string[]>([])
  const [selectedMold, setSelectedMold] = useState<string>('')
  const [data, setData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(false)

  // Problem Search states
  const [problemQuery, setProblemQuery] = useState('')
  const [problemData, setProblemData] = useState<ProblemData | null>(null)
  const [problemLoading, setProblemLoading] = useState(false)

  const [activeTab, setActiveTab] = useState<'MOLD' | 'PROBLEM'>('MOLD')

  // Fetch mold suggestions
  useEffect(() => {
    fetch('/api/mold-book?limit=100')
      .then((res) => res.json())
      .then((arr) => {
        if (Array.isArray(arr)) {
          setMoldList(arr.map((m: any) => m.noMold))
        }
      })
      .catch((err) => console.error('Gagal mengambil saran nomor mold:', err))
  }, [])

  const fetchHistory = (no: string) => {
    if (!no) return
    setLoading(true)
    // Enforce UPPERCASE to avoid Prisma case sensitivity findUnique failures
    const cleanNo = no.trim().toUpperCase()
    fetch(`/api/mold-book/${encodeURIComponent(cleanNo)}/history`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.error) {
          showToast(resData.error, 'error')
          setData(null)
        } else {
          setData(resData)
          setSelectedMold(cleanNo)
          setActiveTab('MOLD')
        }
      })
      .catch((err) => {
        console.error(err)
        showToast('Gagal memuat riwayat mold', 'error')
      })
      .finally(() => setLoading(false))
  }

  const getStatusChecksheet = (entry: HistoryEntry) => {
    if (!entry.checksheet) {
      return { label: '⚠️ Belum Isi CS', css: 'merah' }
    }

    const approvals = entry.checksheet.approvals
    const totalSigned = approvals.filter((a: any) => a.signedAt !== null).length

    if (totalSigned === approvals.length || totalSigned === 5) {
      return { label: '🟢 Disetujui Lengkap', css: 'hijau' }
    }

    const userRole = session?.user?.role || ''
    const myApproval = approvals.find((a: any) => a.role === userRole)
    const isMyTurn = myApproval && myApproval.signedAt === null

    const pendingRole = approvals.find((a: any) => a.signedAt === null)?.role || 'TL'

    if (isMyTurn && pendingRole === userRole) {
      return { label: `🔴 Menunggu Anda (${userRole})`, css: 'merah' }
    }

    return { label: `🟡 Pending (${pendingRole})`, css: 'kuning' }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      showToast('Ketik nomor mold terlebih dahulu!', 'error')
      return
    }
    fetchHistory(query.trim())
  }

  // Handle problem search dynamically with 300ms debounce
  useEffect(() => {
    if (problemQuery.trim().length < 3) {
      setProblemData(null)
      return
    }
    setProblemLoading(true)
    const timer = setTimeout(() => {
      fetch(`/api/laporan/search-problem?query=${encodeURIComponent(problemQuery)}`)
        .then((res) => res.json())
        .then((resData) => {
          if (resData.error) {
            showToast(resData.error, 'error')
            setProblemData(null)
          } else {
            setProblemData(resData)
            setActiveTab('PROBLEM')
          }
        })
        .catch((err) => {
          console.error(err)
          showToast('Gagal mencari riwayat problem', 'error')
        })
        .finally(() => setProblemLoading(false))
    }, 300)

    return () => clearTimeout(timer)
  }, [problemQuery])

  const handlePrint = () => {
    window.print()
  }

  // Filter mold list for autocomplete suggestion tags
  const filteredSuggestions = query
    ? moldList.filter((no) => no.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
    : moldList.slice(0, 10)

  return (
    <>
      {/* ================= PRINT ONLY AREA (HIDDEN BY DEFAULT) ================= */}
      <style jsx global>{`
        @media print {
          /* Hide non-printable elements */
          header, nav, aside, .no-print, .toast, .modal-overlay, button, select, [role="navigation"] {
            display: none !important;
          }

          html, body, .app-layout, .app-main, main.konten {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
          }

          #print-area {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .tabel-scroll {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            border-radius: 0 !important;
            border: none !important;
          }

          .tabel-biasa {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          .tabel-biasa th, .tabel-biasa td {
            border: 1px solid #333 !important;
            padding: 6px 8px !important;
            font-size: 11px !important;
            color: #000 !important;
            background: #fff !important;
          }

          .tabel-biasa thead {
            display: table-header-group !important;
          }

          .tabel-biasa tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }

          .kartu {
            border: 1px solid #ccc !important;
            box-shadow: none !important;
            background: #fff !important;
            margin-bottom: 14px !important;
            padding: 12px !important;
            page-break-inside: avoid !important;
          }

          .tag {
            border: 1px solid #333 !important;
            color: #000 !important;
            background: transparent !important;
          }

          .cs-section-title {
            color: #000 !important;
            background: #f0f0f0 !important;
            border: 1px solid #ccc !important;
          }

          @page {
            size: A4 portrait;
            margin: 12mm 10mm;
          }
        }
      `}</style>

      {/* TABS HEADER CONTROL */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <p className="label-besar" style={{ margin: 0 }}>📜 Riwayat Pemeliharaan Mold</p>
          <span style={{ fontSize: '12px', color: 'var(--teks-redup)' }}>
            Lacak riwayat lengkap maintenance per nomor mold maupun berdasarkan pencarian kata kunci masalah.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Tahun Rekap:</span>
            <select 
              style={{ padding: '6px', fontSize: '13px', width: '80px', borderRadius: '4px', border: '1px solid var(--garis)' }}
              id="globalExportYear"
            >
              {[0, 1, 2, 3].map(i => {
                const y = new Date().getFullYear() - i;
                return <option key={y} value={y}>{y}</option>
              })}
            </select>
          </div>
          <button 
            className="tombol-utama" 
            onClick={() => {
              const year = (document.getElementById('globalExportYear') as HTMLSelectElement).value;
              window.open(`/api/laporan/export-rekap?year=${year}`, '_blank');
            }} 
            style={{ margin: 0, padding: '8px 12px', fontSize: '13px', background: 'var(--hijau-tua)' }}
          >
            📥 Download Rekap Semua Mold (Excel)
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS GRID */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        
        {/* PANEL 1: CARI PER MOLD */}
        <div className="kartu" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p className="label-besar" style={{ fontSize: '13.5px', marginBottom: '2px' }}>History Maintenance per Mold</p>
            <p className="cap" style={{ marginBottom: '10px' }}>Cari nomor mold untuk melihat seluruh riwayat perbaikannya.</p>
            <form onSubmit={handleSearch}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                <input
                  type="text"
                  id="searchMoldInput"
                  placeholder="Ketik nomor mold, cth: 818, W30..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value.toUpperCase())}
                  style={{ 
                    width: '100%', 
                    height: '56px', 
                    padding: '0 18px', 
                    fontSize: '18px', 
                    fontWeight: '600',
                    color: '#000000', 
                    backgroundColor: '#ffffff', 
                    border: '2px solid #ccc', 
                    borderRadius: '8px',
                    lineHeight: '52px'
                  }}
                />
                <button type="submit" className="tombol-utama" style={{ margin: 0, height: '56px', padding: '0 28px', fontSize: '16px', fontWeight: 'bold' }}>
                  Cari
                </button>
              </div>
            </form>
          </div>

          {/* Quick Suggestion Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
            <span style={{ fontSize: '11px', alignSelf: 'center', color: 'var(--teks-redup)' }}>Pilih Cepat:</span>
            {filteredSuggestions.map((no) => (
              <button
                key={no}
                type="button"
                className="pilih-btn"
                onClick={() => {
                  setQuery(no)
                  fetchHistory(no)
                }}
                style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '4px' }}
              >
                {no}
              </button>
            ))}
          </div>
        </div>

        {/* PANEL 2: CARI PER KATA KUNCI PROBLEM */}
        <div className="kartu">
          <p className="label-besar" style={{ fontSize: '13.5px', marginBottom: '2px' }}>🔍 Cari Berdasarkan Problem / Countermeasure</p>
          <p className="cap" style={{ marginBottom: '10px' }}>Ketik kata kunci masalah (cth: "Material nyangkut") atau tindakan (cth: "Grease up").</p>
          <input
            type="text"
            placeholder="Contoh: Material nyangkut, Grease up, Hasil kasar..."
            value={problemQuery}
            onChange={(e) => setProblemQuery(e.target.value)}
          />
          {problemLoading && <span style={{ fontSize: '12px', color: 'var(--teks-redup)' }}>Mencari di seluruh database...</span>}
        </div>
      </div>

      {loading && <div className="kosong">Memuat data riwayat mold...</div>}
      {problemLoading && !problemData && <div className="kosong">Mencari laporan problem...</div>}

      {/* ================= OUTPUT AREA ================= */}
      <div id="print-area">
        
        {/* TAMPILAN 1: RIWAYAT MOLD */}
        {activeTab === 'MOLD' && !loading && data && (
          <div>
            {/* MOLD BOOK INFO HEADER CARD */}
            <div className="kartu" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span className="tag oranye" style={{ fontSize: '12px' }}>{data.mold.factory}</span>
                    {data.mold.shift && <span className="tag netral" style={{ fontSize: '12px' }}>{data.mold.shift}</span>}
                    <h1 style={{ fontSize: '20px', margin: 0, color: 'var(--hijau-tua)', fontWeight: 'bold' }}>
                      MOLD {data.mold.noMold}
                    </h1>
                  </div>
                  <p className="cap" style={{ margin: '0 0 12px 0', fontSize: '13px' }}>
                    Part: <b>{data.mold.part || '-'}</b> &middot; Model: <b>{data.mold.model || '-'}</b>
                  </p>
                </div>

                  <div className="no-print" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Rekap:</span>
                      <select 
                        style={{ padding: '6px', fontSize: '13px', width: '80px', borderRadius: '4px', border: '1px solid var(--garis)' }}
                        id="exportYear"
                      >
                        {[0, 1, 2, 3].map(i => {
                          const y = new Date().getFullYear() - i;
                          return <option key={y} value={y}>{y}</option>
                        })}
                      </select>
                    </div>
                    <button 
                      className="tombol-utama" 
                      onClick={() => {
                        const year = (document.getElementById('exportYear') as HTMLSelectElement).value;
                        window.open(`/api/mold-book/${encodeURIComponent(data.mold.noMold)}/export-excel?year=${year}`, '_blank');
                      }} 
                      style={{ margin: 0, padding: '8px 12px', fontSize: '13px', background: 'var(--oranye)' }}
                    >
                      📊 Export Rekap Tahunan (Excel)
                    </button>
                    <button className="tombol-sekunder" onClick={handlePrint} style={{ margin: 0, padding: '8px 12px', fontSize: '13px' }}>
                      🖨️ Cetak PDF Riwayat
                    </button>
                  </div>
              </div>

              {/* Specifications Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', borderTop: '1px solid var(--garis)', paddingTop: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--teks-redup)' }}>Customer</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 'bold', fontSize: '13px' }}>{data.mold.customer || '-'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--teks-redup)' }}>Tonase</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 'bold', fontSize: '13px' }}>{data.mold.tonase || '-'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--teks-redup)' }}>Machine M/C</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 'bold', fontSize: '13px' }}>{data.mold.mc || '-'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--teks-redup)' }}>Cooling Core / Cav Std</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 'bold', fontSize: '13px' }}>
                    {data.mold.coreStd || '-'} / {data.mold.cavStd || '-'} L/m
                  </p>
                </div>
              </div>

              {/* Images display */}
              {(data.mold.fotoMold || data.mold.fotoProduk) && (
                <div style={{ display: 'flex', gap: '14px', marginTop: '16px', borderTop: '1px solid var(--garis)', paddingTop: '14px' }}>
                  {data.mold.fotoMold && (
                    <div>
                      <span className="kecil" style={{ display: 'block', marginBottom: '4px' }}>Foto Mold</span>
                      <a href={data.mold.fotoMold} target="_blank" rel="noreferrer">
                        <img src={data.mold.fotoMold} alt="Mold" style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--garis)' }} />
                      </a>
                    </div>
                  )}
                  {data.mold.fotoProduk && (
                    <div>
                      <span className="kecil" style={{ display: 'block', marginBottom: '4px' }}>Foto Produk</span>
                      <a href={data.mold.fotoProduk} target="_blank" rel="noreferrer">
                        <img src={data.mold.fotoProduk} alt="Produk" style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--garis)' }} />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CUMULATIVE SUMMARY CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div className="kartu" style={{ borderLeft: '4px solid var(--hijau)' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--teks-redup)', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Pemeliharaan Tercatat</span>
                <h2 style={{ margin: '6px 0 0 0', color: 'var(--hijau-tua)', fontSize: '20px' }}>
                  {data.summary.totalActions}x Kegiatan
                </h2>
              </div>
              <div className="kartu" style={{ borderLeft: '4px solid var(--oranye)' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--teks-redup)', fontWeight: 'bold', textTransform: 'uppercase' }}>Akumulasi Biaya Perbaikan (YTD)</span>
                <h2 style={{ margin: '6px 0 0 0', color: 'var(--hijau-tua)', fontSize: '20px' }}>
                  Rp {data.summary.totalCost.toLocaleString('id-ID')}
                </h2>
              </div>
            </div>

            {/* HISTORY TABLE */}
            <div className="kartu">
              <p className="label-besar" style={{ fontSize: '14px', marginBottom: '14px' }}>Histori Catatan Kegiatan</p>
              <div className="tabel-scroll">
                <table className="tabel-biasa">
                  <thead>
                    <tr>
                      <th style={{ width: '110px' }}>Tanggal</th>
                      <th style={{ width: '100px' }}>Jenis</th>
                      <th>Detail Problem / Penjelasan</th>
                      <th style={{ width: '110px', textAlign: 'right' }}>M/P Cost</th>
                      <th style={{ width: '110px', textAlign: 'right' }}>Spareparts</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>Total Biaya</th>
                      <th style={{ width: '140px', textAlign: 'center' }}>Status</th>
                      <th style={{ width: '90px' }} className="no-print">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.history.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '14px', color: 'var(--teks-redup)' }}>
                          Belum ada kegiatan perbaikan terdaftar untuk mold ini.
                        </td>
                      </tr>
                    ) : (
                      data.history.map((row) => (
                        <tr key={row.id}>
                          <td>{new Date(row.tanggal).toLocaleDateString('id-ID')}</td>
                          <td>
                            <span className={`tag ${row.jenis === 'OH_MOLD' ? 'oranye' : 'netral'}`} style={{ fontSize: '11px' }}>
                              {row.jenis === 'OH_MOLD' ? 'OH MOLD' : row.jenis === 'BM' ? 'B/M' : row.jenis === 'IM' ? 'I/M' : row.jenis}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 'bold', color: '#333' }}>PIC: {row.pic}</div>
                            <div style={{ fontSize: '12.5px', color: 'var(--teks-redup)', marginTop: '2px' }}>
                              {row.info || '-'}
                            </div>
                            {row.countermeasure && (
                              <div style={{ fontSize: '12px', color: 'var(--hijau-tua)', marginTop: '4px', fontStyle: 'italic' }}>
                                CM: {row.countermeasure}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>Rp {row.mpCost.toLocaleString('id-ID')}</td>
                          <td style={{ textAlign: 'right' }}>Rp {row.spCost.toLocaleString('id-ID')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Rp {row.totalCost.toLocaleString('id-ID')}</td>
                          <td style={{ textAlign: 'center' }}>
                            {(() => {
                              const st = getStatusChecksheet(row)
                              return (
                                <span className={`tag ${st.css}`} style={{ fontSize: '10px', display: 'inline-block', lineHeight: '1.2', textAlign: 'center', margin: '0 auto' }}>
                                  {st.label}
                                </span>
                              )
                            })()}
                          </td>
                          <td className="no-print">
                            <button
                              type="button"
                              className="tombol-sekunder"
                              onClick={() => router.push(`/laporan/${row.id}/checksheet`)}
                              style={{ margin: 0, padding: '5px 10px', fontSize: '11.5px' }}
                            >
                              👁️ Lihat
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAMPILAN 2: CARI PROBLEM / COUNTERMEASURE */}
        {activeTab === 'PROBLEM' && problemData && (
          <div>
            <div className="kartu" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 className="label-besar" style={{ margin: 0 }}>
                    Hasil Pencarian Masalah: "{problemData.query}"
                  </h2>
                  <p className="cap" style={{ margin: '4px 0 0 0' }}>
                    Ditemukan <b>{problemData.totalCount}</b> kejadian di <b>{problemData.groups.length}</b> nomor mold berbeda.
                  </p>
                </div>
                <button className="tombol-sekunder no-print" onClick={handlePrint} style={{ margin: 0 }}>
                  🖨️ Cetak PDF Hasil
                </button>
              </div>
            </div>

            {problemData.groups.map((group) => (
              <div className="kartu" key={group.noMold} style={{ marginBottom: '14px', borderLeft: '4px solid var(--hijau-tua)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <b style={{ fontSize: '15px', color: 'var(--hijau-tua)' }}>MOLD {group.noMold}</b>
                  <span className="tag netral" style={{ fontSize: '11.5px' }}>{group.items.length}x Kejadian</span>
                </div>
                <span className="cap" style={{ display: 'block', marginBottom: '14px' }}>Part: {group.part}</span>

                <div className="tabel-scroll">
                  <table className="tabel-biasa">
                    <thead>
                      <tr>
                        <th style={{ width: '110px' }}>Tanggal</th>
                        <th style={{ width: '100px' }}>Jenis</th>
                        <th>PIC</th>
                        <th>Keterangan Problem</th>
                        <th>Tindakan / Countermeasure</th>
                        <th style={{ width: '90px' }} className="no-print">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item) => (
                        <tr key={item.id}>
                          <td>{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                          <td>
                            <span className={`tag ${item.jenis === 'OH_MOLD' ? 'oranye' : 'netral'}`} style={{ fontSize: '11px' }}>
                              {item.jenis === 'OH_MOLD' ? 'OH MOLD' : item.jenis === 'BM' ? 'B/M' : item.jenis}
                            </span>
                          </td>
                          <td>{item.pic}</td>
                          <td>{item.info || '-'}</td>
                          <td style={{ color: 'var(--hijau-tua)', fontWeight: 500 }}>{item.countermeasure || '-'}</td>
                          <td className="no-print">
                            <button
                              type="button"
                              className="tombol-sekunder"
                              onClick={() => router.push(`/laporan/${item.id}/checksheet`)}
                              style={{ margin: 0, padding: '5px 10px', fontSize: '11.5px' }}
                            >
                              👁️ Lihat
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DEFAULT KOSONG */}
        {!loading && !problemLoading && !data && !problemData && (
          <div className="kartu" style={{ textAlign: 'center', padding: '40px' }}>
            <p className="kosong" style={{ fontSize: '15px' }}>
              Masukkan nomor mold di bagian <b>History per Mold</b> atau ketik kata kunci di bagian <b>Cari Problem</b> untuk memuat data.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
