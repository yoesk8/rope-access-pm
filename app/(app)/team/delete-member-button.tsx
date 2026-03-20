'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteMember } from './delete-member-action'
import { Trash2 } from 'lucide-react'

export function DeleteMemberButton({ userId, name }: { userId: string; name: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    const res = await deleteMember(userId)
    if (!res.error) startTransition(() => router.refresh())
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-500">Remove {name}?</span>
        <button onClick={handleDelete} disabled={isPending} className="text-xs font-medium text-red-600 hover:underline">Yes</button>
        <button onClick={() => setConfirming(false)} className="text-xs text-gray-400 hover:underline">No</button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
      title="Remove member"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )
}
