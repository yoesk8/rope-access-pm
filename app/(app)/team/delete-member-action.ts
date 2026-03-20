'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function deleteMember(userId: string) {
  // Only admins/managers can delete
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (!profile || profile.role === 'technician') return { error: 'Not authorised.' }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  return { success: true }
}
