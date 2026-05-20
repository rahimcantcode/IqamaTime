import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'IqamaTime',
  description: 'Elegant prayer & iqama times for Dallas-area masjids',
  applicationName: 'IqamaTime',
  appleWebApp: {
    capable: true,
    title: 'IqamaTime',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [
      { url: '/icons/apple-icon-180.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#FAFAF7',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-icon-180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full bg-[#FAFAF7] text-[#202124]">
        {children}
        <Script id="register-service-worker" strategy="afterInteractive">
          {`if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{});})}`}
        </Script>
      </body>
    </html>
  )
}
