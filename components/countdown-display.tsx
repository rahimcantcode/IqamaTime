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

  return (
    <p
      className="font-mono text-6xl font-bold tracking-tight tabular-nums"
      style={{ color: accentColor }}
    >
      {compact}
    </p>
  )
}
