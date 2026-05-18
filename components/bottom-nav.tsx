'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
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
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-2xl justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        className="pointer-events-auto flex w-full items-center justify-between rounded-full px-3 py-2 backdrop-blur-xl"
        style={{
          background: 'rgba(255,255,255,0.68)',
          border: '1px solid rgba(255,255,255,0.70)',
          boxShadow: '0 -4px 22px rgba(123,138,119,0.06), 0 20px 52px rgba(93,109,90,0.10)',
        }}
      >
        {TABS.map(({ href, icon: Icon, label }) => {
          const isHome = href === '/'
          const active = isHome ? pathname === '/' : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-full px-2 py-2 text-[11px] font-medium transition-[color,transform] duration-300 active:scale-[0.97] ${
                active ? 'text-[#4F6F52]' : 'text-[rgba(122,122,122,0.9)]'
              }`}
            >
              {active ? (
                <motion.span
                  layoutId="iqamatime-bottom-nav-pill"
                  className="absolute inset-0 rounded-full bg-[rgba(237,243,235,0.92)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                  transition={{ type: 'spring', stiffness: 340, damping: 28, mass: 0.6 }}
                />
              ) : null}

              <Icon
                className="relative z-10 h-4 w-4"
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span className="relative z-10">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
