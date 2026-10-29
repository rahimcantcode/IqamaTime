'use client'

import { useEffect, useState } from 'react'
import { dallasDate } from '@/lib/dallas-date'

export function useDallasDate() {
  const [date, setDate] = useState(() => dallasDate())
  useEffect(() => {
    const refresh = () => setDate(dallasDate())
    const timer = window.setInterval(refresh, 30_000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  return date
}
