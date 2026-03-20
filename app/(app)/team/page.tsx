import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Phone, Trash2, Users } from 'lucide-react'
import { InviteDialog } from './invite-dialog'
import { DeleteMemberButton } from './delete-member-button'
import { CreateTeamDialog } from './create-team-dialog'
import { DeleteTeamButton } from './delete-team-button'
import type { Role } from '@/types'

const roleColors: Record<Role, string> = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  lead_tech: 'bg-orange-100 text-orange-700',
  technician: 'bg-gray-100 text-gray-600',
}

const roleLabels: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  lead_tech: 'Lead Tech',
  technician: 'Technician',
}

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  if (profile?.role === 'technician' || profile?.role === 'lead_tech') redirect('/dashboard')

  const canInvite = profile?.role === 'admin' || profile?.role === 'manager'

  const [{ data: members }, { data: teams }] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name', { ascending: true }),
    supabase.from('teams').select('*, lead:profiles!teams_lead_tech_id_fkey(id, full_name), team_members(user_id, profile:profiles(id, full_name, role))').order('name'),
  ])

  const leadTechs = (members ?? []).filter(m => m.role === 'lead_tech')
  const technicians = (members ?? []).filter(m => m.role === 'technician')

  return (
    <div className="space-y-10">
      {/* Members section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          {canInvite && <InviteDialog />}
        </div>

        {members && members.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map(member => (
              <Card key={member.id} className="group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                      {(member.full_name ?? '?')[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 truncate">{member.full_name ?? 'Unnamed'}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${roleColors[member.role as Role]}`}>
                          {roleLabels[member.role as Role] ?? member.role}
                        </span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                          <Phone className="h-3.5 w-3.5" />
                          {member.phone}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </p>
                      {canInvite && member.id !== user!.id && (
                        <div className="mt-2">
                          <DeleteMemberButton userId={member.id} name={member.full_name ?? 'this member'} />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-gray-500 mb-4">No team members yet.</p>
              {canInvite && <p className="text-sm text-gray-400">Use "Add Member" to add your first technician.</p>}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Teams section */}
      {canInvite && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Teams</h2>
              <p className="text-sm text-gray-500 mt-0.5">Group technicians under a lead — then assign the whole team to a job at once.</p>
            </div>
            <CreateTeamDialog leadTechs={leadTechs as any} technicians={technicians as any} />
          </div>

          {teams && teams.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {teams.map((team: any) => (
                <Card key={team.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Users className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{team.name}</p>
                          {team.lead?.full_name && (
                            <p className="text-xs text-orange-600 font-medium">Lead: {team.lead.full_name}</p>
                          )}
                        </div>
                      </div>
                      <DeleteTeamButton teamId={team.id} name={team.name} />
                    </div>
                    {team.team_members && team.team_members.length > 0 ? (
                      <div className="space-y-1.5">
                        {team.team_members.map((tm: any) => (
                          <div key={tm.user_id} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                              {(tm.profile?.full_name ?? '?')[0]?.toUpperCase()}
                            </div>
                            {tm.profile?.full_name ?? 'Unknown'}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No members added yet.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No teams yet. Create one to group technicians under a lead.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
