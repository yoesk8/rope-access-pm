'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/components/user-provider'
import type { Profile } from '@/types'
import { Plus, X } from 'lucide-react'

const PERSONAL_CATEGORIES = ['harness', 'ascender', 'descender', 'carabiner', 'helmet', 'lanyard', 'other']
const COMPANY_CATEGORIES  = ['rope', 'anchor', 'drill', 'grinder', 'hammer', 'rigging plate', 'tool bag', 'other']

export function AddItemDialog({ techs }: { techs: Profile[] }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'personal' | 'company'>('personal')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [status, setStatus] = useState('active')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { id: userId } = useUser()

  const categories = type === 'personal' ? PERSONAL_CATEGORIES : COMPANY_CATEGORIES
  const finalCategory = category === 'other' ? customCategory : category

  function reset() {
    setType('personal'); setName(''); setCategory(''); setCustomCategory('')
    setAssignedTo(''); setSerialNumber(''); setStatus('active'); setNotes(''); setError('')
  }

  function handleClose() { reset(); setOpen(false) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!finalCategory) { setError('Please select or enter a category.'); return }
    if (type === 'personal' && !assignedTo) { setError('Please assign this item to a team member.'); return }

    const supabase = createClient()

    // Resolve owner_id
    const { data: profile } = await supabase.from('profiles').select('owner_id, role').eq('id', userId).single()
    const ownerId = profile?.role === 'owner' ? userId : profile?.owner_id

    const { error: insertError } = await supabase.from('inventory_items').insert({
      owner_id: ownerId,
      name: name.trim(),
      category: finalCategory,
      type,
      assigned_to: type === 'personal' ? assignedTo : null,
      serial_number: serialNumber.trim() || null,
      status,
      notes: notes.trim() || null,
    })

    if (insertError) { setError(insertError.message); return }

    startTransition(() => { router.refresh() })
    handleClose()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add item
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b">
              <h2 className="font-semibold text-gray-900">Add equipment</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Type toggle */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
                {(['personal', 'company'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setType(t); setCategory('') }}
                    className={`flex-1 py-2 capitalize transition-colors ${type === t ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Item name</label>
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={type === 'personal' ? 'e.g. Petzl Avao Bod Croll' : 'e.g. 60m Kernmantle Rope'}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white capitalize"
                >
                  <option value="">Select category…</option>
                  {categories.map(c => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
                {category === 'other' && (
                  <input
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    placeholder="Enter category"
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                )}
              </div>

              {type === 'personal' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Assigned to</label>
                  <select
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                  >
                    <option value="">Select team member…</option>
                    {techs.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Serial number</label>
                  <input
                    value={serialNumber}
                    onChange={e => setSerialNumber(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Adding…' : 'Add item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
