import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import AppChrome from '@/components/AppChrome'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Patel Heritage - Society Management System',
  description: 'Comprehensive society management application for Patel Heritage',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    // iOS only delivers push to an installed PWA, so it must be installable.
    capable: true,
    title: 'Patel Heritage',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
}

export const viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  // The gate kiosk and the ring overlay are fixed full-screen surfaces; a
  // stray pinch-zoom on either is a usability problem, not a feature.
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AppChrome>{children}</AppChrome>
        </AuthProvider>
      </body>
    </html>
  )
}

