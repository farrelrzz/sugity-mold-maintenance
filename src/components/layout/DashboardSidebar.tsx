'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
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
  LogOut
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

  // ==================== QUIXOTIC MINIMIZED MODE ====================
  // Regardless of role, when minimized, display the super sleek Quixotic floating white capsule
  if (isCollapsed) {
    return (
      <aside 
        className="app-sidebar collapsed quixotic-min-sidebar"
        style={{
          width: '80px',
          minWidth: '80px',
          background: '#ffffff',
          color: '#0f172a',
          borderRight: '1px solid #e2e8f0',
          boxShadow: '6px 0 30px rgba(0, 0, 0, 0.04)',
          padding: '20px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          overflowX: 'hidden',
          zIndex: 100
        }}
      >
        <style jsx global>{`
          .quixotic-min-sidebar .qx-icon-btn {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
            text-decoration: none;
            transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
            position: relative;
            margin: 5px 0;
            border: none;
            background: transparent;
            cursor: pointer;
          }
          .quixotic-min-sidebar .qx-icon-btn:hover {
            color: #0f172a;
            background: #f1f5f9;
            transform: scale(1.06);
          }
          .quixotic-min-sidebar .qx-icon-btn.active {
            background: #059669 !important;
            color: #ffffff !important;
            box-shadow: 0 6px 18px -2px rgba(5, 150, 105, 0.45);
            transform: scale(1);
          }
          .quixotic-min-sidebar .qx-icon-btn.logout:hover {
            background: #fef2f2 !important;
            color: #dc2626 !important;
            border: 1px solid #fecaca;
            transform: scale(1.08);
          }
          /* Override default global width and background in collapsed state */
          .app-sidebar.collapsed.quixotic-min-sidebar {
            width: 80px !important;
            background: #ffffff !important;
          }
        `}</style>

        {/* Top Section: Expand Toggle Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '8px' }}>
          <button
            type="button"
            onClick={handleHamburgerClick}
            title="Perbesar Sidebar (Expand)"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'none'; }}
          >
            <Menu size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Center Navigation Icons Dock */}
        <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', overflowY: 'auto', overflowX: 'hidden', flex: 1, padding: '4px 0', scrollbarWidth: 'none' }}>
          {visibleTabs.map((tab) => {
            const active = isAktif(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`qx-icon-btn ${active ? 'active' : ''}`}
                onClick={onClose}
                title={tab.label}
              >
                <tab.icon size={22} strokeWidth={2.2} />
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section: Settings & Logout (Quixotic Bottom Dock) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingTop: '14px', borderTop: '1px solid #f1f5f9', marginTop: 'auto' }}>
          <Link
            href={role === 'SUPER_ADMIN' ? '/pengaturan-sistem' : '/kelola-akun'}
            className={`qx-icon-btn ${isAktif('/pengaturan-sistem') || isAktif('/kelola-akun') ? 'active' : ''}`}
            title="Pengaturan Sistem & Akun"
            onClick={onClose}
          >
            <Settings size={22} strokeWidth={2.2} />
          </Link>
          
          <button
            type="button"
            className="qx-icon-btn logout"
            title="Keluar (Log Out)"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut size={21} strokeWidth={2.2} />
          </button>
        </div>
      </aside>
    );
  }

  // ==================== EXPANDED MODO SUPER ADMIN ====================
  if (role === 'SUPER_ADMIN' || role === 'SUPERADMIN') {
    return (
      <aside 
        className={`app-sidebar ${isOpen ? 'buka' : ''} ${isCollapsed ? 'collapsed' : ''} superadmin-idraft-sidebar`}
        style={{
          background: '#ffffff',
          color: '#0f172a',
          borderRight: '1px solid #e2e8f0',
          boxShadow: '4px 0 35px rgba(0,0,0,0.03)',
          padding: '20px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        <style jsx global>{`
          .superadmin-idraft-sidebar .sa-menu-link {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 12px 18px;
            border-radius: 16px;
            color: #64748b;
            font-weight: 600;
            font-size: 14.5px;
            text-decoration: none;
            transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
            margin-bottom: 4px;
          }
          .superadmin-idraft-sidebar .sa-menu-link:hover {
            color: #0f172a;
            background: #f8fafc;
            transform: translateX(3px);
          }
          .superadmin-idraft-sidebar .sa-menu-link.active {
            background: #18181b !important;
            color: #ffffff !important;
            font-weight: 700;
            box-shadow: 0 6px 18px -4px rgba(0,0,0,0.25);
            transform: translateX(0);
          }
          .superadmin-idraft-sidebar .sa-section-title {
            font-size: 11px;
            font-weight: 800;
            color: #94a3b8;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            margin: 20px 8px 8px 14px;
          }
        `}</style>

        {/* Top Section: Branding & Main Navigation */}
        <div style={{ overflowY: 'auto', overflowX: 'hidden' }}>
          {/* Logo Brand Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px 24px 6px', borderBottom: '1px solid #f1f5f9', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 900, fontSize: '20px', boxShadow: '0 6px 14px -2px rgba(0,0,0,0.2)' }}>
                ⚡
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <b style={{ fontSize: '19px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1.1 }}>sugity</b>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Superadmin</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleHamburgerClick}
              title="Perkecil Sidebar"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
            >
              <Menu size={18} strokeWidth={2.2} />
            </button>
          </div>

          {/* Main Navigation Group */}
          <nav>
            <Link href="/dashboard" className={`sa-menu-link ${isAktif('/dashboard') ? 'active' : ''}`} onClick={onClose}>
              <LayoutDashboard size={20} strokeWidth={2.2} />
              <span className="text">Dashboard</span>
            </Link>
            <Link href="/jadwal" className={`sa-menu-link ${isAktif('/jadwal') ? 'active' : ''}`} onClick={onClose}>
              <Calendar size={20} strokeWidth={2.2} />
              <span className="text">Calendar & Maint</span>
            </Link>
            <Link href="/riwayat" className={`sa-menu-link ${isAktif('/riwayat') ? 'active' : ''}`} onClick={onClose}>
              <FileText size={20} strokeWidth={2.2} />
              <span className="text">Reports Archive</span>
            </Link>
            <Link href="/approval" className={`sa-menu-link ${isAktif('/approval') ? 'active' : ''}`} onClick={onClose}>
              <CheckSquare size={20} strokeWidth={2.2} />
              <span className="text">Statistics & Appv</span>
            </Link>
            <Link href="/mold-book" className={`sa-menu-link ${isAktif('/mold-book') ? 'active' : ''}`} onClick={onClose}>
              <BookOpen size={20} strokeWidth={2.2} />
              <span className="text">Mold Documents</span>
            </Link>

            {/* INTEGRATIONS & SECURITY MODULES */}
            <div className="sa-section-title">SYSTEM MODULES</div>
            <Link href="/audit-log" className={`sa-menu-link ${isAktif('/audit-log') ? 'active' : ''}`} onClick={onClose}>
              <ShieldCheck size={20} strokeWidth={2.2} />
              <span className="text">Audit Log</span>
            </Link>
            <Link href="/kalender-safety" className={`sa-menu-link ${isAktif('/kalender-safety') ? 'active' : ''}`} onClick={onClose}>
              <ShieldAlert size={20} strokeWidth={2.2} />
              <span className="text">Safety Calendar</span>
            </Link>
            <Link href="/laporan/baru" className="sa-menu-link" style={{ color: '#0f172a', fontWeight: 700 }} onClick={onClose}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1.5px dashed #64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800 }}>+</span>
              <span className="text">Add new report</span>
            </Link>

            {/* TEAMS & USERS */}
            <div className="sa-section-title">TEAMS & ACCOUNTS</div>
            <Link href="/kelola-akun" className={`sa-menu-link ${isAktif('/kelola-akun') ? 'active' : ''}`} onClick={onClose}>
              <Users size={20} strokeWidth={2.2} />
              <span className="text">Manajemen User</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Section: Settings */}
        <div style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9', marginTop: '16px' }}>
          <Link href="/pengaturan-sistem" className={`sa-menu-link ${isAktif('/pengaturan-sistem') ? 'active' : ''}`} onClick={onClose}>
            <Settings size={20} strokeWidth={2.2} />
            <span className="text">System Settings</span>
          </Link>
        </div>
      </aside>
    );
  }

  // ==================== EXPANDED MODE REGULAR USERS ====================
  return (
    <aside className={`app-sidebar ${isOpen ? 'buka' : ''}`}>
      <div className="sidebar-header">

        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', alignItems: 'center' }}>
          <img 
            src="/logo-sugity.jpg" 
            alt="Sugity Logo" 
            className="logo-sugity" 
            style={{ 
              filter: 'url(#remove-black)',
              transition: 'all 0.3s ease',
              mixBlendMode: 'screen'
            }} 
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px', marginTop: '4px' }}>
          <div className="judul" style={{ flex: 1, minWidth: 0 }}>
            <b style={{ display: 'block', fontSize: '16px', lineHeight: 1.2 }}>Maintenance Report</b>
            <span style={{ fontSize: '10px', whiteSpace: 'nowrap', display: 'block', color: '#cfe6d8', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>Molding Maintenance Dept</span>
          </div>
          <button
            type="button"
            onClick={handleHamburgerClick}
            aria-label="Perkecil Sidebar"
            title="Perkecil Sidebar"
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
              flexShrink: 0
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
