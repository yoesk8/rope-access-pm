import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Phone } from 'lucide-react'
import { InviteDialog } from './invite-dialog'
import { DeleteMemberButton } from './delete-member-button'
import type { Role } from '@/types'

const roleColors: Record<Role, string> = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  technician: 'bg-gray-100 text-gray-600',
}

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  if (profile?.role === 'technician') redirect('/dashboard')

  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })

  const canInvite = profile?.role === 'admin' || profile?.role === 'manager'

  return (
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
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 capitalize ${roleColors[member.role as Role]}`}>
                        {member.role}
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
            {canInvite && <p className="text-sm text-gray-400">Use "Invite Member" to add your first technician.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
