'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Detects invite tokens in the URL hash when Supabase redirects to the root
export function InviteHandler() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return

    const params = new URLSearchParams(hash.replace('#', ''))
    const error = params.get('error')
    const errorDescription = params.get('error_description')
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')

    if (error) {
      const msg = errorDescription?.replace(/\+/g, ' ') ?? 'Invite link expired. Please ask your manager to send a new invite.'
      router.replace(`/login?error=${encodeURIComponent(msg)}`)
      return
    }

    if (accessToken && refreshToken && type === 'invite') {
      const supabase = createClient()
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(() => {
        router.replace('/set-password')
      })
    }
  }, [router])

  return null
}
