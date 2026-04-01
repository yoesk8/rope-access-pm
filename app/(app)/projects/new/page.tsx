'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

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


const TOOLS = [
  'Working line rope', 'Safety line rope', 'Descender (I\'D / Stop)', 'Hand ascender',
  'Chest ascender (Pantin)', 'Full body harness', 'Work positioning lanyard',
  'Personal anchor system', 'Rope clamps', 'Edge protectors', 'Anchor slings',
  'Scaffold clamps', 'Karabiners', 'Pulley system',
  'Squeegee & T-bar', 'Bucket & solution', 'Pressure washer',
  'Sealant gun & mastic', 'Wire brush', 'Angle grinder', 'Hammer drill',
  'Mortar / render', 'Paint & rollers', 'Spray equipment',
  'Camera / inspection scope', 'Exclusion zone tape', 'Two-way radios',
]

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white'
const selectCls = `${inputCls} cursor-pointer`

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tools, setTools] = useState<string[]>([])
  const [customTools, setCustomTools] = useState<{ id: string; name: string }[]>([])
  const [newTool, setNewTool] = useState('')
  const [addingTool, setAddingTool] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('custom_tools').select('id, name').order('created_at').then(({ data }) => {
      if (data) setCustomTools(data)
    })
  }, [])

  async function addCustomTool() {
    const name = newTool.trim()
    if (!name) return
    setAddingTool(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('custom_tools').insert({ name, owner_id: user!.id }).select('id, name').single()
    if (data) {
      setCustomTools(prev => [...prev, data])
      setTools(prev => [...prev, data.name])
    }
    setNewTool('')
    setAddingTool(false)
  }
  const [form, setForm] = useState({
    name: '',
    client: '',
    location: '',
    status: 'draft',
    description: '',
    start_date: '',
    end_date: '',
    job_category: '',
    access_type: '',
    max_height: '',
    rigging_details: '',
    anchor_points: '',
    risk_considerations: '',
    site_contact_name: '',
    site_contact_role: '',
    site_contact_phone: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function toggleTool(tool: string) {
    setTools(t => t.includes(tool) ? t.filter(x => x !== tool) : [...t, tool])
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase.from('projects').insert({
      name: form.name,
      client: form.client || null,
      location: form.location || null,
      status: form.status,
      description: form.description || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      job_category: form.job_category || null,
      access_type: form.access_type || null,
      max_height: form.max_height ? parseFloat(form.max_height) : null,
      rigging_details: form.rigging_details || null,
      anchor_points: form.anchor_points || null,
      risk_considerations: form.risk_considerations || null,
      site_contact_name: form.site_contact_name || null,
      site_contact_role: form.site_contact_role || null,
      site_contact_phone: form.site_contact_phone || null,
      tools_needed: tools,
      created_by: user?.id,
    }).select('id').single()

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(`/projects/${data.id}`)
      router.refresh()
    }
  }

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link href="/projects" className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Job Name" required>
              <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. 30 St Mary Axe — Window Clean Q2" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Client">
                <input className={inputCls} value={form.client} onChange={e => set('client', e.target.value)} placeholder="Client or company name" />
              </Field>
              <Field label="Location / Address">
                <input className={inputCls} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Full address" />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Status">
                <select className={selectCls} value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </Field>
              <Field label="Start Date">
                <input type="date" className={inputCls} value={form.start_date} onChange={e => set('start_date', e.target.value)} />
              </Field>
              <Field label="End Date">
                <input type="date" className={inputCls} value={form.end_date} onChange={e => set('end_date', e.target.value)} />
              </Field>
            </div>
            <Field label="Job Description">
              <textarea className={inputCls} value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Scope of work overview…" />
            </Field>
          </CardContent>
        </Card>

        {/* Rope Access Details */}
        <Card>
          <CardHeader><CardTitle>Rope Access Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Job Category">
                <select className={selectCls} value={form.job_category} onChange={e => set('job_category', e.target.value)}>
                  <option value="">Select category…</option>
                  {JOB_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Access to Work Area">
                <input
                  className={inputCls}
                  value={form.access_type}
                  onChange={e => set('access_type', e.target.value)}
                  placeholder="e.g. Roof hatch, north side — code 4821"
                />
              </Field>
            </div>
            <Field label="Maximum Working Height (metres)">
              <input
                type="number"
                min="0"
                step="0.1"
                className={inputCls}
                value={form.max_height}
                onChange={e => set('max_height', e.target.value)}
                placeholder="e.g. 45"
              />
            </Field>
            <Field label="Rigging Details">
              <textarea
                className={inputCls}
                value={form.rigging_details}
                onChange={e => set('rigging_details', e.target.value)}
                rows={3}
                placeholder="Describe rigging setup, rope routes, anchor configurations…"
              />
            </Field>
            <Field label="Anchor Points">
              <textarea
                className={inputCls}
                value={form.anchor_points}
                onChange={e => set('anchor_points', e.target.value)}
                rows={2}
                placeholder="Describe available anchor points, eyebolts, davit arms, structural anchors…"
              />
            </Field>
          </CardContent>
        </Card>

        {/* Risk & Safety */}
        <Card>
          <CardHeader><CardTitle>Risk &amp; Safety Considerations</CardTitle></CardHeader>
          <CardContent>
            <Field label="Potential Risk Considerations">
              <textarea
                className={inputCls}
                value={form.risk_considerations}
                onChange={e => set('risk_considerations', e.target.value)}
                rows={4}
                placeholder="e.g. Traffic below, fragile roof, overhead power lines, public exclusion zone required, confined space, weather sensitivity, nearby operations…"
              />
            </Field>
          </CardContent>
        </Card>

        {/* Site Contact */}
        <Card>
          <CardHeader><CardTitle>Site Contact</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Contact Name">
                <input className={inputCls} value={form.site_contact_name} onChange={e => set('site_contact_name', e.target.value)} placeholder="e.g. John Smith" />
              </Field>
              <Field label="Role">
                <input className={inputCls} value={form.site_contact_role} onChange={e => set('site_contact_role', e.target.value)} placeholder="e.g. Porter, Building Manager" />
              </Field>
              <Field label="Phone">
                <input type="tel" className={inputCls} value={form.site_contact_phone} onChange={e => set('site_contact_phone', e.target.value)} placeholder="+44 7700 000000" />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Tools & Equipment */}
        <Card>
          <CardHeader>
            <CardTitle>Tools &amp; Equipment Needed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[...TOOLS, ...customTools.map(t => t.name)].map(tool => {
                const selected = tools.includes(tool)
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors',
                      selected
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                    )}
                  >
                    {selected && <Check className="h-3 w-3" />}
                    {tool}
                  </button>
                )
              })}
            </div>

            {/* Add custom tool */}
            <div className="flex items-center gap-2 pt-1 border-t">
              <input
                type="text"
                value={newTool}
                onChange={e => setNewTool(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTool())}
                placeholder="Add a custom tool…"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <button
                type="button"
                onClick={addCustomTool}
                disabled={!newTool.trim() || addingTool}
                className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>

            {tools.length > 0 && (
              <p className="text-xs text-gray-400">{tools.length} item{tools.length !== 1 ? 's' : ''} selected</p>
            )}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating…' : 'Create Job'}
          </button>
          <Link href="/projects" className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
