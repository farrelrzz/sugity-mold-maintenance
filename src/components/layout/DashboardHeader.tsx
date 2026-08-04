'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, LogOut, User, Menu, Search, Sparkles, Shield, ChevronDown } from 'lucide-react'

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
  const pathname = usePathname()

  const nama = session?.user?.name ?? 'Farrel Rizky'
  const role = session?.user?.role ?? 'SUPER_ADMIN'

  const ROLE_LABEL: Record<string, string> = {
    PIC: 'PIC Member',
    TL: 'Team Leader',
    GL: 'Group Leader',
    CL: 'Chief Coord',
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

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Reports', href: '/riwayat' },
    { label: 'Mold Book', href: '/mold-book' },
    { label: 'Maintenance', href: '/jadwal' },
    { label: 'Approvals', href: '/approval' }
  ]

  return (
    <header className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-[34px] px-5 py-3.5 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_25px_rgba(0,0,0,0.035)] flex items-center justify-between gap-4 sticky top-4 z-40 transition-all w-full max-w-[1650px] mx-auto mb-3">
      {/* Left Area: Mobile Menu Button & Quixotic Brand Title */}
      <div className="flex items-center gap-3.5">
        <button 
          className="lg:hidden w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-sm active:scale-95 transition-all"
          onClick={onMenuClick} 
          aria-label="Toggle Menu"
        >
          <Menu size={20} strokeWidth={2.3} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center shadow-md text-base tracking-tight shrink-0">
            Q
          </div>
          <div className="flex flex-col">
            <span className="text-base md:text-lg font-black text-slate-800 dark:text-white tracking-tight leading-none flex items-center gap-1.5">
              Sugity<span className="text-emerald-600 font-extrabold">Mold</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase hidden sm:block">PT Sugity Creatives</span>
          </div>
        </div>
      </div>

      {/* Center Area: Quixotic Capsule Navigation Pills */}
      <div className="hidden xl:inline-flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-full border border-slate-200/70 dark:border-slate-700/70 shadow-inner">
        {navLinks.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-5 py-2 rounded-full font-extrabold text-xs md:text-sm transition-all duration-300 ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-emerald-950 dark:text-white shadow-sm scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white/50'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Right Area: Search, Notifications & User Avatar Pill */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Icon */}
        <button 
          type="button"
          aria-label="Search" 
          className="w-10 h-10 rounded-full bg-slate-100/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500 hover:text-emerald-600 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-sm hover:scale-105 transition-all duration-200 shrink-0"
          onClick={() => {
            const searchInput = document.querySelector('input[type="search"]') as HTMLElement;
            if (searchInput) searchInput.focus();
          }}
        >
          <Search size={18} strokeWidth={2.2} />
        </button>

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={handleBellClick}
            aria-label="Notifikasi"
            className="w-10 h-10 rounded-full bg-slate-100/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500 hover:text-emerald-600 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-sm hover:scale-105 transition-all duration-200 relative shrink-0"
          >
            <Bell size={18} strokeWidth={2.2} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-white dark:border-slate-900 animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden text-slate-800 dark:text-slate-200 animate-fade-in">
              <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-3 font-extrabold text-sm border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span>Notifications</span>
                <span className="text-[11px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                  {notifs.length} Total
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifs.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 font-semibold text-xs">
                    No new notifications
                  </div>
                ) : (
                  notifs.map(n => (
                    <Link
                      key={n.id}
                      href={getNotifLink(n) || '#'}
                      className={`flex items-start p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        !n.dibaca ? 'bg-emerald-50/40 dark:bg-emerald-950/20 font-bold' : ''
                      }`}
                    >
                      <div className="text-lg mr-3 shrink-0">{getTipeIcon(n.tipe)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{n.judul}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.pesan}</div>
                        <div className="text-[10px] text-emerald-600 font-semibold mt-1">{formatTime(n.createdAt)}</div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm rounded-full py-1 sm:py-1.5 px-2.5 sm:px-3 flex items-center gap-2.5 hover:shadow-md transition-all">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0d6840] to-emerald-500 text-white font-extrabold text-xs flex items-center justify-center shadow-md shrink-0 border-2 border-white">
            {nama.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:flex flex-col leading-tight">
            <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white truncate max-w-[120px]">{nama}</span>
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">{ROLE_LABEL[role] ?? role}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Keluar / Sign Out"
            aria-label="Sign Out"
            className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 text-rose-600 hover:text-white flex items-center justify-center transition-all duration-200 ml-1 shrink-0"
          >
            <LogOut size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </header>
  )
}
