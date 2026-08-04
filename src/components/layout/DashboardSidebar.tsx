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
  Menu
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

  const handleHamburgerClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 800) {
      onClose()
    } else {
      onToggleCollapse()
    }
  }

  return (
    <aside className={`app-sidebar ${isOpen ? 'buka' : ''} ${isCollapsed ? 'collapsed' : ''}`}>

      <div className="sidebar-header">
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', alignItems: 'center' }}>
          <img 
            src="/logo-sugity.jpg" 
            alt="Sugity Logo" 
            className="logo-sugity" 
            style={{ 
              filter: 'url(#remove-black)',
              transition: 'all 0.3s ease',
              mixBlendMode: 'screen' // fallback/enhancement
            }} 
          />
        </div>

        <div style={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'space-between', alignItems: 'center', width: '100%', gap: '8px', marginTop: isCollapsed ? '8px' : '4px' }}>
          <div className="judul" style={{ flex: 1, minWidth: 0 }}>
            <b style={{ display: 'block', fontSize: '16px', lineHeight: 1.2 }}>Maintenance Report</b>
            <span style={{ fontSize: '10px', whiteSpace: 'nowrap', display: 'block', color: '#cfe6d8', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Molding Maintenance Dept</span>
          </div>
          <button
            type="button"
            onClick={handleHamburgerClick}
            aria-label="Toggle Sidebar"
            title={isCollapsed ? "Perbesar Sidebar" : "Perkecil Sidebar"}
            className="sidebar-hamburger-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              flexShrink: 0,
              margin: isCollapsed ? '0 auto' : '0'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Menu size={20} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        {visibleTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={isAktif(tab.href) ? 'aktif' : ''}
            onClick={onClose}
          >
            <span className="icon"><tab.icon size={20} strokeWidth={2} /></span>
            <span className="text">{tab.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
