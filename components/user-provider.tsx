'use client'

import { createContext, useContext } from 'react'
import type { Profile } from '@/types'

const UserContext = createContext<Profile | null>(null)

export function UserProvider({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return <UserContext.Provider value={profile}>{children}</UserContext.Provider>
}

export function useUser(): Profile {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
