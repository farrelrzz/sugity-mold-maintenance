'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  LayoutDashboard, 
  FileEdit, 
  BookOpen, 
  Calendar, 
  Menu,
  FileText
} from 'lucide-react'

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export default function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role || 'PIC'

  const isAktif = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <nav className="mobile-bottom-nav">
      <Link 
        href="/dashboard" 
        className={`nav-item ${isAktif('/dashboard') ? 'active' : ''}`}
        aria-label="Dashboard"
      >
        <LayoutDashboard size={22} />
        <span>Dasbor</span>
      </Link>

      {role === 'PIC' ? (
        <Link 
          href="/laporan/baru" 
          className={`nav-item ${isAktif('/laporan/baru') ? 'active' : ''}`}
          aria-label="Buat Laporan"
        >
          <FileEdit size={22} />
          <span>Lapor</span>
        </Link>
      ) : (
        <Link 
          href="/riwayat" 
          className={`nav-item ${isAktif('/riwayat') ? 'active' : ''}`}
          aria-label="Riwayat Laporan"
        >
          <FileText size={22} />
          <span>Laporan</span>
        </Link>
      )}

      <Link 
        href="/mold-book" 
        className={`nav-item ${isAktif('/mold-book') ? 'active' : ''}`}
        aria-label="Mold Book"
      >
        <BookOpen size={22} />
        <span>Mold</span>
      </Link>

      <Link 
        href="/jadwal" 
        className={`nav-item ${isAktif('/jadwal') ? 'active' : ''}`}
        aria-label="Jadwal Maintenance"
      >
        <Calendar size={22} />
        <span>Jadwal</span>
      </Link>

      <button 
        type="button" 
        onClick={onOpenMenu} 
        className="nav-item menu-trigger"
        aria-label="Buka Menu Lainnya"
      >
        <Menu size={22} />
        <span>Menu</span>
      </button>
    </nav>
  )
}
