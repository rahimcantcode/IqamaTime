'use client'

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
      <p
        className="font-mono text-6xl font-bold tracking-tight tabular-nums"
        style={{ color: accentColor }}
      >
        {compact}
      </p>
      <p
        className="text-sm font-medium tracking-widest uppercase"
        style={{ color: `${accentColor}99` }}
      >
        {text}
      </p>
    </div>
  )
}
