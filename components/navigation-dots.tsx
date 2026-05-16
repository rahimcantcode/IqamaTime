'use client'

import { motion } from 'framer-motion'
import { PrayerMeta } from '@/types'

interface Props {
  prayers: PrayerMeta[]
  current: number
  onSelect: (index: number) => void
}

export default function NavigationDots({ prayers, current, onSelect }: Props) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {prayers.map((prayer, i) => (
        <button
          key={prayer.key}
          onClick={() => onSelect(i)}
          aria-label={`Go to ${prayer.displayName}`}
          className="flex flex-col items-center gap-1 group"
        >
          <motion.div
            animate={{
              width:   i === current ? 24 : 6,
              opacity: i === current ? 1  : 0.3,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="h-1.5 rounded-full bg-emerald-400"
          />
          {i === current && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1,  y: 0 }}
              className="text-[10px] font-medium text-emerald-400 tracking-wide uppercase"
            >
              {prayer.displayName}
            </motion.span>
          )}
        </button>
      ))}
    </div>
  )
}
