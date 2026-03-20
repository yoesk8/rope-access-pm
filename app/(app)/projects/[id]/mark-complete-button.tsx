'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2 } from 'lucide-react'

export function MarkCompleteButton({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  async function handleComplete() {
    const supabase = createClient()
    await supabase.from('projects').update({ status: 'completed' }).eq('id', projectId)
    startTransition(() => router.refresh())
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Mark as completed?</span>
        <button
          onClick={handleComplete}
          disabled={isPending}
          className="text-sm font-medium text-green-600 hover:underline"
        >
          Yes
        </button>
        <button onClick={() => setConfirming(false)} className="text-sm text-gray-400 hover:underline">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
    >
      <CheckCircle2 className="h-4 w-4" /> Mark Complete
    </button>
  )
}
