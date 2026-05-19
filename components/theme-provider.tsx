'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type AppTheme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: AppTheme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: AppTheme) => void
  toggleTheme: () => void
}

const THEME_KEY = 'iqamatime:theme'
const ThemeContext = createContext<ThemeContextValue | null>(null)

function getStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem(THEME_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: AppTheme) {
  if (typeof document === 'undefined') return 'light'

  const resolved = theme === 'system' ? getSystemTheme() : theme
  const root = document.documentElement

  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved

  const themeMeta = document.querySelector('meta[name="theme-color"]')
  themeMeta?.setAttribute('content', resolved === 'dark' ? '#0B100D' : '#FAFAF7')

  const statusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
  statusMeta?.setAttribute('content', resolved === 'dark' ? 'black-translucent' : 'default')

  return resolved
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = getStoredTheme()
    setThemeState(stored)
    setResolvedTheme(applyTheme(stored))
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (getStoredTheme() === 'system') {
        setResolvedTheme(applyTheme('system'))
      }
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  const setTheme = useCallback((nextTheme: AppTheme) => {
    localStorage.setItem(THEME_KEY, nextTheme)
    setThemeState(nextTheme)
    setResolvedTheme(applyTheme(nextTheme))
  }, [])

  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }, [resolvedTheme, setTheme])

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  }), [theme, resolvedTheme, setTheme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
