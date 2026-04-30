import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Phone, Users } from 'lucide-react'
import { ROLE_COLORS, ROLE_LABELS, ROLE_ICONS, PLAN_LABELS, PLAN_COLORS } from '@/lib/constants'
import { InviteDialog } from './invite-dialog'
import { DeleteMemberButton } from './delete-member-button'
import { CreateTeamDialog } from './create-team-dialog'
import { DeleteTeamButton } from './delete-team-button'
import type { Role, Plan } from '@/types'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('role, plan')
    .eq('id', user!.id)
    .single()

  // This page is owner-only; middleware already blocks other roles but we double-check here.
  if (ownerProfile?.role !== 'owner') redirect('/dashboard')

  const plan = (ownerProfile.plan ?? 'basic') as Plan

  const [{ data: members }, { data: teams }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .neq('role', 'owner')
      .neq('id', user!.id)
      .order('full_name', { ascending: true }),
    supabase
      .from('teams')
      .select('*, lead:profiles!teams_lead_tech_id_fkey(id, full_name), team_members(user_id, profile:profiles(id, full_name, role))')
      .order('name'),
  ])

  const nonOwners = members ?? []
  const nonOwnerCount = nonOwners.length
  const leadTechs = nonOwners.filter(m => m.role === 'lead_tech')
  const technicians = nonOwners.filter(m => m.role === 'technician')

  // Basic plan caps the team at 3 members.
  const planLimit = plan === 'basic' ? 3 : null

  return (
    <div className="space-y-10">
      {/* Members section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLAN_COLORS[plan]}`}>
                {PLAN_LABELS[plan]}
              </span>
              {planLimit && (
                <span className="text-xs text-gray-400">
                  {nonOwnerCount}/{planLimit} members used
                </span>
              )}
            </div>
          </div>
          <InviteDialog plan={plan} memberCount={nonOwnerCount} />
        </div>

        {plan === 'basic' && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
            <strong>Basic plan:</strong> Up to 3 technicians, no Lead Tech role, no messaging.{' '}
            <a href="/pricing" className="underline font-medium">Upgrade</a> to unlock full features.
          </div>
        )}

        {nonOwners.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nonOwners.map(member => {
              const role = member.role as Role
              const RoleIcon = ROLE_ICONS[role]
              return (
                <Card key={member.id} className="group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                        {(member.full_name ?? '?')[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 truncate">{member.full_name ?? 'Unnamed'}</p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${ROLE_COLORS[role]}`}>
                            {ROLE_LABELS[role]}
                          </span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                            <Phone className="h-3.5 w-3.5" />
                            {member.phone}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Added {new Date(member.created_at).toLocaleDateString()}
                        </p>
                        {member.id !== user!.id && role !== 'owner' && (
                          <div className="mt-2">
                            <DeleteMemberButton userId={member.id} name={member.full_name ?? 'this member'} />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-gray-500 mb-2">No team members yet.</p>
              <p className="text-sm text-gray-400">Use "Add Member" to add your first technician.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Teams section — operations plan only */}
      {plan === 'operations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Teams</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Group technicians under a lead tech — assign the whole team to a job at once.
              </p>
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
                    {team.team_members?.length > 0 ? (
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

      {plan === 'field' && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <strong>Teams management</strong> is available on the Operations plan.{' '}
          <a href="/pricing" className="underline font-medium">Upgrade</a> to create teams and assign them to jobs.
        </div>
      )}
    </div>
  )
}
