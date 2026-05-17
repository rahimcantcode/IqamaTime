'use client'

import { useCountdown } from '@/hooks/useCountdown'
import { formatCountdownCompact } from '@/lib/prayer-utils'

interface Props {
  targetTime: string | null
  accentColor: string
}

export default function CountdownDisplay({ targetTime, accentColor }: Props) {
  const seconds = useCountdown(targetTime)
  const compact = formatCountdownCompact(seconds)

  return (
    <p
      className="font-mono text-[3.35rem] font-bold leading-none tracking-tight tabular-nums"
      style={{ color: accentColor }}
      suppressHydrationWarning
    >
      {compact}
    </p>
  )
}
