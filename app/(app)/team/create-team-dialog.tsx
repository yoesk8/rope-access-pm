'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { createTeam } from './team-actions'
import type { Profile } from '@/types'

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

export function CreateTeamDialog({ leadTechs, technicians }: { leadTechs: Profile[]; technicians: Profile[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())

  function toggleMember(id: string) {
    setSelectedMembers(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    selectedMembers.forEach(id => formData.append('member_ids', id))
    const res = await createTeam(formData)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setOpen(false)
    setSelectedMembers(new Set())
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors">
        <Plus className="h-4 w-4" /> New Team
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Team Name</label>
            <input name="name" required className={inputCls} placeholder="e.g. Alpha Team" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Lead Technician</label>
            <select name="lead_tech_id" className={inputCls}>
              <option value="">None</option>
              {leadTechs.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
          {technicians.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Technicians</label>
              <div className="space-y-1 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {technicians.map(p => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-gray-50 px-1 rounded">
                    <input
                      type="checkbox"
                      checked={selectedMembers.has(p.id)}
                      onChange={() => toggleMember(p.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">{p.full_name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating…' : 'Create Team'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
