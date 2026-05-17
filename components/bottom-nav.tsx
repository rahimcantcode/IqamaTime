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
  const router = useRouter()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 px-2 pb-[env(safe-area-inset-bottom)]"
      style={{
        background: 'rgba(13,18,29,0.92)',
        backdropFilter: 'blur(24px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {TABS.map(({ href, icon: Icon, label }) => {
          const isHome = href === '/'
          const active = isHome ? pathname === '/' : pathname.startsWith(href)
          return (
            <button
              key={href}
              type="button"
              onClick={() => {
                if (!active) router.replace(href, { scroll: false })
              }}
              className="relative flex min-w-[58px] flex-col items-center gap-[3px] px-2 pb-1 pt-2 transition-all duration-200"
              style={{ color: active ? '#d4af37' : 'rgba(255,255,255,0.28)' }}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
            >
              {active && (
                <span
                  className="absolute top-0 h-0.5 w-7 rounded-full"
                  style={{ background: '#d4af37', boxShadow: '0 0 16px rgba(212,175,55,0.45)' }}
                />
              )}
              <Icon
                className="h-[19px] w-[19px] transition-all duration-200"
                strokeWidth={active ? 2.2 : 1.5}
              />
              <span
                className="text-[0.5rem] font-semibold tracking-wide"
                style={{ opacity: active ? 0.9 : 0.5 }}
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
