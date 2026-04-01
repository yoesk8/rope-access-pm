'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Circle, Clock3, Plus, X, Camera, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

interface TaskPhoto { id: string; photo_url: string }

interface Task {
  id: string
  title: string
  description: string | null
  status: 'open' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  assigned_to: string | null
  assignee: Pick<Profile, 'id' | 'full_name'> | null
  task_photos: TaskPhoto[]
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}

const statusIcon = {
  open: <Circle className="h-4 w-4 text-gray-400" />,
  in_progress: <Clock3 className="h-4 w-4 text-blue-500" />,
  done: <CheckCircle2 className="h-4 w-4 text-green-500" />,
}

const nextStatus: Record<Task['status'], Task['status']> = {
  open: 'in_progress',
  in_progress: 'done',
  done: 'open',
}

interface Props {
  projectId: string
  tasks: Task[]
  members: Pick<Profile, 'id' | 'full_name'>[]
  canManage: boolean
}

function TaskCard({ task, projectId, isPending, onCycleStatus, onDelete, canManage }: {
  task: Task
  projectId: string
  isPending: boolean
  onCycleStatus: (task: Task) => void
  onDelete: (id: string) => void
  canManage: boolean
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadPhoto(file: File) {
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split('.').pop()
    const path = `${projectId}/${task.id}/${Date.now()}.${ext}`
    const { data: upload, error } = await supabase.storage.from('task-photos').upload(path, file)
    if (error || !upload) { setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('task-photos').getPublicUrl(path)
    await supabase.from('task_photos').insert({ task_id: task.id, photo_url: publicUrl, uploaded_by: user?.id })
    setUploading(false)
    router.refresh()
  }

  return (
    <div className="rounded-lg border bg-white group">
      <div className="flex items-start gap-3 p-3">
        <button onClick={() => onCycleStatus(task)} disabled={isPending} className="mt-0.5 shrink-0">
          {statusIcon[task.status]}
        </button>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', task.status === 'done' && 'line-through text-gray-400')}>
            {task.title}
          </p>
          {task.description && <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>}
          <div className="flex flex-wrap gap-2 mt-1.5">
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
            {task.assignee?.full_name && (
              <span className="text-xs text-gray-500">→ {task.assignee.full_name}</span>
            )}
            {task.due_date && (
              <span className="text-xs text-gray-400">Due {task.due_date}</span>
            )}
            {task.task_photos.length > 0 && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
              >
                <Camera className="h-3 w-3" /> {task.task_photos.length} photo{task.task_photos.length > 1 ? 's' : ''}
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-blue-500 transition-all"
            title="Attach photo"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          {canManage && (
            <button
              onClick={() => onDelete(task.id)}
              disabled={isPending}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f) }}
        />
      </div>

      {/* Photo gallery */}
      {expanded && task.task_photos.length > 0 && (
        <div className="px-3 pb-3 pt-0 border-t">
          <div className="grid grid-cols-3 gap-2 mt-2">
            {task.task_photos.map(photo => (
              <a key={photo.id} href={photo.photo_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={photo.photo_url}
                  alt="Task photo"
                  className="w-full h-20 object-cover rounded-lg hover:opacity-90 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function TasksTab({ projectId, tasks: initialTasks, members, canManage }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' })
  const [submitting, setSubmitting] = useState(false)

  async function cycleStatus(task: Task) {
    const supabase = createClient()
    await supabase.from('tasks').update({ status: nextStatus[task.status] }).eq('id', task.id)
    startTransition(() => router.refresh())
  }

  async function deleteTask(id: string) {
    const supabase = createClient()
    await supabase.from('tasks').delete().eq('id', id)
    startTransition(() => router.refresh())
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('tasks').insert({
      project_id: projectId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
      created_by: user?.id,
    })
    setForm({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' })
    setShowForm(false)
    setSubmitting(false)
    startTransition(() => router.refresh())
  }

  const open = initialTasks.filter(t => t.status === 'open')
  const inProgress = initialTasks.filter(t => t.status === 'in_progress')
  const done = initialTasks.filter(t => t.status === 'done')

  function TaskList({ items, label }: { items: Task[]; label: string }) {
    return (
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{label} ({items.length})</p>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 italic mb-4">None</p>
        ) : (
          <div className="space-y-2 mb-4">
            {items.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                projectId={projectId}
                isPending={isPending}
                onCycleStatus={cycleStatus}
                onDelete={deleteTask}
                canManage={canManage}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(v => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Task
          </button>
        </div>
      )}

      {canManage && showForm && (
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={createTask} className="space-y-3">
              <input
                required
                placeholder="Task title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <select
                  value={form.assigned_to}
                  onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">Unassigned</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Creating…' : 'Create Task'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <TaskList items={inProgress} label="In Progress" />
      <TaskList items={open} label="Open" />
      <TaskList items={done} label="Done" />

      {initialTasks.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-12 text-center text-gray-400 text-sm">
            No tasks yet. Create the first one.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
