'use client'

import { ReactNode, TouchEvent, useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import BottomNav from './bottom-nav'

const PAGE_ROUTES = ['/progress', '/updates', '/', '/dhikr', '/settings'] as const

function routeIndex(pathname: string): number {
  const index = PAGE_ROUTES.findIndex((route) =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  )
  return index === -1 ? 2 : index
}

function shouldIgnoreSwipe(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      'a, button, input, textarea, select, [role="button"], [data-page-swipe-ignore="true"]'
    )
  )
}

interface SwipeStart {
  x: number
  y: number
  ignored: boolean
}

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const activeIndex = useMemo(() => routeIndex(pathname), [pathname])
  const startRef = useRef<SwipeStart | null>(null)
  const [direction, setDirection] = useState(0)

  const navigateBy = useCallback((delta: -1 | 1) => {
    const nextIndex = activeIndex + delta
    if (nextIndex < 0 || nextIndex >= PAGE_ROUTES.length) return

    setDirection(delta)
    router.push(PAGE_ROUTES[nextIndex], { scroll: false })
  }, [activeIndex, router])

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    startRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      ignored: shouldIgnoreSwipe(event.target),
    }
  }, [])

  const handleTouchEnd = useCallback((event: TouchEvent<HTMLDivElement>) => {
    const start = startRef.current
    startRef.current = null
    if (!start || start.ignored) return

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (absX < 78 || absX < absY * 1.45) return
    navigateBy(deltaX < 0 ? 1 : -1)
  }, [navigateBy])

  return (
    <div
      data-app-shell="true"
      className="fixed inset-0 overflow-hidden bg-[#131925]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={pathname}
          custom={direction}
          initial={{ x: direction >= 0 ? 48 : -48, opacity: 0.92 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction >= 0 ? -48 : 48, opacity: 0.92 }}
          transition={{ type: 'spring', stiffness: 360, damping: 36, mass: 0.85 }}
          className="fixed inset-0 overflow-hidden"
        >
          {children}
        </motion.div>
      </AnimatePresence>
      <BottomNav />
    </div>
  )
}
