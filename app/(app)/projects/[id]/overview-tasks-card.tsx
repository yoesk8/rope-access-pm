'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare } from 'lucide-react'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  status: string
  priority: string | null
}

const priorityStyles: Record<string, string> = {
  high: 'text-red-500 font-semibold',
  medium: 'text-yellow-500 font-semibold',
  low: 'text-gray-400',
}

export function OverviewTasksCard({ projectId, initialTasks }: { projectId: string; initialTasks: Task[] }) {
  const openTasks = initialTasks.filter(t => t.status !== 'done')
  const [done, setDone] = useState<Set<string>>(new Set())

  async function toggle(taskId: string) {
    setDone(prev => {
      const next = new Set(prev)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      return next
    })
    const supabase = createClient()
    const isDone = !done.has(taskId)
    await supabase.from('tasks').update({ status: isDone ? 'done' : 'open' }).eq('id', taskId)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckSquare className="h-4 w-4" /> Open Tasks
        </CardTitle>
        <Link
          href={`/projects/${projectId}?tab=tasks`}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {openTasks.length > 0 ? (
          <div className="space-y-3">
            {openTasks.map(task => {
              const checked = done.has(task.id)
              return (
                <div key={task.id} className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(task.id)}
                      className="h-4 w-4 rounded border-gray-300 accent-gray-900 shrink-0"
                    />
                    <span className={`text-sm truncate ${checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {task.title}
                    </span>
                  </label>
                  {task.priority && (
                    <span className={`text-sm capitalize shrink-0 ${priorityStyles[task.priority] ?? 'text-gray-400'}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No open tasks.</p>
        )}
      </CardContent>
    </Card>
  )
}
