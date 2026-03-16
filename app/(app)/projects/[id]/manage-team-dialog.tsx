'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, Plus, X } from 'lucide-react'
import type { Profile } from '@/types'

interface Props {
  projectId: string
  allProfiles: Profile[]
  members: { id: string; user_id: string; profile: Profile }[]
}

export function ManageTeamDialog({ projectId, allProfiles, members }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const memberIds = new Set(members.map(m => m.user_id))

  async function addMember(userId: string) {
    const supabase = createClient()
    await supabase.from('project_members').insert({ project_id: projectId, user_id: userId })
    startTransition(() => router.refresh())
  }

  async function removeMember(userId: string) {
    const supabase = createClient()
    await supabase.from('project_members').delete().eq('project_id', projectId).eq('user_id', userId)
    startTransition(() => router.refresh())
  }

  const nonMembers = allProfiles.filter(p => !memberIds.has(p.id))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
        <Users className="h-4 w-4" /> Manage Team
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Team</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current members */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Assigned ({members.length})</p>
            {members.length === 0 ? (
              <p className="text-sm text-gray-400">No members assigned yet.</p>
            ) : (
              <div className="space-y-1.5">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                        {(m.profile.full_name ?? '?')[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{m.profile.full_name ?? 'Unnamed'}</p>
                        <p className="text-xs text-gray-400 capitalize">{m.profile.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeMember(m.user_id)}
                      disabled={isPending}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add members */}
          {nonMembers.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Add from team</p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {nonMembers.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                        {(p.full_name ?? '?')[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.full_name ?? 'Unnamed'}</p>
                        <p className="text-xs text-gray-400 capitalize">{p.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => addMember(p.id)}
                      disabled={isPending}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
