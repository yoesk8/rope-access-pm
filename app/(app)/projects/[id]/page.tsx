import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, MapPin, Building2, CalendarDays, Clock, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types'

const statusColors: Record<ProjectStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
  if (!project) notFound()

  const [{ data: members }, { data: timesheets }, { data: documents }] = await Promise.all([
    supabase.from('project_members').select('*, profile:profiles(*)').eq('project_id', id),
    supabase.from('timesheets').select('*, profile:profiles(full_name)').eq('project_id', id).order('date', { ascending: false }).limit(5),
    supabase.from('documents').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(5),
  ])

  const totalHours = timesheets?.reduce((sum, t) => sum + (t.hours ?? 0), 0) ?? 0

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/projects" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[project.status as ProjectStatus]}`}>
            {project.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {project.client && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Client:</span> {project.client}
                </div>
              )}
              {project.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Location:</span> {project.location}
                </div>
              )}
              {(project.start_date || project.end_date) && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Dates:</span> {project.start_date ?? '—'} → {project.end_date ?? '—'}
                </div>
              )}
              {project.description && (
                <p className="text-sm text-gray-600 pt-2">{project.description}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> Recent Timesheets
              </CardTitle>
              <Link href="/timesheets" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {timesheets && timesheets.length > 0 ? (
                <div className="space-y-2">
                  {timesheets.map(t => (
                    <div key={t.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                      <div>
                        <span className="font-medium">{(t.profile as any)?.full_name ?? 'Unknown'}</span>
                        <span className="text-gray-400 mx-2">·</span>
                        <span className="text-gray-500">{t.date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>{t.hours}h</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          t.status === 'approved' ? 'bg-green-100 text-green-700' :
                          t.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{t.status}</span>
                      </div>
                    </div>
                  ))}
                  <p className="text-sm text-gray-500 pt-2">Total logged: <strong>{totalHours}h</strong></p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No timesheets logged yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Documents
              </CardTitle>
              <Link href="/documents" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {documents && documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                      <span className="font-medium">{doc.name}</span>
                      <span className="text-xs text-gray-500 capitalize">{doc.type.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No documents uploaded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader><CardTitle>Team ({members?.length ?? 0})</CardTitle></CardHeader>
            <CardContent>
              {members && members.length > 0 ? (
                <div className="space-y-2">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center gap-2 text-sm">
                      <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                        {((m.profile as any)?.full_name ?? '?')[0]?.toUpperCase()}
                      </div>
                      <span>{(m.profile as any)?.full_name ?? 'Unknown'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No members assigned.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
