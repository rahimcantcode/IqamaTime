'use client'

import { usePathname, useRouter } from 'next/navigation'
import { TrendingUp, Bell, Home, BookOpen, Settings } from 'lucide-react'

const TABS = [
  { href: '/progress', icon: TrendingUp, label: 'Progress' },
  { href: '/updates',  icon: Bell,       label: 'Updates'  },
  { href: '/',         icon: Home,       label: 'Home'     },
  { href: '/dhikr',    icon: BookOpen,   label: 'Dhikr'    },
  { href: '/settings', icon: Settings,   label: 'Settings' },
] as const

export default function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()

  return (
    <nav
      className="fixed left-1/2 z-50 w-[90vw] max-w-[430px] -translate-x-1/2"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}
    >
      <div
        className="flex h-[60px] items-center justify-around rounded-full px-3"
        style={{
          background: 'rgba(19,25,37,0.88)',
          backdropFilter: 'blur(28px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset',
        }}
      >
        {TABS.map(({ href, icon: Icon, label }) => {
          const isHome = href === '/'
          const active = isHome ? pathname === '/' : pathname.startsWith(href)
          return (
            <button
              key={href}
              type="button"
              onClick={() => { if (!active) router.replace(href, { scroll: false }) }}
              className="relative flex flex-col items-center gap-[3px] rounded-full px-3.5 py-2 transition-all duration-200"
              style={{
                color: active ? '#d4af37' : 'rgba(255,255,255,0.32)',
                background: active ? 'rgba(212,175,55,0.12)' : 'transparent',
              }}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
            >
              <Icon
                className="h-[18px] w-[18px]"
                strokeWidth={active ? 2.2 : 1.5}
              />
              <span
                className="text-[0.48rem] font-semibold tracking-wide"
                style={{ opacity: active ? 1 : 0.55 }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
