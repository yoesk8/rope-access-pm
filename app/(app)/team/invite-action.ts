'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function inviteMember(formData: FormData) {
  const email = formData.get('email') as string
  const fullName = formData.get('full_name') as string
  const role = formData.get('role') as string
  const password = formData.get('password') as string

  if (!email || !fullName || !role || !password) return { error: 'All fields are required.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }

  // Only admins/managers can create team members
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (!profile || profile.role === 'technician') return { error: 'Not authorised.' }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  })

  if (error) return { error: error.message }
  return { success: true }
}
