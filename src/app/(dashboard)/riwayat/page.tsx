'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { showToast } from '@/components/ui/Toast'
import { confirmDialog } from '@/components/ui/ConfirmModal'
import Pagination from '@/components/ui/Pagination'
import SummarizeModal from '@/components/laporan/SummarizeModal'

interface ApprovalEntry {
  role: string
  userId: number | null
  signedAt: string | null
}

interface ChecksheetSpec {
  id: number
  jamMulai: string | null
  jamSelesai: string | null
  jumlahOrang: number
  approvals: ApprovalEntry[]
}

interface LaporanEntry {
  id: number
  noMold: string
  jenis: string
  factory: string
  shift: string | null
  tanggal: string
  part: string | null
  info: string | null
  countermeasure: string | null
  createdAt: string
  pic: {
    id: number
    nama: string
    role: string
  }
  checksheet: ChecksheetSpec | null
}

export default function RiwayatPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [laporanList, setLaporanList] = useState<LaporanEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isSummarizeOpen, setIsSummarizeOpen] = useState(false)

  // Filters
  const [filterTanggal, setFilterTanggal] = useState('')
  const [filterFactory, setFilterFactory] = useState('all')
  const [filterSearch, setFilterSearch] = useState('')
  const [filterBelumCS, setFilterBelumCS] = useState(false)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)

  // Trigger fetch
  const fetchLaporan = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterTanggal) params.set('tanggal', filterTanggal)
    if (filterFactory) params.set('factory', filterFactory)
    if (filterSearch) params.set('search', filterSearch)
    if (filterBelumCS) params.set('belumCS', 'true')

    fetch(`/api/laporan?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLaporanList(data)
        }
      })
      .catch((err) => {
        console.error('Gagal mengambil riwayat laporan:', err)
        showToast('Gagal memuat data riwayat', 'error')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    setCurrentPage(1)
    fetchLaporan()
  }, [filterTanggal, filterFactory, filterBelumCS])

  // Handle enter key or debounced search trigger
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchLaporan()
    }
  }

  const handleResetFilter = () => {
    setFilterTanggal('')
    setFilterFactory('all')
    setFilterSearch('')
    setFilterBelumCS(false)
  }

  const handleLihatHariIni = () => {
    const today = new Date().toISOString().split('T')[0]
    setFilterTanggal(today)
    setFilterBelumCS(false)
  }

  const handleLihatSemua = () => {
    setFilterTanggal('')
    setFilterBelumCS(false)
  }

  const handleDeleteLaporan = async (id: number) => {
    const isConfirmed = await confirmDialog({
      title: 'Hapus Laporan?',
      message: 'Apakah Anda yakin ingin menghapus laporan ini? Seluruh data checksheet & approval terkait juga akan terhapus permanen.',
      type: 'danger',
      confirmText: 'Ya, Hapus'
    })
    if (!isConfirmed) return

    // Optimistic Update
    setLaporanList(prev => prev.filter(l => l.id !== id))

    try {
      const res = await fetch(`/api/laporan/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Gagal menghapus laporan', 'error')
        fetchLaporan() // Revert
      } else {
        showToast('Laporan berhasil dihapus ✓', 'sukses')
      }
    } catch {
      showToast('Kesalahan jaringan saat menghapus', 'error')
      fetchLaporan() // Revert
    }
  }

  // Get checksheet status badge & logic
  const getStatusChecksheet = (entry: LaporanEntry) => {
    if (!entry.checksheet) {
      return { label: '⚠️ Belum Isi Checksheet', css: 'merah', isPending: true }
    }

    const approvals = entry.checksheet.approvals
    const totalSigned = approvals.filter((a) => a.signedAt !== null).length

    if (totalSigned === approvals.length || totalSigned === 5) {
      return { label: '🟢 Disetujui Lengkap', css: 'hijau', isPending: false }
    }

    const userRole = session?.user?.role || ''
    const myApproval = approvals.find((a) => a.role === userRole)
    const isMyTurn = myApproval && myApproval.signedAt === null

    const pendingRole = approvals.find((a) => a.signedAt === null)?.role || 'TL'

    // If it's the current user's turn to approve, show RED as requested
    if (isMyTurn && pendingRole === userRole) {
      return { label: `🔴 Menunggu Approval Anda (${userRole})`, css: 'merah', isPending: true }
    }

    return { label: `🟡 Pending Approval (${pendingRole})`, css: 'kuning', isPending: true }
  }

  const canDelete = (entry: LaporanEntry) => {
    const userRole = session?.user?.role
    const userId = Number(session?.user?.id)
    return userRole === 'ADM' || userRole === 'GL' || entry.pic.id === userId
  }

  return (
    <>
      <section>
        {/* Filter Card */}
        <div className="kartu">
          <p className="label-besar">Cari Laporan</p>
          <div className="filter-bar">
            <input
              type="date"
              value={filterTanggal}
              onChange={(e) => setFilterTanggal(e.target.value)}
            />
            <select
              value={filterFactory}
              onChange={(e) => setFilterFactory(e.target.value)}
            >
              <option value="all">Semua Factory</option>
              <option value="F2">Factory 2</option>
              <option value="F3">Factory 3</option>
              <option value="F4">Factory 4</option>
            </select>
            <input
              type="text"
              placeholder="Cari nomor mold, part, PIC... (Tekan Enter)"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <button
              type="button"
              className={`pilih-btn ${filterTanggal && !filterBelumCS ? 'terpilih' : ''}`}
              style={{ padding: '9px 14px', fontSize: '13px' }}
              onClick={handleLihatHariIni}
            >
              Hari Ini
            </button>
            <button
              type="button"
              className={`pilih-btn ${!filterTanggal && !filterBelumCS ? 'terpilih' : ''}`}
              style={{ padding: '9px 14px', fontSize: '13px' }}
              onClick={handleLihatSemua}
            >
              Semua Riwayat
            </button>
            <button
              type="button"
              className={`pilih-btn ${filterBelumCS ? 'terpilih merah' : ''}`}
              style={{ padding: '9px 14px', fontSize: '13px' }}
              onClick={() => setFilterBelumCS(!filterBelumCS)}
            >
              ⚠️ Belum CS / TTD PIC
            </button>
            <button
              type="button"
              className="pilih-btn"
              style={{ padding: '9px 14px', fontSize: '13px', background: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)', color: '#fff', border: 'none', fontWeight: 700, boxShadow: '0 2px 6px rgba(109,40,217,0.25)' }}
              onClick={() => setIsSummarizeOpen(true)}
            >
              📋 Copy Summarize Maintenance
            </button>
          </div>

          <button
            type="button"
            className="tombol-sekunder"
            onClick={handleResetFilter}
            style={{ marginTop: 0 }}
          >
            Reset Pencarian
          </button>
        </div>

        {/* Laporan List */}
        <div id="daftar-entri">
          {loading ? (
            <div className="kosong">Memuat daftar riwayat...</div>
          ) : laporanList.length === 0 ? (
            <div className="kosong">Tidak ada laporan yang cocok dengan filter pencarian.</div>
          ) : (
            laporanList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((entry) => {
              const status = getStatusChecksheet(entry)
              const dateStr = new Date(entry.tanggal).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })

              return (
                <div
                  key={entry.id}
                  className={`entri ${status.isPending ? 'entri-belum-cs' : ''}`}
                >
                  <div className="baris-atas">
                    <div>
                      <span className={`tag ${entry.jenis === 'B/M' || entry.jenis === 'OH MOLD' ? 'oranye' : 'netral'}`}>
                        {entry.jenis}
                      </span>
                      <span className="tag biru">{entry.factory}</span>
                      {entry.shift && <span className="tag netral">{entry.shift}</span>}
                    </div>
                    <span className="jam">{dateStr}</span>
                  </div>

                  <div className="info">
                    <strong>{entry.noMold}</strong> &mdash; <span style={{ color: 'var(--teks-redup)' }}>{entry.part || '-'}</span>
                  </div>

                  {entry.info && (
                    <div className="cm" style={{ marginTop: '6px' }}>
                      <b>Problem:</b> {entry.info}
                    </div>
                  )}

                  {entry.countermeasure && (
                    <div className="cm">
                      <b>Countermeasure:</b> {entry.countermeasure}
                    </div>
                  )}

                  <div className="pic">
                    PIC: {entry.pic.nama}
                  </div>

                  <div className="aksi">
                    <span className={`badge-status ${status.css}`} style={{ padding: '6px 12px', fontSize: '12px' }}>
                      {status.label}
                    </span>

                    {/* Tombol isi checksheet */}
                    <button
                      type="button"
                      onClick={() => router.push(`/laporan/${entry.id}/checksheet`)}
                      style={{
                        background: 'var(--hijau-bg)',
                        color: 'var(--hijau-tua)',
                        borderColor: 'var(--hijau)',
                      }}
                    >
                      {entry.checksheet ? 'Buka Checksheet' : 'Isi Checksheet'}
                    </button>

                    {/* Hapus button */}
                    {canDelete(entry) && (
                      <button
                        type="button"
                        className="hapus"
                        onClick={() => handleDeleteLaporan(entry.id)}
                      >
                        Hapus Laporan
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
        
        {!loading && laporanList.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={laporanList.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemLabel="laporan maintenance"
            pageSizeOptions={[5, 6, 10, 20]}
          />
        )}
      </section>

      <SummarizeModal
        isOpen={isSummarizeOpen}
        onClose={() => setIsSummarizeOpen(false)}
        initialDate={filterTanggal}
      />
    </>
  )
}
