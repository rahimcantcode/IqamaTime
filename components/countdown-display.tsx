'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useCountdown } from '@/hooks/useCountdown'
import { formatCountdownCompact, formatCountdownText } from '@/lib/prayer-utils'

interface Props {
  targetTime: string | null
  accentColor: string
}

export default function CountdownDisplay({ targetTime, accentColor }: Props) {
  const seconds = useCountdown(targetTime)
  const compact = formatCountdownCompact(seconds)
  const text    = formatCountdownText(seconds)

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Large timer */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={compact}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="font-mono text-6xl font-bold tracking-tight tabular-nums"
          style={{ color: accentColor }}
        >
          {compact}
        </motion.div>
      </AnimatePresence>

      {/* Human-readable label */}
      <motion.p
        key={text}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm font-medium tracking-widest uppercase"
        style={{ color: `${accentColor}99` }}
      >
        {text}
      </motion.p>
    </div>
  )
}
