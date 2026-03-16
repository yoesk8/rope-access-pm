import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, MapPin, Building2, CalendarDays } from 'lucide-react'
import type { ProjectStatus } from '@/types'
import { cn } from '@/lib/utils'

const statusColors: Record<ProjectStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <Link href="/projects/new" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4 mr-2" />New Project
        </Link>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-gray-900 leading-snug">{project.name}</h2>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColors[project.status as ProjectStatus]}`}>
                      {project.status}
                    </span>
                  </div>
                  {project.client && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Building2 className="h-3.5 w-3.5" />
                      {project.client}
                    </div>
                  )}
                  {project.location && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {project.location}
                    </div>
                  )}
                  {(project.start_date || project.end_date) && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {project.start_date ?? '—'} → {project.end_date ?? '—'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-gray-500 mb-4">No projects yet.</p>
            <Link href="/projects/new" className={cn(buttonVariants())}>
              <Plus className="h-4 w-4 mr-2" />Create your first project
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
