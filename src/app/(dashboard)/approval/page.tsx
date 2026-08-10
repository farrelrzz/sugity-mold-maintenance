'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { showToast } from '@/components/ui/Toast'
import { 
  FileCheck, 
  AlertCircle, 
  Clock, 
  User, 
  Calendar, 
  Check, 
  X, 
  FileText, 
  ShieldCheck, 
  Eye, 
  RefreshCw, 
  CheckCircle2,
  AlertTriangle,
  Wrench
} from 'lucide-react'

interface ApprovalEntry {
  id: number
  laporanId: number
  noMold: string
  tanggal: string
  jenis: string
  picName: string
  status: 'MENUNGGU' | 'APPROVED' | 'BELUM_GILIRAN'
}

interface RevisiEntry {
  id: number
  alasan: string
  createdAt: string
  status: string
  requestBy: {
    id?: number
    nama: string
  }
  checksheet: {
    id?: number
    laporan: {
      id?: number
      noMold: string
    }
  }
}

export default function ApprovalPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [data, setData] = useState<ApprovalEntry[]>([])
  const [revisiData, setRevisiData] = useState<RevisiEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'MENUNGGU' | 'APPROVED' | 'REVISI'>('MENUNGGU')

  useEffect(() => {
    if (!session) {
      setLoading(false)
      return
    }

    const fetchPromises: Promise<any>[] = [
      fetch('/api/approval').then(res => res.json())
    ]

    if (session?.user?.role === 'ADM') {
      fetchPromises.push(fetch('/api/revisi').then(res => res.json()))
    }

    Promise.all(fetchPromises)
      .then(([approvalRes, revisiRes]) => {
        if (!approvalRes.error) {
          setData(approvalRes)
        } else {
          showToast(approvalRes.error, 'error')
        }
        
        if (revisiRes && !revisiRes.error && Array.isArray(revisiRes)) {
          setRevisiData(revisiRes.filter((r: any) => r.status === 'MENUNGGU'))
        }
      })
      .catch(err => {
        console.error(err)
        showToast('Gagal memuat data', 'error')
      })
      .finally(() => setLoading(false))
  }, [session])

  const handleRevisiAction = async (id: number, action: 'DISETUJUI' | 'DITOLAK') => {
    if (!window.confirm(`Yakin ingin ${action.toLowerCase()} permintaan revisi ini?`)) return
    try {
      const res = await fetch(`/api/revisi/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (res.ok) {
        showToast(`Revisi berhasil ${action.toLowerCase()}`, 'sukses' as any)
        setRevisiData(revisiData.filter(r => r.id !== id))
      } else {
        const d = await res.json()
        showToast(d.error || 'Gagal memproses revisi', 'error')
      }
    } catch (err) {
      showToast('Gagal memproses revisi', 'error')
    }
  }

  const handleApproveAllPending = async () => {
    const pendingItems = data.filter(d => d.status === 'MENUNGGU')
    if (pendingItems.length === 0) {
      showToast('Tidak ada dokumen yang menunggu persetujuan Anda', 'error')
      return
    }

    if (!window.confirm(`⚡ Yakin ingin menyetujui SEMUA (${pendingItems.length}) dokumen sekaligus?\n\nTindakan ini akan menerapkan tanda tangan Anda pada semua laporan yang sedang menunggu giliran Anda.`)) {
      return
    }

    setLoading(true)
    let successCount = 0
    let failCount = 0

    // Process all approvals
    for (const item of pendingItems) {
      try {
        const res = await fetch(`/api/laporan/${item.laporanId}/checksheet/sign-all`, {
          method: 'POST'
        })
        if (res.ok) successCount++
        else failCount++
      } catch (e) {
        failCount++
      }
    }

    showToast(`Selesai! Berhasil menyetujui ${successCount} dokumen.${failCount > 0 ? ` Gagal: ${failCount}` : ''}`, successCount > 0 ? 'sukses' as any : 'error')
    
    // Refresh data
    try {
      const d = await fetch('/api/approval').then(res => res.json())
      if (!d.error) setData(d)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const waitingCount = data.filter(d => d.status === 'MENUNGGU').length
  const approvedCount = data.filter(d => d.status === 'APPROVED').length

  const filteredData = data.filter(d => {
    if (activeTab === 'MENUNGGU') {
      return d.status === 'MENUNGGU'
    } else {
      return d.status === 'APPROVED'
    }
  })

  if (status === 'loading' || loading) {
    return (
      <div className="kartu" style={{ padding: '60px', textAlign: 'center', borderRadius: '16px', border: '1px solid var(--garis)' }}>
        <RefreshCw size={36} className="spin-animation" style={{ color: 'var(--oranye)', margin: '0 auto 16px auto', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontWeight: 700, fontSize: '16px', color: 'var(--teks)' }}>Memuat Data Approval & Verifikasi...</p>
        <p style={{ fontSize: '13px', color: 'var(--teks-redup)', marginTop: '4px' }}>Mohon tunggu sebentar sementara sistem mensinkronisasi database.</p>
      </div>
    )
  }

  // Removed PIC blocking block

  const getJenisBadgeColor = (jenis: string) => {
    const j = jenis?.toUpperCase() || ''
    if (j.includes('BM')) return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }
    if (j.includes('PM')) return { bg: '#dcfce7', text: '#166534', border: '#86efac' }
    if (j.includes('IM')) return { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' }
    if (j.includes('OH')) return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' }
    return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px' }}>
      {/* HEADER HERO CARD */}
      <div className="kartu" style={{
        padding: '28px',
        borderRadius: '20px',
        background: 'var(--kertas)',
        border: '1px solid var(--garis)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--oranye) 0%, var(--oranye-tua) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 6px 16px rgba(221, 107, 40, 0.3)'
          }}>
            <FileCheck size={28} strokeWidth={2.2} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--teks)', margin: 0, letterSpacing: '-0.5px' }}>
              Pusat Approval & Verifikasi Revisi
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--teks-redup)', margin: '4px 0 0 0', fontWeight: 500 }}>
              Kelola tanda tangan dokumen Checksheet serta tinjau pengajuan revisi maintenance secara berjenjang & profesional.
            </p>
          </div>
        </div>
      </div>

      {/* TAB SWITCHERS / NAV BAR */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        flexWrap: 'wrap',
        background: 'var(--krem)',
        padding: '8px',
        borderRadius: '16px',
        border: '1px solid var(--garis)'
      }}>
        <button
          onClick={() => setActiveTab('MENUNGGU')}
          style={{
            flex: '1 1 240px',
            padding: '14px 20px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '14.5px',
            border: activeTab === 'MENUNGGU' ? 'none' : '1px solid transparent',
            cursor: 'pointer',
            background: activeTab === 'MENUNGGU' ? 'linear-gradient(135deg, #c0392b 0%, #992d22 100%)' : 'transparent',
            color: activeTab === 'MENUNGGU' ? '#ffffff' : 'var(--teks-redup)',
            boxShadow: activeTab === 'MENUNGGU' ? '0 4px 15px rgba(192, 57, 43, 0.28)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s'
          }}
        >
          <span>Butuh Tindakan</span>
          {waitingCount > 0 ? (
            <span style={{ 
              background: activeTab === 'MENUNGGU' ? '#fff' : '#c0392b', 
              color: activeTab === 'MENUNGGU' ? '#c0392b' : '#fff', 
              padding: '2px 9px', 
              borderRadius: '12px', 
              fontSize: '12px',
              fontWeight: 900
            }}>
              {waitingCount}
            </span>
          ) : (
            <span style={{ fontSize: '15px' }}>🔴</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('APPROVED')}
          style={{
            flex: '1 1 240px',
            padding: '14px 20px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '14.5px',
            border: activeTab === 'APPROVED' ? 'none' : '1px solid transparent',
            cursor: 'pointer',
            background: activeTab === 'APPROVED' ? 'linear-gradient(135deg, #1d6f42 0%, #145230 100%)' : 'transparent',
            color: activeTab === 'APPROVED' ? '#ffffff' : 'var(--teks-redup)',
            boxShadow: activeTab === 'APPROVED' ? '0 4px 15px rgba(29, 111, 66, 0.28)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s'
          }}
        >
          <span>Sudah Di-approve</span>
          {approvedCount > 0 ? (
            <span style={{ 
              background: activeTab === 'APPROVED' ? '#fff' : '#1d6f42', 
              color: activeTab === 'APPROVED' ? '#1d6f42' : '#fff', 
              padding: '2px 9px', 
              borderRadius: '12px', 
              fontSize: '12px',
              fontWeight: 900
            }}>
              {approvedCount}
            </span>
          ) : (
            <span style={{ fontSize: '15px' }}>🟢</span>
          )}
        </button>

        {session?.user?.role === 'ADM' && (
          <button
            onClick={() => setActiveTab('REVISI')}
            style={{
              flex: '1 1 240px',
              padding: '14px 20px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '14.5px',
              border: activeTab === 'REVISI' ? 'none' : '1px solid transparent',
              cursor: 'pointer',
              background: activeTab === 'REVISI' ? 'linear-gradient(135deg, #dd6b28 0%, #b8541e 100%)' : 'transparent',
              color: activeTab === 'REVISI' ? '#ffffff' : 'var(--teks-redup)',
              boxShadow: activeTab === 'REVISI' ? '0 4px 15px rgba(221, 107, 40, 0.28)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={18} />
            <span>Permintaan Revisi</span>
            {revisiData.length > 0 && (
              <span style={{ 
                background: activeTab === 'REVISI' ? '#ffffff' : '#dd6b28', 
                color: activeTab === 'REVISI' ? '#dd6b28' : '#ffffff', 
                padding: '2px 9px', 
                borderRadius: '12px', 
                fontSize: '12px',
                fontWeight: 900
              }}>
                {revisiData.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* TABLE CONTENT CARD */}
      <div className="kartu" style={{ 
        padding: '0', 
        borderRadius: '20px', 
        border: '1px solid var(--garis)',
        background: 'var(--kertas)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden'
      }}>
        {/* TABLE TITLE SECTION */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--garis)',
          background: 'var(--krem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--teks)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeTab === 'MENUNGGU' && <><span style={{ color: 'var(--merah)' }}>🔴</span> Dokumen Menunggu Verifikasi Tanda Tangan</>}
            {activeTab === 'APPROVED' && <><span style={{ color: 'var(--hijau)' }}>🟢</span> Riwayat Dokumen Yang Telah Disetujui</>}
            {activeTab === 'REVISI' && <><span style={{ color: 'var(--oranye)' }}>🔄</span> Antrean Permohonan Revisi Checksheet (Admin Only)</>}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--teks-redup)' }}>
              Total: {activeTab === 'REVISI' ? revisiData.length : filteredData.length} Data
            </span>
            
            {/* MASS APPROVE BUTTON */}
            {activeTab === 'MENUNGGU' && waitingCount > 0 && (
              <button
                onClick={handleApproveAllPending}
                className="group relative flex items-center justify-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 overflow-hidden"
                style={{ border: 'none', cursor: 'pointer' }}
                title="Tandatangani semua dokumen yang menunggu sekaligus"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <div className="relative z-10 flex items-center">
                  <svg className="w-4 h-4 text-emerald-100 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <svg className="w-4 h-4 text-white drop-shadow-sm -ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="relative z-10 tracking-wide">Approve Semua ({waitingCount})</span>
              </button>
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          {activeTab === 'REVISI' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--krem)', borderBottom: '2px solid var(--garis)' }}>
                  <th style={{ padding: '16px 22px', fontSize: '12.5px', fontWeight: 800, color: 'var(--teks-redup)', textTransform: 'uppercase', letterSpacing: '0.6px', width: '18%' }}>
                    Nomor Mold
                  </th>
                  <th style={{ padding: '16px 22px', fontSize: '12.5px', fontWeight: 800, color: 'var(--teks-redup)', textTransform: 'uppercase', letterSpacing: '0.6px', width: '22%' }}>
                    PIC Pengaju
                  </th>
                  <th style={{ padding: '16px 22px', fontSize: '12.5px', fontWeight: 800, color: 'var(--teks-redup)', textTransform: 'uppercase', letterSpacing: '0.6px', width: '32%' }}>
                    Alasan & Catatan Revisi
                  </th>
                  <th style={{ padding: '16px 22px', fontSize: '12.5px', fontWeight: 800, color: 'var(--teks-redup)', textTransform: 'uppercase', letterSpacing: '0.6px', width: '18%' }}>
                    Waktu Pengajuan
                  </th>
                  <th style={{ padding: '16px 22px', fontSize: '12.5px', fontWeight: 800, color: 'var(--teks-redup)', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'center', width: '10%' }}>
                    Aksi Verifikasi
                  </th>
                </tr>
              </thead>
              <tbody>
                {revisiData.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div style={{ padding: '64px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'var(--hijau-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hijau)' }}>
                          <ShieldCheck size={38} />
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '17px', color: 'var(--teks)' }}>
                          Tidak Ada Antrean Permohonan Revisi
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--teks-redup)', maxWidth: '460px', lineHeight: 1.6 }}>
                          Saat ini seluruh permintaan buka kunci (revisi) dari PIC mau pun Leader sudah diproses, atau memang belum ada pengajuan baru.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  revisiData.map((r, index) => {
                    const noMold = r.checksheet?.laporan?.noMold || 'N/A'
                    const pengaju = r.requestBy?.nama || 'Unknown'
                    const firstLetter = pengaju.charAt(0).toUpperCase()

                    return (
                      <tr key={r.id} style={{ 
                        borderBottom: index === revisiData.length - 1 ? 'none' : '1px solid var(--garis)',
                        transition: 'background 0.15s'
                      }} className="hover-row">
                        {/* NOMOR MOLD */}
                        <td style={{ padding: '18px 22px', verticalAlign: 'middle' }}>
                          <span style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#eff6ff', 
                            color: '#1e40af', 
                            padding: '8px 16px', 
                            borderRadius: '10px', 
                            fontWeight: 800, 
                            fontSize: '14.5px',
                            border: '1px solid #bfdbfe',
                            boxShadow: '0 2px 5px rgba(30, 64, 175, 0.05)'
                          }}>
                            <Wrench size={16} />
                            {noMold}
                          </span>
                        </td>

                        {/* PIC PENGAJU */}
                        <td style={{ padding: '18px 22px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--oranye) 0%, #b8541e 100%)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '16px',
                              boxShadow: '0 2px 8px rgba(221, 107, 40, 0.25)',
                              flexShrink: 0
                            }}>
                              {firstLetter}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '14.5px', color: 'var(--teks)' }}>
                                {pengaju}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--teks-redup)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <User size={12} /> Pemohon Revisi Dokumen
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* ALASAN REVISI */}
                        <td style={{ padding: '18px 22px', verticalAlign: 'middle' }}>
                          <div style={{
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderLeft: '4px solid var(--oranye)',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            color: 'var(--teks)',
                            fontSize: '14px',
                            lineHeight: 1.5,
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)'
                          }}>
                            <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#92400e', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                              <FileText size={13} /> Catatan Keterangan PIC:
                            </div>
                            <div style={{ fontWeight: 600, color: '#1f2937' }}>
                              {r.alasan || 'Tidak ada keterangan spesifik disertakan.'}
                            </div>
                          </div>
                        </td>

                        {/* WAKTU PENGAJUAN */}
                        <td style={{ padding: '18px 22px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--teks)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={14} style={{ color: 'var(--oranye)' }} />
                              {new Date(r.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--teks-redup)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Clock size={14} style={{ color: 'var(--teks-redup)' }} />
                              {new Date(r.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                        </td>

                        {/* AKSI TOMBOL */}
                        <td style={{ padding: '18px 22px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleRevisiAction(r.id, 'DISETUJUI')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'linear-gradient(135deg, #1d6f42 0%, #155331 100%)',
                                color: '#ffffff',
                                border: 'none',
                                padding: '9px 16px',
                                borderRadius: '10px',
                                fontWeight: 800,
                                fontSize: '13px',
                                cursor: 'pointer',
                                boxShadow: '0 3px 10px rgba(29, 111, 66, 0.25)',
                                transition: 'all 0.15s'
                              }}
                              title="Setujui dan Buka Kunci Laporan Ini"
                            >
                              <Check size={16} strokeWidth={3} /> Setujui
                            </button>

                            <button
                              onClick={() => handleRevisiAction(r.id, 'DITOLAK')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'linear-gradient(135deg, #c0392b 0%, #992d22 100%)',
                                color: '#ffffff',
                                border: 'none',
                                padding: '9px 16px',
                                borderRadius: '10px',
                                fontWeight: 800,
                                fontSize: '13px',
                                cursor: 'pointer',
                                boxShadow: '0 3px 10px rgba(192, 57, 43, 0.25)',
                                transition: 'all 0.15s'
                              }}
                              title="Tolak Permohonan Revisi Ini"
                            >
                              <X size={16} strokeWidth={3} /> Tolak
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--krem)', borderBottom: '2px solid var(--garis)' }}>
                  <th style={{ padding: '16px 22px', fontSize: '12.5px', fontWeight: 800, color: 'var(--teks-redup)', textTransform: 'uppercase', letterSpacing: '0.6px', width: '18%' }}>
                    Nomor Mold
                  </th>
                  <th style={{ padding: '16px 22px', fontSize: '12.5px', fontWeight: 800, color: 'var(--teks-redup)', textTransform: 'uppercase', letterSpacing: '0.6px', width: '18%' }}>
                    Tanggal Laporan
                  </th>
                  <th style={{ padding: '16px 22px', fontSize: '12.5px', fontWeight: 800, color: 'var(--teks-redup)', textTransform: 'uppercase', letterSpacing: '0.6px', width: '18%' }}>
                    Jenis Maintenance
                  </th>
                  <th style={{ padding: '16px 22px', fontSize: '12.5px', fontWeight: 800, color: 'var(--teks-redup)', textTransform: 'uppercase', letterSpacing: '0.6px', width: '22%' }}>
                    PIC Pembuat
                  </th>
                  <th style={{ padding: '16px 22px', fontSize: '12.5px', fontWeight: 800, color: 'var(--teks-redup)', textTransform: 'uppercase', letterSpacing: '0.6px', width: '12%' }}>
                    Status Approval
                  </th>
                  <th style={{ padding: '16px 22px', fontSize: '12.5px', fontWeight: 800, color: 'var(--teks-redup)', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'center', width: '12%' }}>
                    Aksi Tindakan
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div style={{ padding: '64px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: activeTab === 'MENUNGGU' ? 'var(--hijau-bg)' : 'var(--krem)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeTab === 'MENUNGGU' ? 'var(--hijau)' : 'var(--oranye)' }}>
                          <CheckCircle2 size={38} />
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '17px', color: 'var(--teks)' }}>
                          {activeTab === 'MENUNGGU' ? 'Semua Dokumen Sudah Diperiksa & Bersih!' : 'Belum Ada Dokumen Yang Ditandatangani'}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--teks-redup)', maxWidth: '460px', lineHeight: 1.6 }}>
                          {activeTab === 'MENUNGGU' ? 'Luar biasa! Saat ini tidak ada antrean laporan checksheet maintenance yang sedang menunggu verifikasi atau tanda tangan Anda.' : 'Daftar riwayat laporan maintenance yang sudah berhasil Anda approve akan terkelompok dengan rapi di halaman ini.'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((d, index) => {
                    const badge = getJenisBadgeColor(d.jenis)
                    const firstLetter = d.picName ? d.picName.charAt(0).toUpperCase() : 'P'

                    return (
                      <tr key={d.id} style={{ 
                        borderBottom: index === filteredData.length - 1 ? 'none' : '1px solid var(--garis)',
                        transition: 'background 0.15s'
                      }} className="hover-row">
                        {/* NOMOR MOLD */}
                        <td style={{ padding: '18px 22px', verticalAlign: 'middle' }}>
                          <span style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#f8fafc', 
                            color: '#0f172a', 
                            padding: '8px 16px', 
                            borderRadius: '10px', 
                            fontWeight: 800, 
                            fontSize: '14.5px',
                            border: '1px solid #cbd5e1'
                          }}>
                            <Wrench size={15} style={{ color: 'var(--oranye)' }} />
                            {d.noMold}
                          </span>
                        </td>

                        {/* TANGGAL LAPORAN */}
                        <td style={{ padding: '18px 22px', verticalAlign: 'middle' }}>
                          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--teks)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={16} style={{ color: 'var(--teks-redup)' }} />
                            {new Date(d.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                        </td>

                        {/* JENIS MAINTENANCE */}
                        <td style={{ padding: '18px 22px', verticalAlign: 'middle' }}>
                          <span style={{
                            background: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`,
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontWeight: 800,
                            fontSize: '12.5px',
                            display: 'inline-block'
                          }}>
                            {d.jenis}
                          </span>
                        </td>

                        {/* PIC PEMBUAT */}
                        <td style={{ padding: '18px 22px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: '#e0f2fe',
                              color: '#0369a1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '14px',
                              flexShrink: 0
                            }}>
                              {firstLetter}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--teks)' }}>
                                {d.picName}
                              </div>
                              <div style={{ fontSize: '11.5px', color: 'var(--teks-redup)' }}>
                                PIC Maintenance
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* STATUS */}
                        <td style={{ padding: '18px 22px', verticalAlign: 'middle' }}>
                          {d.status === 'MENUNGGU' && (
                            <span style={{ 
                              background: '#fee2e2', 
                              color: '#991b1b', 
                              padding: '6px 14px', 
                              borderRadius: '20px', 
                              fontWeight: 800, 
                              fontSize: '12.5px',
                              border: '1px solid #fca5a5',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', display: 'inline-block' }}></span>
                              Menunggu Verifikasi
                            </span>
                          )}
                          {d.status === 'APPROVED' && (
                            <span style={{ 
                              background: '#dcfce7', 
                              color: '#166534', 
                              padding: '6px 14px', 
                              borderRadius: '20px', 
                              fontWeight: 800, 
                              fontSize: '12.5px',
                              border: '1px solid #86efac',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
                              Sudah Anda TTD
                            </span>
                          )}
                        </td>

                        {/* AKSI TOMBOL */}
                        <td style={{ padding: '18px 22px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <Link href={`/laporan/${d.laporanId}/checksheet`} style={{ textDecoration: 'none' }}>
                            <button style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: d.status === 'MENUNGGU' ? 'linear-gradient(135deg, var(--oranye) 0%, var(--oranye-tua) 100%)' : '#f1f5f9',
                              color: d.status === 'MENUNGGU' ? '#ffffff' : '#334155',
                              border: d.status === 'MENUNGGU' ? 'none' : '1px solid #cbd5e1',
                              padding: '9px 16px',
                              borderRadius: '10px',
                              fontWeight: 800,
                              fontSize: '13px',
                              cursor: 'pointer',
                              boxShadow: d.status === 'MENUNGGU' ? '0 4px 12px rgba(221, 107, 40, 0.25)' : 'none',
                              transition: 'all 0.15s'
                            }}>
                              <Eye size={16} />
                              {d.status === 'MENUNGGU' ? 'Periksa & TTD' : 'Lihat Dokumen'}
                            </button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* FOOTNOTE ALERTA */}
      {activeTab === 'MENUNGGU' && (
        <div style={{
          padding: '18px 24px',
          borderRadius: '16px',
          background: 'var(--krem)',
          border: '1px solid var(--garis)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '13.5px',
          color: 'var(--teks)',
          lineHeight: 1.5,
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <b style={{ color: '#0369a1', fontSize: '14.5px', display: 'block', marginBottom: '4px' }}>
              ℹ️ Sistem Aliran Persetujuan Berjenjang (Hierarchical Approval Flow)
            </b>
            Laporan maintenance yang baru dibuat akan dikirim ke pimpinan secara berjenjang: <b>Member (PIC) ➔ Team Leader (TL) ➔ Group Leader (GL) ➔ Chief Leader (CL) ➔ Administrator (ADM)</b>. Laporan yang <i>belum</i> ditandatangani oleh pemegang jabatan di tingkat sebelum Anda tidak akan muncul dalam daftar antrean Anda hingga giliran Anda tiba.
          </div>
        </div>
      )}
    </div>
  )
}
