'use client'

import { ReactNode } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <MotionConfig reducedMotion="user">
    <div
      data-app-shell="true"
      className="min-h-dvh bg-[--background]"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={pathname}
          initial={{ opacity: 0.96, scale: 0.992 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.96, scale: 0.992 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="min-h-dvh"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
    </MotionConfig>
  )
}
