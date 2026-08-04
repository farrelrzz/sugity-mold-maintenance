'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { 
  LayoutDashboard, 
  FileEdit, 
  FileText, 
  History, 
  Users, 
  BookOpen, 
  Calendar, 
  Settings, 
  ShieldCheck, 
  ShieldAlert,
  Clock, 
  CheckSquare,
  Menu,
  ChevronRight,
  ChevronLeft,
  Grid,
  Sparkles
} from 'lucide-react'

const NAV_TABS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['PIC', 'TL', 'GL', 'CL', 'ADM', 'SUPER_ADMIN'] },
  { href: '/laporan/baru', label: 'Buat Laporan', icon: FileEdit, roles: ['PIC'] },
  { href: '/riwayat', label: 'Laporan', icon: FileText, roles: ['PIC', 'TL', 'GL', 'CL', 'ADM'] },
  { href: '/riwayat-mold', label: 'Riwayat Mold', icon: History, roles: ['PIC', 'TL', 'GL', 'CL', 'ADM'] },
  { href: '/kelola-akun', label: 'Manajemen User', icon: Users, roles: ['SUPER_ADMIN'] },
  { href: '/mold-book', label: 'Mold Book', icon: BookOpen, roles: ['PIC', 'TL', 'GL', 'CL', 'ADM', 'SUPER_ADMIN'] },
  { href: '/jadwal', label: 'Maintenance', icon: Calendar, roles: ['PIC', 'TL', 'GL', 'CL', 'ADM', 'SUPER_ADMIN'] },
  { href: '/kalender-safety', label: 'Kalender Safety', icon: ShieldAlert, roles: ['TL', 'GL', 'CL', 'ADM', 'SUPER_ADMIN'] },
  { href: '/pengaturan-sistem', label: 'Pengaturan Sistem', icon: Settings, roles: ['SUPER_ADMIN'] },
  { href: '/audit-log', label: 'Audit Log', icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
  { href: '/overtime', label: 'Overtime', icon: Clock, roles: ['PIC', 'TL', 'GL', 'CL', 'ADM'] },
  { href: '/approval', label: 'Approval', icon: CheckSquare, roles: ['TL', 'GL', 'CL', 'ADM'] },
]

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function DashboardSidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role ?? ''

  const visibleTabs = NAV_TABS.filter(t => t.roles.includes(role))

  const isAktif = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/riwayat') return pathname === '/riwayat' || pathname.startsWith('/riwayat/');
    return pathname.startsWith(href);
  }

  // Handle close on mobile when route changes
  useEffect(() => {
    onClose()
  }, [pathname])

  return (
    <>
      {/* DESKTOP FLOATING VERTICAL PILL DOCK (Quixotic Style) */}
      <aside className={`fixed left-4 top-5 bottom-5 z-50 hidden lg:flex flex-col justify-between transition-all duration-300 ease-out bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.06)] py-5 my-auto select-none rounded-[40px] ${isCollapsed ? 'w-20 px-2' : 'w-64 px-5'}`}>
        
        {/* Top Branding Section */}
        <div className={`flex items-center gap-3 w-full pb-4 border-b border-slate-100 dark:border-slate-800/80 ${isCollapsed ? 'justify-center' : 'px-1'}`}>
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500/30 shadow-md transition-transform duration-300 group-hover:scale-105 flex items-center justify-center bg-white shrink-0">
              <img 
                src="/logo-sugity.jpg" 
                alt="Sugity Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight leading-tight">Sugity Mold</span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  Online System
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Center Navigation Icons Stack */}
        <nav className="flex-1 my-4 flex flex-col gap-2 overflow-y-auto overflow-x-visible w-full py-1 no-scrollbar">
          {visibleTabs.map((tab) => {
            const active = isAktif(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-3.5 rounded-full transition-all duration-300 relative group font-bold ${
                  active 
                    ? isCollapsed 
                      ? 'w-12 h-12 justify-center mx-auto bg-gradient-to-br from-emerald-600 via-[#0d6840] to-[#084228] text-white shadow-lg shadow-emerald-700/35 scale-105' 
                      : 'px-4 py-3.5 bg-gradient-to-r from-emerald-600 via-[#0d6840] to-emerald-700 text-white shadow-md shadow-emerald-700/25 w-full'
                    : isCollapsed
                      ? 'w-12 h-12 justify-center mx-auto text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white'
                      : 'px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-emerald-700 dark:hover:text-emerald-400 w-full'
                }`}
              >
                <tab.icon size={20} strokeWidth={active ? 2.5 : 2} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
                
                {!isCollapsed && (
                  <span className="text-sm tracking-wide truncate">{tab.label}</span>
                )}

                {/* Modern Hover Tooltip in Collapsed Mode */}
                {isCollapsed && (
                  <span className="absolute left-[62px] top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-slate-900 text-white text-xs font-extrabold rounded-xl shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:left-[54px] transition-all duration-200 z-[100] border border-slate-700 flex items-center gap-1.5">
                    {tab.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Utility Area */}
        <div className={`pt-4 border-t border-slate-100 dark:border-slate-800/80 flex ${isCollapsed ? 'flex-col items-center gap-3' : 'flex-row justify-between px-2'} w-full`}>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Toggle Dock Width"
            title={isCollapsed ? "Perbesar Sidebar" : "Perkecil Sidebar"}
            className="w-11 h-11 rounded-full bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-105 active:scale-95 shrink-0"
          >
            {isCollapsed ? <ChevronRight size={19} strokeWidth={2.5} /> : <ChevronLeft size={19} strokeWidth={2.5} />}
          </button>

          {!isCollapsed && (
            <div className="flex flex-col text-right truncate">
              <span className="text-[11px] font-bold text-slate-500">v2.4 Quixotic</span>
              <span className="text-[10px] text-slate-400">Molding Div</span>
            </div>
          )}
        </div>
      </aside>

      {/* MOBILE SLIDE-IN DRAWER & BOTTOM DOCK */}
      <aside className={`fixed top-0 bottom-0 left-0 z-[55] w-[280px] bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between lg:hidden transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-500/30 shadow-md shrink-0 bg-white flex items-center justify-center">
              <img src="/logo-sugity.jpg" alt="Sugity Logo" className="w-9 h-9 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">Sugity Mold</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Maintenance Dept</span>
            </div>
          </div>

          <nav className="mt-6 flex flex-col gap-2 max-h-[65vh] overflow-y-auto">
            {visibleTabs.map((tab) => {
              const active = isAktif(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={onClose}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm ${
                    active 
                      ? 'bg-gradient-to-r from-emerald-600 via-[#0d6840] to-emerald-700 text-white shadow-md shadow-emerald-700/20' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <tab.icon size={20} strokeWidth={2} className="shrink-0" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs font-semibold text-slate-400">
          PT Sugity Creatives © 2026
        </div>
      </aside>
    </>
  )
}
