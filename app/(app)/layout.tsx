import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { UserProvider } from '@/components/user-provider'
import type { Profile } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { count: unreadCount }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('to_user', user.id).is('read_at', null),
  ])

  if (!profile) redirect('/login?error=Profile+not+found')

  return (
    <UserProvider profile={profile as Profile}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar unreadCount={unreadCount ?? 0} />
        <main className="flex-1 overflow-auto p-4 pt-16 pb-24 md:pt-8 md:pb-8 md:p-8">
          {children}
        </main>
      </div>
    </UserProvider>
  )
}
