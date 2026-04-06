'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'

export function DeleteItemButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm('Delete this item?')) return
    startTransition(async () => {
      const supabase = createClient()
      await supabase.from('inventory_items').delete().eq('id', id)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-md p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
      aria-label="Delete item"
    >
      <X className="h-4 w-4" />
    </button>
  )
}
