'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 flex items-end justify-around"
      style={{
        background: 'rgba(19,25,37,0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(({ href, icon: Icon, label }) => {
        const isHome = href === '/'
        const active = isHome ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 py-1.5 px-5 transition-all duration-200"
            style={{ color: active ? '#d4af37' : 'rgba(255,255,255,0.28)' }}
          >
            <Icon
              className="w-[17px] h-[17px] transition-all duration-200"
              strokeWidth={active ? 2.2 : 1.5}
            />
            <span
              className="text-[0.5rem] font-semibold tracking-wide transition-all duration-200"
              style={{ opacity: active ? 1 : 0.7 }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
