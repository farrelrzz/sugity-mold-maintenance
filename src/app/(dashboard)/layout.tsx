import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppLayoutWrapper from '@/components/layout/AppLayoutWrapper'
import { prisma } from '@/lib/prisma'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const mmSetting = await prisma.systemSetting.findUnique({
    where: { key: 'maintenance_mode' }
  })

  // Block non-SUPER_ADMIN users if maintenance mode is true
  if (mmSetting?.value === 'true' && (session.user as any).role !== 'SUPER_ADMIN') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', 
        justifyContent: 'center', height: '100vh', background: '#f8fafc', 
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          background: '#fff', padding: '40px', borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)', textAlign: 'center'
        }}>
          <h1 style={{ color: '#c53030', fontSize: '32px', marginBottom: '16px' }}>🚧 Maintenance Mode</h1>
          <p style={{ color: '#4a5568', fontSize: '16px', maxWidth: '400px', lineHeight: '1.6' }}>
            Website sedang dalam pemeliharaan sistem. Silakan kembali lagi dalam beberapa saat.
          </p>
        </div>
      </div>
    )
  }

  return (
    <AppLayoutWrapper>
      {children}
    </AppLayoutWrapper>
  )
}

