'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AuditLogPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.role === 'SUPER_ADMIN') {
      fetch('/api/audit-log?limit=100')
        .then(res => res.json())
        .then(data => {
          if (data.logs) setLogs(data.logs)
        })
        .finally(() => setLoading(false))
    }
  }, [session])

  if (status === 'loading') return <div style={{ padding: '20px', color: '#fff' }}>Loading...</div>

  if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>
        <h2>Akses Ditolak</h2>
        <p>Hanya Super Admin yang diizinkan untuk mengakses halaman ini.</p>
        <button className="tombol-utama" onClick={() => router.push('/dashboard')}>Kembali ke Dashboard</button>
      </div>
    )
  }

  const formatWaktu = (iso: string) => {
    const d = new Date(iso)
    const day = String(d.getDate()).padStart(2, '0')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const month = monthNames[d.getMonth()]
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day} ${month} ${year} - ${hours}.${minutes}`
  }

  return (
    <div style={{ 
      background: '#151521', 
      minHeight: '80vh', 
      borderRadius: '12px', 
      padding: '24px',
      color: '#e2e8f0',
      fontFamily: 'Inter, sans-serif'
    }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: '#fff' }}>Audit Log</h1>
      
      <div style={{ 
        background: '#1e1e2d', 
        borderRadius: '8px', 
        border: '1px solid #2b2b40',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#1e1e2d', borderBottom: '1px solid #2b2b40' }}>
              <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 700, color: '#a1a5b7', letterSpacing: '1px', width: '25%' }}>WAKTU</th>
              <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 700, color: '#a1a5b7', letterSpacing: '1px', width: '50%' }}>AKTIVITAS</th>
              <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: 700, color: '#a1a5b7', letterSpacing: '1px', width: '25%' }}>OLEH</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#a1a5b7' }}>Loading...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#a1a5b7' }}>Belum ada log aktivitas.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #2b2b40', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#212130'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 600 }}>{formatWaktu(log.createdAt)}</td>
                  <td style={{ padding: '16px 20px', fontSize: '13px' }}>{log.aktivitas}</td>
                  <td style={{ padding: '16px 20px', fontSize: '13px' }}>
                    {log.user ? `${log.user.nama} (${log.user.role})` : 'Sistem'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
