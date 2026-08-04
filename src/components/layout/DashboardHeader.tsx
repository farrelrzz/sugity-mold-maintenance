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

  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'SUPERADMIN';

  return (
    <header 
      className={`app-header ${isSuperAdmin ? 'sa-header-idraft' : ''}`}
      style={isSuperAdmin ? {
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        color: '#0f172a',
        boxShadow: '0 2px 25px rgba(0,0,0,0.03)'
      } : {}}
    >
      {/* Kiri: Tombol Hamburger untuk Toggle Sidebar (Desktop & Mobile) */}
      <div className="app-header-left" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button 
          className="header-menu-btn" 
          onClick={onMenuClick} 
          aria-label="Toggle Menu Sidebar"
          title="Perkecil / Perbesar Sidebar"
          style={{ 
            background: isSuperAdmin ? '#f8fafc' : 'rgba(255, 255, 255, 0.18)', 
            border: isSuperAdmin ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.35)', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            transition: 'all 0.2s',
            color: isSuperAdmin ? '#0f172a' : '#ffffff'
          }}
        >
          <Menu size={20} strokeWidth={2.2} />
        </button>
        <span style={{ fontSize: '17px', fontWeight: 900, color: isSuperAdmin ? '#0f172a' : '#ffffff', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '6px' }} className="header-app-title">
          {isSuperAdmin ? 'Command Center & Intelligence' : 'Sugity Mold Maintenance'}
        </span>
      </div>


      {/* Kanan: Notifikasi, Profil & Logout */}
      <div className="app-header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={handleBellClick}
            aria-label="Notifikasi"
            style={{ 
              background: isSuperAdmin ? '#f8fafc' : 'rgba(255, 255, 255, 0.18)', 
              border: isSuperAdmin ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.35)', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: isSuperAdmin ? '12px' : '50%',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
            className="header-bell-btn"
          >
            <Bell size={18} strokeWidth={2} style={{ color: isSuperAdmin ? '#0f172a' : '#ffffff' }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                background: '#ef4444', color: '#fff', fontSize: '10px',
                fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px',
                border: '2px solid #ffffff'
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="notif-dropdown" style={{
              position: 'absolute', right: 0, top: '44px',
              width: '330px', background: '#ffffff', border: '1px solid #e2e8f0',
              borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              zIndex: 999, overflow: 'hidden', color: '#0f172a', textAlign: 'left'
            }}>
              <div style={{ background: '#f8fafc', padding: '12px 16px', fontWeight: 800, borderBottom: '1px solid #e2e8f0', fontSize: '14px' }}>
                Notifikasi Sistem
              </div>
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13.5px' }}>
                    Belum ada notifikasi baru
                  </div>
                ) : (
                  notifs.map(n => (
                    <a
                      key={n.id}
                      href={getNotifLink(n) || '#'}
                      style={{
                        display: 'flex',
                        padding: '14px 16px',
                        borderBottom: '1px solid #f1f5f9',
                        textDecoration: 'none',
                        color: 'inherit',
                        background: n.dibaca ? '#ffffff' : '#f8fafc',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '18px', marginRight: '14px' }}>{getTipeIcon(n.tipe)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: n.dibaca ? 600 : 800, color: '#0f172a' }}>{n.judul}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', lineHeight: 1.4 }}>{n.pesan}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px', fontWeight: 600 }}>{formatTime(n.createdAt)}</div>
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
          <div 
            className="user-badge"
            style={isSuperAdmin ? {
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '99px',
              padding: '6px 16px',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: 'none'
            } : {}}
          >
            <div className="user-avatar" style={isSuperAdmin ? { background: '#18181b', color: '#ffffff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}>
              <User size={15} strokeWidth={2.5} />
            </div>
            <div className="user-info">
              <span className="nama-user" style={isSuperAdmin ? { color: '#0f172a', fontWeight: 800, fontSize: '13.5px' } : {}}>{nama}</span>
              <span className="peran" style={isSuperAdmin ? { color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' } : {}}>{role === 'ADM' ? 'ADM' : (ROLE_LABEL[role] ?? role)}</span>
            </div>
          </div>
        </div>
        
        {/* Tombol Keluar */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="btn-keluar"
          aria-label="Keluar dari sistem"
          style={isSuperAdmin ? {
            background: '#18181b',
            color: '#ffffff',
            borderRadius: '12px',
            border: 'none',
            padding: '8px 16px',
            fontWeight: 700,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          } : {}}
        >
          <LogOut size={16} />
          <span className="hide-mobile">Keluar</span>
        </button>
      </div>
    </header>
  )
}

