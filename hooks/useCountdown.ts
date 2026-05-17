'use client'

import { useCallback, useEffect, useState } from 'react'
import { timeStrToDate } from '@/lib/prayer-utils'

export function useCountdown(targetTimeStr: string | null) {
  const getSeconds = useCallback(() => {
    if (!targetTimeStr) return 0
    const target = timeStrToDate(targetTimeStr)
    if (!target) return 0
    return Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000))
  }, [targetTimeStr])

  const [seconds, setSeconds] = useState(getSeconds)

  useEffect(() => {
    const tick = () => setSeconds(getSeconds())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [getSeconds])

  return seconds
}

export function useCurrentTime() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return now
}
