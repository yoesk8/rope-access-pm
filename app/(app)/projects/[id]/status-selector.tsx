'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown } from 'lucide-react'

const statuses = [
  { value: 'draft',     label: 'Draft',     color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'active',    label: 'Active',    color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200' },
]

export function StatusSelector({ projectId, currentStatus }: { projectId: string; currentStatus: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const current = statuses.find(s => s.value === currentStatus) ?? statuses[0]

  async function changeStatus(value: string) {
    if (value === currentStatus) { setOpen(false); return }
    setOpen(false)
    const supabase = createClient()
    await supabase.from('projects').update({ status: value }).eq('id', projectId)
    startTransition(() => router.refresh())
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${current.color} hover:opacity-80`}
      >
        {current.label}
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 w-36 rounded-xl border bg-white shadow-lg overflow-hidden">
            {statuses.map(s => (
              <button
                key={s.value}
                onClick={() => changeStatus(s.value)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${s.value === currentStatus ? 'font-semibold' : ''}`}
              >
                <span className={`inline-block h-2 w-2 rounded-full ${
                  s.value === 'active' ? 'bg-green-500' :
                  s.value === 'draft' ? 'bg-yellow-400' :
                  s.value === 'completed' ? 'bg-gray-400' :
                  'bg-red-400'
                }`} />
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
