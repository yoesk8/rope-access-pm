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

interface Props {
  projectId: string
  currentStatus: string
  plan: string
  activeJobsCount: number
}

export function StatusSelector({ projectId, currentStatus, plan, activeJobsCount }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const current = statuses.find(s => s.value === currentStatus) ?? statuses[0]
  const atActiveLimit = plan === 'basic' && activeJobsCount >= 3

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
          <div className="absolute left-0 top-full mt-1 z-20 w-48 rounded-xl border bg-white shadow-lg overflow-hidden">
            {statuses.map(s => {
              const blocked = s.value === 'active' && atActiveLimit && currentStatus !== 'active'
              return (
                <button
                  key={s.value}
                  onClick={() => !blocked && changeStatus(s.value)}
                  disabled={blocked}
                  title={blocked ? 'Upgrade your plan to have more than 3 active jobs' : undefined}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                    blocked
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-gray-50'
                  } ${s.value === currentStatus ? 'font-semibold' : ''}`}
                >
                  <span className={`inline-block h-2 w-2 rounded-full ${
                    s.value === 'active' ? 'bg-green-500' :
                    s.value === 'draft' ? 'bg-yellow-400' :
                    s.value === 'completed' ? 'bg-gray-400' :
                    'bg-red-400'
                  }`} />
                  {s.label}
                  {blocked && <span className="ml-auto text-xs text-orange-500">Upgrade</span>}
                </button>
              )
            })}
            {atActiveLimit && currentStatus !== 'active' && (
              <a
                href="/pricing"
                className="block px-3 py-2 text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors border-t"
                onClick={() => setOpen(false)}
              >
                3 active job limit (Basic plan) — Upgrade →
              </a>
            )}
          </div>
        </>
      )}
    </div>
  )
}
