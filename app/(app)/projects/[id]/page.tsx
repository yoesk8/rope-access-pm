import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, MapPin, Building2, CalendarDays, Clock, FileText, ArrowUpFromLine, Anchor, AlertTriangle, Phone, Wrench, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Suspense } from 'react'
import type { ProjectStatus, Profile } from '@/types'
import { ManageTeamDialog } from './manage-team-dialog'
import { ContactManagerDialog } from '@/components/contact-manager-dialog'
import { MarkCompleteButton } from './mark-complete-button'
import { TabsNav } from './tabs-nav'
import { TasksTab } from './tasks-tab'
import { PhotosTab } from './photos-tab'
import { ChecklistsTab } from './checklists-tab'
import { DailyLogsTab } from './daily-logs-tab'

const statusColors: Record<ProjectStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab = 'overview' } = await searchParams
  const supabase = await createClient()

  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
  if (!project) notFound()

  const [
    { data: members },
    { data: allProfiles },
    { data: timesheets },
    { data: documents },
    { data: tasks },
    { data: photos },
    { data: templates },
    { data: submissions },
    { data: logs },
  ] = await Promise.all([
    supabase.from('project_members').select('*, profile:profiles(*)').eq('project_id', id),
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('timesheets').select('*, profile:profiles(full_name)').eq('project_id', id).order('date', { ascending: false }).limit(5),
    supabase.from('documents').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(5),
    supabase.from('tasks').select('*, assignee:profiles!tasks_assigned_to_fkey(id, full_name), task_photos(id, photo_url)').eq('project_id', id).order('created_at'),
    supabase.from('photos').select('*, uploader:profiles(full_name)').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('checklist_templates').select('*').order('type'),
    supabase.from('checklist_submissions').select('*, submitter:profiles(full_name), template:checklist_templates(items)').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('daily_logs').select('*, creator:profiles(full_name)').eq('project_id', id).order('date', { ascending: false }),
  ])

  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const currentRole = currentProfile?.role
  const isTech = currentRole === 'technician'
  const isLeadTech = currentRole === 'lead_tech'
  const canManage = currentRole === 'admin' || currentRole === 'manager'
  const canComplete = canManage || isLeadTech

  // Find a manager/admin to contact
  const manager = (allProfiles ?? []).find(p => p.role === 'admin' || p.role === 'manager')

  const totalHours = timesheets?.reduce((sum, t) => sum + (t.hours ?? 0), 0) ?? 0
  const memberProfiles = (members ?? []).map(m => ({ id: m.id, user_id: m.user_id, profile: m.profile as Profile }))
  const assignableMembers = (allProfiles ?? []).map(p => ({ id: p.id, full_name: p.full_name }))

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/projects" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex flex-1 items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[project.status as ProjectStatus]}`}>
            {project.status}
          </span>
        </div>
        {(isTech || isLeadTech) && manager && (
          <ContactManagerDialog
            projectId={id}
            projectName={project.name}
            managerId={manager.id}
            managerName={manager.full_name ?? 'Manager'}
          />
        )}
        {canComplete && project.status === 'active' && (
          <MarkCompleteButton projectId={id} />
        )}
      </div>

      {/* Tabs */}
      <Suspense>
        <TabsNav projectId={id} />
      </Suspense>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {project.client && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <span><span className="font-medium">Client:</span> {project.client}</span>
                  </div>
                )}
                {project.location && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <span><span className="font-medium">Location:</span> {project.location}</span>
                  </div>
                )}
                {(project.start_date || project.end_date) && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <CalendarDays className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <span><span className="font-medium">Dates:</span> {project.start_date ?? '—'} → {project.end_date ?? '—'}</span>
                  </div>
                )}
                {(project as any).job_category && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Tag className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <span><span className="font-medium">Category:</span> {(project as any).job_category.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                  </div>
                )}
                {(project as any).access_type && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <ArrowUpFromLine className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <span><span className="font-medium">Access:</span> {(project as any).access_type.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
                )}
                {(project as any).max_height && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <ArrowUpFromLine className="h-4 w-4 text-gray-400 mt-0.5 shrink-0 rotate-90" />
                    <span><span className="font-medium">Max Height:</span> {(project as any).max_height}m</span>
                  </div>
                )}
                {(project as any).anchor_points && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Anchor className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <span><span className="font-medium">Anchor Points:</span> {(project as any).anchor_points}</span>
                  </div>
                )}
                {(project as any).rigging_details && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Wrench className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <span><span className="font-medium">Rigging:</span> {(project as any).rigging_details}</span>
                  </div>
                )}
                {(project as any).risk_considerations && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                    <span><span className="font-medium">Risks:</span> {(project as any).risk_considerations}</span>
                  </div>
                )}
                {(project as any).site_contact_name && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <span>
                      <span className="font-medium">Site Contact:</span>{' '}
                      {(project as any).site_contact_name}
                      {(project as any).site_contact_role && ` (${(project as any).site_contact_role})`}
                      {(project as any).site_contact_phone && ` · ${(project as any).site_contact_phone}`}
                    </span>
                  </div>
                )}
                {((project as any).tools_needed as string[])?.length > 0 && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Wrench className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium">Tools:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {((project as any).tools_needed as string[]).map((t: string) => (
                          <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {project.description && (
                  <p className="text-sm text-gray-600 pt-2 border-t">{project.description}</p>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Team ({members?.length ?? 0})</CardTitle>
                {(canManage || isLeadTech) && (
                  <ManageTeamDialog
                    projectId={id}
                    allProfiles={(allProfiles ?? []) as Profile[]}
                    members={memberProfiles}
                  />
                )}
              </CardHeader>
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
      )}

      {tab === 'tasks' && (
        <TasksTab
          projectId={id}
          tasks={(tasks ?? []) as any}
          members={assignableMembers as any}
        />
      )}

      {tab === 'photos' && (
        <PhotosTab projectId={id} photos={(photos ?? []) as any} />
      )}

      {tab === 'checklists' && (
        <ChecklistsTab
          projectId={id}
          templates={(templates ?? []) as any}
          submissions={(submissions ?? []) as any}
        />
      )}

      {tab === 'logs' && (
        <DailyLogsTab projectId={id} logs={(logs ?? []) as any} />
      )}
    </div>
  )
}
