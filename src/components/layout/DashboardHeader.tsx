'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { Bell, LogOut, User, Menu } from 'lucide-react'

interface Notif {
  id: number
  judul: string
  pesan: string
  tipe: string
  refId: number | null
  refType: string | null
  dibaca: boolean
  createdAt: string
}

export default function DashboardHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { data: session } = useSession()

  const nama = session?.user?.name ?? '...'
  const role = session?.user?.role ?? ''

  const ROLE_LABEL: Record<string, string> = {
    PIC: 'PIC / Member',
    TL: 'Team Leader (TL)',
    GL: 'Group Leader (GL)',
    CL: 'Coordinator / Chief (CL)',
    ADM: 'Administrator',
    SUPER_ADMIN: 'Super Admin',
    SUPERADMIN: 'Super Admin',
  }

  // Notifikasi States
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotif, setShowNotif] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const fetchNotifs = async () => {
    try {
      const resNotif = await fetch('/api/notifikasi')
      if (resNotif.ok) {
        const data = await resNotif.json()
        setNotifs(data.notifs || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch { /* silent */ }
  }

  useEffect(() => {
    if (session?.user) {
      fetchNotifs()
      const interval = setInterval(fetchNotifs, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const handleBellClick = async () => {
    setShowNotif(prev => !prev)
    if (!showNotif && unreadCount > 0) {
      try {
        await fetch('/api/notifikasi', { method: 'PATCH' })
        setUnreadCount(0)
        setNotifs(prev => prev.map(n => ({ ...n, dibaca: true })))
      } catch { /* silent */ }
    }
  }

  const getTipeIcon = (tipe: string) => {
    switch (tipe) {
      case 'APPROVAL': return '✍️'
      case 'REVISI': return '🔄'
      case 'MOLD_BOOK': return '📚'
      default: return 'ℹ️'
    }
  }

  const getNotifLink = (notif: Notif) => {
    if (notif.refType === 'laporan' && notif.refId) {
      return `/laporan/${notif.refId}/checksheet`
    }
    if (notif.refType === 'checksheet_revisi') {
      return '/approval'
    }
    return null
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'Baru saja'
    if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
    return d.toLocaleDateString('id-ID')
  }

  return (
    <header className="app-header">
      {/* Kiri: Tombol Hamburger untuk Toggle Sidebar (Desktop & Mobile) */}
      <div className="app-header-left" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button 
          className="header-menu-btn" 
          onClick={onMenuClick} 
          aria-label="Toggle Menu Sidebar"
          title="Perkecil / Perbesar Sidebar"
          style={{ 
            background: 'var(--kertas)', 
            border: '1px solid var(--garis)', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            transition: 'all 0.2s',
            color: 'var(--teks)'
          }}
        >
          <Menu size={20} strokeWidth={2.2} />
        </button>
        <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--hijau-tua)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '6px' }} className="header-app-title">
          Sugity Mold Maintenance
        </span>
      </div>


      {/* Kanan: Notifikasi, Profil & Logout */}
      <div className="app-header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={handleBellClick}
            aria-label="Notifikasi"
            style={{ 
              background: 'var(--kertas)', 
              border: '1px solid var(--garis)', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
            className="header-bell-btn"
          >
            <Bell size={18} strokeWidth={2} style={{ color: 'var(--teks)' }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                background: 'var(--merah)', color: '#fff', fontSize: '10px',
                fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px',
                border: '2px solid var(--header-bg)'
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="notif-dropdown" style={{
              position: 'absolute', right: 0, top: '40px',
              width: '320px', background: 'var(--kertas)', border: '1px solid var(--garis)',
              borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 999, overflow: 'hidden', color: 'var(--teks)'
            }}>
              <div style={{ background: 'var(--krem)', padding: '10px 14px', fontWeight: 'bold', borderBottom: '1px solid var(--garis)' }}>
                Notifikasi
              </div>
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
                    Belum ada notifikasi
                  </div>
                ) : (
                  notifs.map(n => (
                    <a
                      key={n.id}
                      href={getNotifLink(n) || '#'}
                      style={{
                        display: 'flex',
                        padding: '12px 14px',
                        borderBottom: '1px solid var(--garis)',
                        textDecoration: 'none',
                        color: 'inherit',
                        background: n.dibaca ? 'var(--kertas)' : 'var(--krem)',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '18px', marginRight: '12px' }}>{getTipeIcon(n.tipe)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: n.dibaca ? 'normal' : 'bold', color: 'var(--teks)' }}>{n.judul}</div>
                        <div style={{ fontSize: '12px', color: 'var(--teks-redup)', marginTop: '2px' }}>{n.pesan}</div>
                        <div style={{ fontSize: '11px', color: 'var(--teks-redup)', marginTop: '4px' }}>{formatTime(n.createdAt)}</div>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info Badge */}
        <div className="hide-mobile">
          <div className="user-badge">
            <div className="user-avatar">
              <User size={16} />
            </div>
            <div className="user-info">
              <span className="nama-user">{nama}</span>
              <span className="peran">{role === 'ADM' ? 'ADM' : (ROLE_LABEL[role] ?? role)}</span>
            </div>
          </div>
        </div>
        
        {/* Tombol Keluar */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="btn-keluar"
          aria-label="Keluar dari sistem"
        >
          <LogOut size={16} />
          <span className="hide-mobile">Keluar</span>
        </button>
      </div>
    </header>
  )
}
