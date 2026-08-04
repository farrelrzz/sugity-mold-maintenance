'use client'

import { useState, useEffect } from 'react'
import DashboardSidebar from './DashboardSidebar'
import DashboardHeader from './DashboardHeader'
import { useSession } from 'next-auth/react'

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true) // Default true for Quixotic icon dock aesthetic!
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
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      setIsSidebarOpen(true)
    } else {
      setIsCollapsed(prev => !prev)
    }
  }

  return (
    <div className="min-h-screen bg-[#eff2f6] dark:bg-slate-950 font-sans transition-colors text-slate-800 dark:text-slate-100" data-role={role}>
      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[45] lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <DashboardSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      
      <div className={`transition-all duration-300 ease-out flex flex-col min-h-screen p-3 sm:p-5 md:p-7 ${isCollapsed ? 'lg:pl-[120px]' : 'lg:pl-[285px]'}`}>
        <DashboardHeader 
          onMenuClick={handleToggleMenu} 
        />
        <main className="flex-1 w-full max-w-[1650px] mx-auto pt-5 pb-12">
          {children}
        </main>
      </div>
    </div>
  )
}
