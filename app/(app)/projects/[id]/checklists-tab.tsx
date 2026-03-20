'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react'

interface ChecklistItem { id: string; label: string }
interface Template { id: string; name: string; type: string; items: ChecklistItem[] }
interface Submission {
  id: string
  name: string
  created_at: string
  submitter: { full_name: string | null } | null
  responses: Record<string, boolean>
  template: { items: ChecklistItem[] } | null
}

interface Props {
  projectId: string
  templates: Template[]
  submissions: Submission[]
}

const typeLabels: Record<string, string> = {
  safety: 'Safety',
  pre_job: 'Pre-Job',
  risk_assessment: 'Risk Assessment',
  custom: 'Custom',
}

export function ChecklistsTab({ projectId, templates, submissions }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)
  const [responses, setResponses] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  function startChecklist(template: Template) {
    setActiveTemplate(template)
    setResponses(Object.fromEntries(template.items.map(i => [i.id, false])))
  }

  async function submitChecklist() {
    if (!activeTemplate) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('checklist_submissions').insert({
      project_id: projectId,
      template_id: activeTemplate.id,
      name: activeTemplate.name,
      responses,
      submitted_by: user?.id,
    })
    setActiveTemplate(null)
    setResponses({})
    setSubmitting(false)
    startTransition(() => router.refresh())
  }

  const checkedCount = (resp: Record<string, boolean>) => Object.values(resp).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Run a checklist */}
      {!activeTemplate ? (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Run a checklist</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => startChecklist(t)}
                className="flex flex-col items-start gap-1 rounded-lg border bg-white p-4 text-left hover:border-gray-400 hover:shadow-sm transition-all"
              >
                <span className="text-xs font-medium text-gray-400 capitalize">{typeLabels[t.type] ?? t.type}</span>
                <span className="text-sm font-semibold text-gray-900">{t.name}</span>
                <span className="text-xs text-gray-400">{t.items.length} items</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              {activeTemplate.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {activeTemplate.items.map(item => (
                <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={responses[item.id] ?? false}
                    onChange={e => setResponses(r => ({ ...r, [item.id]: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-gray-900"
                  />
                  <span className={`text-sm ${responses[item.id] ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {checkedCount(responses)} / {activeTemplate.items.length} completed
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTemplate(null)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitChecklist}
                  disabled={submitting}
                  className="px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Saving…' : 'Submit'}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past submissions */}
      {submissions.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Completed ({submissions.length})</p>
          <div className="space-y-2">
            {submissions.map(s => {
              const total = s.template?.items.length ?? Object.keys(s.responses).length
              const checked = checkedCount(s.responses)
              const isExpanded = expanded === s.id
              return (
                <div key={s.id} className="rounded-lg border bg-white overflow-hidden">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : s.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">
                        {s.submitter?.full_name ?? 'Unknown'} · {new Date(s.created_at).toLocaleDateString()} · {checked}/{total} ✓
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </button>
                  {isExpanded && s.template && (
                    <div className="border-t px-4 py-3 space-y-1.5">
                      {s.template.items.map(item => (
                        <div key={item.id} className="flex items-start gap-2 text-sm">
                          <CheckSquare className={`h-4 w-4 mt-0.5 shrink-0 ${s.responses[item.id] ? 'text-green-500' : 'text-gray-200'}`} />
                          <span className={s.responses[item.id] ? 'text-gray-600' : 'text-gray-400'}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {templates.length === 0 && submissions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-400 text-sm">
            No checklists available.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
