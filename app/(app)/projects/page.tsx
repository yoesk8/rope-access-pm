import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, MapPin, Building2, CalendarDays, Tag } from 'lucide-react'
import type { ProjectStatus } from '@/types'
import { cn } from '@/lib/utils'
import { Suspense } from 'react'
import { ProjectsFilterBar } from './projects-filter-bar'

const statusColors: Record<ProjectStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
}

const statusOrder: ProjectStatus[] = ['active', 'draft', 'completed', 'cancelled']

const statusHeadings: Record<ProjectStatus, string> = {
  active: 'Active',
  draft: 'Draft',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; category?: string }>
}) {
  const { client: clientFilter, category: categoryFilter } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const isTech = profile?.role === 'technician'

  // RLS already filters by membership for techs — just fetch all visible projects
  let query = supabase.from('projects').select('*').order('created_at', { ascending: false })
  if (clientFilter) query = query.eq('client', clientFilter)
  if (categoryFilter) query = query.eq('job_category', categoryFilter)
  const { data: projects } = await query

  // Unique clients for filter dropdown
  const { data: allProjects } = await supabase.from('projects').select('client').not('client', 'is', null)
  const clients = [...new Set((allProjects ?? []).map(p => p.client).filter(Boolean))] as string[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">{isTech ? 'My Jobs' : 'Jobs'}</h1>
        {!isTech && (
          <Link href="/projects/new" className={cn(buttonVariants())}>
            <Plus className="h-4 w-4 mr-2" />New Job
          </Link>
        )}
      </div>

      <Suspense>
        <ProjectsFilterBar clients={clients} />
      </Suspense>

      {projects && projects.length > 0 ? (
        <div className="space-y-8">
          {statusOrder.map(status => {
            const group = projects.filter(p => p.status === status)
            if (group.length === 0) return null
            return (
              <div key={status}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {statusHeadings[status]} <span className="text-gray-400 font-normal normal-case tracking-normal">({group.length})</span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map(project => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h2 className="font-semibold text-gray-900 leading-snug">{project.name}</h2>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColors[status]}`}>
                              {status}
                            </span>
                          </div>
                          {(project as any).job_category && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <Tag className="h-3 w-3" />
                              {(project as any).job_category.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                            </div>
                          )}
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
              </div>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-gray-500 mb-4">
              {clientFilter || categoryFilter
                ? 'No jobs match the selected filters.'
                : isTech ? "You haven't been assigned to any jobs yet." : 'No jobs yet.'}
            </p>
            {!isTech && !clientFilter && !categoryFilter && (
              <Link href="/projects/new" className={cn(buttonVariants())}>
                <Plus className="h-4 w-4 mr-2" />Create your first job
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
