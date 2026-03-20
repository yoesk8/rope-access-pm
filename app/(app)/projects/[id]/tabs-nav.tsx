'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'photos', label: 'Photos' },
  { key: 'checklists', label: 'Checklists' },
  { key: 'logs', label: 'Daily Logs' },
]

export function TabsNav({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams()
  const active = searchParams.get('tab') ?? 'overview'

  return (
    <div className="flex gap-1 border-b overflow-x-auto">
      {tabs.map(t => (
        <Link
          key={t.key}
          href={`/projects/${projectId}?tab=${t.key}`}
          className={cn(
            'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
            active === t.key
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  )
}
