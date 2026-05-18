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
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[430px] justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        className="pointer-events-auto flex h-[58px] w-full items-center justify-around rounded-full px-2"
        style={{
          background: 'rgba(255,255,255,0.90)',
          backdropFilter: 'blur(24px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
          border: '1px solid rgba(231,226,216,0.90)',
          boxShadow: '0 4px 24px rgba(31,41,55,0.10), 0 1px 0 rgba(255,255,255,0.95) inset',
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
              className="relative flex min-w-0 flex-1 flex-col items-center gap-[3px] rounded-full px-2 py-2 transition-all duration-200 active:scale-[0.97]"
              style={{
                color:      active ? '#4F6F52' : '#9CA3AF',
                background: active ? 'rgba(79,111,82,0.10)' : 'transparent',
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
                style={{ opacity: active ? 1 : 0.7 }}
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
