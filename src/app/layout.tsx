import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import ScrollObserver from '@/components/ui/ScrollObserver'

export const metadata: Metadata = {
  title: 'Sistem Maintenance - PT Sugity Creatives',
  description: 'Molding Maintenance Report System — PT Sugity Creatives',
  keywords: ['maintenance', 'mold', 'PT Sugity Creatives', 'laporan'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <svg style={{ display: 'none' }}>
          <filter id="remove-black" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              10 10 10 0 -1
            " />
          </filter>
        </svg>
        <SessionProvider>
          <ThemeProvider attribute="data-theme" defaultTheme="light" forcedTheme="light" enableSystem={false}>
            <ScrollObserver />
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
