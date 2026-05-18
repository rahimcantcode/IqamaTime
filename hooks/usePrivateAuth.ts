'use client'

import { useEffect, useState } from 'react'
import {
  getPrivateSession,
  subscribeToPrivateAuth,
  clearPrivateSession,
  PrivateUserSession,
} from '@/lib/private-auth'

export function usePrivateAuth() {
  const [session, setSession] = useState<PrivateUserSession | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const read = () => {
      setSession(getPrivateSession())
      setLoaded(true)
    }

    read()
    return subscribeToPrivateAuth(read)
  }, [])

  return {
    session,
    loaded,
    isLoggedIn: !!session,
    logout: clearPrivateSession,
  }
}
