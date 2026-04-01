'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const PLAN_LIMITS: Record<string, number> = {
  basic: 3,
  field: Infinity,
  operations: Infinity,
}

export async function inviteMember(formData: FormData) {
  const email = formData.get('email') as string
  const fullName = formData.get('full_name') as string
  const role = formData.get('role') as string
  const password = formData.get('password') as string

  if (!email || !fullName || !role || !password) return { error: 'All fields are required.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }

  // Only owners can create team members
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role, plan').eq('id', user!.id).single()
  if (!profile || profile.role !== 'owner') return { error: 'Not authorised.' }

  const plan = profile.plan ?? 'basic'

  // Enforce plan limits
  if (role === 'lead_tech' && plan === 'basic') {
    return { error: 'Lead Technician role requires a Field plan or higher. Upgrade to add lead technicians.' }
  }

  const limit = PLAN_LIMITS[plan] ?? 3
  if (limit !== Infinity) {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .neq('role', 'owner')
    if ((count ?? 0) >= limit) {
      return { error: `Your Basic plan allows up to ${limit} team members. Upgrade to add more.` }
    }
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role, owner_id: user!.id },
  })

  if (error) return { error: error.message }
  return { success: true }
}
