import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { Suspense } from 'react'
import { cn } from '@/lib/utils'
import { STATUS_ORDER, STATUS_HEADINGS } from '@/lib/constants'
import { ProjectCard } from '@/components/project-card'
import { ProjectsFilterBar } from './projects-filter-bar'
import type { ProjectRow } from '@/types'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; category?: string }>
}) {
  const { client: clientFilter, category: categoryFilter } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, plan')
    .eq('id', user!.id)
    .single()

  const isTech = profile?.role === 'technician'
  const isLeadTech = profile?.role === 'lead_tech'
  const plan = profile?.plan ?? 'basic'

  // RLS already scopes rows to the user's org — apply UI filters on top.
  let query = supabase.from('projects').select('*').order('created_at', { ascending: false })
  if (clientFilter)  query = query.eq('client', clientFilter)
  if (categoryFilter) query = query.eq('job_category', categoryFilter)
  // Field roles only need to see jobs they can work on.
  if (isTech || isLeadTech) query = query.in('status', ['active', 'completed'])
  const { data: rawProjects } = await query
  const projects = (rawProjects ?? []) as ProjectRow[]

  // Check against the basic plan's 3-active-job cap.
  const { count: activeJobsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
  const atActiveLimit = plan === 'basic' && (activeJobsCount ?? 0) >= 3

  // Unique client names for the filter dropdown.
  const { data: allProjects } = await supabase.from('projects').select('client').not('client', 'is', null)
  const clients = [...new Set((allProjects ?? []).map(p => p.client).filter(Boolean))] as string[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">{isTech ? 'My Jobs' : 'Jobs'}</h1>

        {!isTech && (
          atActiveLimit ? (
            <Link
              href="/pricing"
              className={cn(buttonVariants({ variant: 'outline' }), 'text-orange-600 border-orange-300 hover:bg-orange-50')}
            >
              3 active job limit reached — Upgrade
            </Link>
          ) : (
            <Link href="/projects/new" className={cn(buttonVariants())}>
              <Plus className="h-4 w-4 mr-2" />New Job
            </Link>
          )
        )}
      </div>

      <Suspense>
        <ProjectsFilterBar clients={clients} />
      </Suspense>

      {projects.length > 0 ? (
        <div className="space-y-8">
          {STATUS_ORDER.map(status => {
            const group = projects.filter(p => p.status === status)
            if (group.length === 0) return null
            return (
              <div key={status}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {STATUS_HEADINGS[status]}{' '}
                  <span className="text-gray-400 font-normal normal-case tracking-normal">({group.length})</span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map(project => (
                    <ProjectCard key={project.id} project={project} />
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
                : isTech
                  ? "You haven't been assigned to any jobs yet."
                  : 'No jobs yet.'}
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
