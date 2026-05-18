'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TrendingUp, Bell, Home, BookOpen, Settings } from 'lucide-react'

const TABS = [
  { href: '/progress', icon: TrendingUp, label: 'Progress' },
  { href: '/updates', icon: Bell, label: 'Updates' },
  { href: '/', icon: Home, label: 'Home' },
  { href: '/dhikr', icon: BookOpen, label: 'Dhikr' },
  { href: '/settings', icon: Settings, label: 'Settings' },
] as const

function getDynamicBottomOffset() {
  if (typeof window === 'undefined') return 4

  const viewport = window.visualViewport
  const userAgent = window.navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true

  if (!isIOS) return 8
  if (isStandalone) return 4

  if (!viewport) return 4

  const browserChromeBottom = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)

  // Mobile Safari sometimes reports a temporary browser chrome value on first paint.
  // Keeping this very low anchors the nav to the visible bottom immediately, while
  // still letting rotation/toolbar changes settle without jumping high.
  if (browserChromeBottom > 80) return 2
  if (browserChromeBottom > 40) return 3

  return 4
}

export default function BottomNav() {
  const pathname = usePathname()
  const [bottomOffset, setBottomOffset] = useState(4)

  useEffect(() => {
    const update = () => setBottomOffset(getDynamicBottomOffset())

    update()
    const timers = [40, 120, 300, 700].map(delay => window.setTimeout(update, delay))

    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)

    return () => {
      timers.forEach(timer => window.clearTimeout(timer))
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
    }
  }, [])

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 z-40 mx-auto flex max-w-2xl justify-center px-4"
      style={{ bottom: `${bottomOffset}px` }}
    >
      <div
        className="pointer-events-auto flex w-full items-center justify-between rounded-full px-3 py-1.5 backdrop-blur-xl"
        style={{
          background: 'rgba(255,255,255,0.62)',
          border: '1px solid rgba(79,111,82,0.24)',
          boxShadow: '0 -3px 16px rgba(79,111,82,0.08), 0 10px 28px rgba(93,109,90,0.08)',
        }}
      >
        {TABS.map(({ href, icon: Icon, label }) => {
          const isHome = href === '/'
          const active = isHome ? pathname === '/' : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1.5 text-[10px] font-medium transition-[color,transform] duration-300 active:scale-[0.97] ${active ? 'text-[#4F6F52]' : 'text-[rgba(122,122,122,0.82)]'}`}
            >
              {active ? (
                <motion.span
                  layoutId="iqamatime-bottom-nav-pill"
                  className="absolute inset-0 rounded-full bg-[rgba(237,243,235,0.72)] shadow-[inset_0_1px_0_rgba(255,255,255,0.38)]"
                  transition={{ type: 'spring', stiffness: 340, damping: 28, mass: 0.6 }}
                />
              ) : null}

              <Icon className="relative z-10 h-3.5 w-3.5" strokeWidth={active ? 2.2 : 1.8} />
              <span className="relative z-10">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
