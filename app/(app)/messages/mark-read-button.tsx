'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'

export function MarkReadButton({ messageId }: { messageId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function markRead() {
    const supabase = createClient()
    await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', messageId)
    startTransition(() => router.refresh())
  }

  return (
    <button
      onClick={markRead}
      disabled={isPending}
      className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      <Check className="h-3 w-3" /> Mark read
    </button>
  )
}
