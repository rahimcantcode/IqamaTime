'use client'

import { useEffect } from 'react'

export default function ViewportFix() {
  useEffect(() => {
    const updateViewport = () => {
      const viewport = window.visualViewport
      const height = viewport?.height || window.innerHeight
      const offsetTop = viewport?.offsetTop || 0

      document.documentElement.style.setProperty('--app-height', `${height}px`)
      document.documentElement.style.setProperty('--app-viewport-offset-top', `${offsetTop}px`)
    }

    updateViewport()

    const refreshSoon = () => {
      updateViewport()
      window.setTimeout(updateViewport, 80)
      window.setTimeout(updateViewport, 240)
    }

    window.addEventListener('resize', refreshSoon)
    window.addEventListener('orientationchange', refreshSoon)
    window.visualViewport?.addEventListener('resize', refreshSoon)
    window.visualViewport?.addEventListener('scroll', refreshSoon)

    return () => {
      window.removeEventListener('resize', refreshSoon)
      window.removeEventListener('orientationchange', refreshSoon)
      window.visualViewport?.removeEventListener('resize', refreshSoon)
      window.visualViewport?.removeEventListener('scroll', refreshSoon)
    }
  }, [])

  return null
}
