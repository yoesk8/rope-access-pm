'use server'

import { createClient } from '@/lib/supabase/server'

export async function createTeam(formData: FormData) {
  const name = formData.get('name') as string
  const leadTechId = formData.get('lead_tech_id') as string
  const memberIds = formData.getAll('member_ids') as string[]

  if (!name) return { error: 'Team name is required.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (!profile || !['owner'].includes(profile.role)) return { error: 'Not authorised.' }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({ name, lead_tech_id: leadTechId || null, created_by: user!.id })
    .select()
    .single()

  if (teamError) return { error: teamError.message }

  if (memberIds.length > 0) {
    const rows = memberIds.map(uid => ({ team_id: team.id, user_id: uid }))
    await supabase.from('team_members').insert(rows)
  }

  return { success: true }
}

export async function deleteTeam(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (!profile || !['owner'].includes(profile.role)) return { error: 'Not authorised.' }

  const { error } = await supabase.from('teams').delete().eq('id', teamId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function addTeamToProject(teamId: string, projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (!profile || !['admin', 'manager', 'lead_tech'].includes(profile.role)) return { error: 'Not authorised.' }

  // Get team lead + members
  const { data: team } = await supabase.from('teams').select('lead_tech_id').eq('id', teamId).single()
  const { data: members } = await supabase.from('team_members').select('user_id').eq('team_id', teamId)

  const userIds = [...(members ?? []).map(m => m.user_id)]
  if (team?.lead_tech_id) userIds.push(team.lead_tech_id)

  if (userIds.length === 0) return { error: 'Team has no members.' }

  const rows = [...new Set(userIds)].map(uid => ({ project_id: projectId, user_id: uid }))
  const { error } = await supabase.from('project_members').upsert(rows, { onConflict: 'project_id,user_id' })
  if (error) return { error: error.message }
  return { success: true }
}
