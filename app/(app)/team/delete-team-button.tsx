'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTeam } from './team-actions'
import { Trash2 } from 'lucide-react'

export function DeleteTeamButton({ teamId, name }: { teamId: string; name: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    const res = await deleteTeam(teamId)
    if (!res.error) startTransition(() => router.refresh())
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-500">Delete {name}?</span>
        <button onClick={handleDelete} disabled={isPending} className="text-xs font-medium text-red-600 hover:underline">Yes</button>
        <button onClick={() => setConfirming(false)} className="text-xs text-gray-400 hover:underline">No</button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-gray-300 hover:text-red-500 transition-colors"
      title="Delete team"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
