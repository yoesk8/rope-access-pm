import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone } from 'lucide-react'
import type { Role } from '@/types'

const roleColors: Record<Role, string> = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  technician: 'bg-gray-100 text-gray-600',
}

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Team</h1>

      {members && members.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map(member => (
            <Card key={member.id}>
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-gray-500">No team members yet. Members appear here after they sign up.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
