'use client'

import { useState, useEffect } from 'react'
import DashboardSidebar from './DashboardSidebar'
import DashboardHeader from './DashboardHeader'
import { useSession } from 'next-auth/react'

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { data: session } = useSession()
  const role = session?.user?.role || 'PIC'

  useEffect(() => {
    if (role) {
      document.documentElement.setAttribute('data-role', role)
      document.body.setAttribute('data-role', role)
    }
    return () => {
      document.documentElement.removeAttribute('data-role')
      document.body.removeAttribute('data-role')
    }
  }, [role])

  const handleToggleMenu = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 800) {
      setIsSidebarOpen(true)
    } else {
      setIsCollapsed(prev => !prev)
    }
  }

  return (
    <div className="app-layout" data-role={role}>
      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <DashboardSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      
      <div className={`app-main ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <DashboardHeader 
          onMenuClick={handleToggleMenu} 
        />
        <main className="konten">
          <div style={{ width: '100%', margin: '0 auto', paddingTop: '28px' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
