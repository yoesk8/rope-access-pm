'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, CloudSun, Users2, StickyNote } from 'lucide-react'

interface DailyLog {
  id: string
  date: string
  weather: string | null
  crew_count: number | null
  notes: string
  created_by: string | null
  creator: { full_name: string | null } | null
}

export function DailyLogsTab({ projectId, logs }: { projectId: string; logs: DailyLog[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weather: '',
    crew_count: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submitLog(e: React.FormEvent) {
    e.preventDefault()
    if (!form.notes.trim()) return
    setSubmitting(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('daily_logs').insert({
      project_id: projectId,
      date: form.date,
      weather: form.weather.trim() || null,
      crew_count: form.crew_count ? parseInt(form.crew_count) : null,
      notes: form.notes.trim(),
      created_by: user?.id,
    })
    if (err) {
      setError(err.message.includes('unique') ? 'A log for this date already exists.' : err.message)
    } else {
      setForm({ date: new Date().toISOString().split('T')[0], weather: '', crew_count: '', notes: '' })
      setShowForm(false)
    }
    setSubmitting(false)
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(v => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Log
        </button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={submitLog} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-xs text-gray-500 mb-1 block">Date</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Weather</label>
                  <input
                    placeholder="e.g. Sunny, 18°C"
                    value={form.weather}
                    onChange={e => setForm(f => ({ ...f, weather: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Crew on site</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.crew_count}
                    onChange={e => setForm(f => ({ ...f, crew_count: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Notes</label>
                <textarea
                  required
                  placeholder="Progress, issues, notes for the day…"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setError('') }} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Saving…' : 'Save Log'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {logs.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400 text-sm">
            No daily logs yet. Create the first one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <Card key={log.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {new Date(log.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400">{log.creator?.full_name ?? 'Unknown'}</p>
                  </div>
                  <div className="flex gap-3 text-sm text-gray-500 shrink-0">
                    {log.weather && (
                      <span className="flex items-center gap-1">
                        <CloudSun className="h-3.5 w-3.5" /> {log.weather}
                      </span>
                    )}
                    {log.crew_count !== null && (
                      <span className="flex items-center gap-1">
                        <Users2 className="h-3.5 w-3.5" /> {log.crew_count}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{log.notes}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
