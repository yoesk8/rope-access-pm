'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function inviteMember(formData: FormData) {
  const email = formData.get('email') as string
  const fullName = formData.get('full_name') as string
  const role = formData.get('role') as string

  if (!email || !fullName || !role) return { error: 'All fields are required.' }

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, role },
    redirectTo: `${siteUrl}/auth/confirm`,
  })

  if (error) return { error: error.message }
  return { success: true }
}
