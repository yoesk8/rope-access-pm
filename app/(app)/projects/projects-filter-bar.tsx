'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { X } from 'lucide-react'

const JOB_CATEGORIES = [
  { value: 'window_cleaning', label: 'Window Cleaning' },
  { value: 'brickwork', label: 'Brickwork Repair' },
  { value: 'glazing', label: 'Glazing' },
  { value: 'gutter_repair', label: 'Gutter Repair' },
  { value: 'gutter_cleaning', label: 'Gutter Cleaning' },
  { value: 'mastic_sealant', label: 'Mastic / Sealant' },
  { value: 'facade_inspection', label: 'Façade Inspection' },
  { value: 'painting', label: 'Painting' },
  { value: 'concrete_repair', label: 'Concrete Repair' },
  { value: 'caulking', label: 'Caulking' },
  { value: 'netting', label: 'Netting / Bird Control' },
  { value: 'signage', label: 'Signage Installation' },
  { value: 'other', label: 'Other' },
]

const selectCls = 'rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 pr-8'

interface Props {
  clients: string[]
}

export function ProjectsFilterBar({ clients }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const client = searchParams.get('client') ?? ''
  const category = searchParams.get('category') ?? ''

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.replace(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const hasFilters = client || category

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        value={client}
        onChange={e => update('client', e.target.value)}
        className={selectCls}
      >
        <option value="">All Clients</option>
        {clients.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={category}
        onChange={e => update('category', e.target.value)}
        className={selectCls}
      >
        <option value="">All Categories</option>
        {JOB_CATEGORIES.map(cat => (
          <option key={cat.value} value={cat.value}>{cat.label}</option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={() => {
            const params = new URLSearchParams()
            router.replace(pathname)
          }}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      )}
    </div>
  )
}
