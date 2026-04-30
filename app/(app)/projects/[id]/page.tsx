import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  MapPin, Building2, CalendarDays, ArrowUpFromLine,
  Anchor, AlertTriangle, Phone, Wrench, Tag,
} from 'lucide-react'
import { STATUS_COLORS } from '@/lib/constants'
import { formatJobCategory } from '@/lib/utils'
import type { ProjectRow, Profile } from '@/types'
import { ManageTeamDialog } from './manage-team-dialog'
import { OverviewTasksCard } from './overview-tasks-card'
import { ContactManagerDialog } from '@/components/contact-manager-dialog'
import { StatusSelector } from './status-selector'
import { TasksTab } from './tasks-tab'
import { PhotosTab } from './photos-tab'
import { ChecklistsTab } from './checklists-tab'
import { DailyLogsTab } from './daily-logs-tab'
import { DocumentsTab } from './documents-tab'

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

  const { data: rawProject } = await supabase.from('projects').select('*').eq('id', id).single()
  if (!rawProject) notFound()
  const project = rawProject as ProjectRow

  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role, plan')
    .eq('id', user!.id)
    .single()

  const currentRole = currentProfile?.role
  const plan = currentProfile?.plan ?? 'basic'
  const isTech = currentRole === 'technician'
  const isLeadTech = currentRole === 'lead_tech'
  const isOwner = currentRole === 'owner'

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
    { count: activeJobsCount },
  ] = await Promise.all([
    supabase.from('project_members').select('*, profile:profiles(*)').eq('project_id', id),
    // RLS scopes this to the user's org: owners see their team, field roles see co-members.
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('timesheets').select('*, profile:profiles(full_name)').eq('project_id', id).order('date', { ascending: false }).limit(5),
    supabase.from('documents').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(5),
    supabase.from('tasks').select('*, assignee:profiles!tasks_assigned_to_fkey(id, full_name), task_photos(id, photo_url)').eq('project_id', id).order('created_at'),
    supabase.from('photos').select('*, uploader:profiles(full_name)').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('checklist_templates').select('*').order('type'),
    supabase.from('checklist_submissions').select('*, submitter:profiles(full_name), template:checklist_templates(items)').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('daily_logs').select('*, creator:profiles(full_name)').eq('project_id', id).order('date', { ascending: false }),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  // RLS makes the owner profile visible to their team members, so field roles can contact them.
  const manager = (allProfiles ?? []).find(p => p.role === 'owner')

  const memberProfiles = (members ?? []).map(m => ({
    id: m.id,
    user_id: m.user_id,
    profile: m.profile as Profile,
  }))
  const assignableMembers = (allProfiles ?? []).map(p => ({ id: p.id, full_name: p.full_name }))

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex flex-1 items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {isOwner ? (
            <StatusSelector
              projectId={id}
              currentStatus={project.status}
              plan={plan}
              activeJobsCount={activeJobsCount ?? 0}
            />
          ) : (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[project.status]}`}>
              {project.status}
            </span>
          )}
        </div>
        {(isTech || isLeadTech) && manager && (
          <ContactManagerDialog
            projectId={id}
            projectName={project.name}
            managerId={manager.id}
            managerName={manager.full_name ?? 'Manager'}
          />
        )}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {project.client && (
                  <DetailRow icon={<Building2 className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />} label="Client">
                    {project.client}
                  </DetailRow>
                )}
                {project.location && (
                  <DetailRow icon={<MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />} label="Location">
                    {project.location}
                  </DetailRow>
                )}
                {(project.start_date || project.end_date) && (
                  <DetailRow icon={<CalendarDays className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />} label="Dates">
                    {project.start_date ?? '—'} → {project.end_date ?? '—'}
                  </DetailRow>
                )}
                {project.job_category && (
                  <DetailRow icon={<Tag className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />} label="Category">
                    {formatJobCategory(project.job_category)}
                  </DetailRow>
                )}
                {project.access_type && (
                  <DetailRow icon={<ArrowUpFromLine className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />} label="Site Access">
                    {project.access_type}
                  </DetailRow>
                )}
                {project.max_height && (
                  <DetailRow icon={<ArrowUpFromLine className="h-4 w-4 text-gray-400 mt-0.5 shrink-0 rotate-90" />} label="Max Height">
                    {project.max_height}m
                  </DetailRow>
                )}
                {project.anchor_points && (
                  <DetailRow icon={<Anchor className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />} label="Anchor Points">
                    {project.anchor_points}
                  </DetailRow>
                )}
                {project.rigging_details && (
                  <DetailRow icon={<Wrench className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />} label="Rigging">
                    {project.rigging_details}
                  </DetailRow>
                )}
                {project.risk_considerations && (
                  <DetailRow icon={<AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />} label="Risks">
                    {project.risk_considerations}
                  </DetailRow>
                )}
                {project.site_contact_name && (
                  <DetailRow icon={<Phone className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />} label="Site Contact">
                    {project.site_contact_name}
                    {project.site_contact_role && ` (${project.site_contact_role})`}
                    {project.site_contact_phone && ` · ${project.site_contact_phone}`}
                  </DetailRow>
                )}
                {(project.tools_needed ?? []).length > 0 && (
                  <DetailRow icon={<Wrench className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />} label="Tools">
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {project.tools_needed!.map(tool => (
                        <span key={tool} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </DetailRow>
                )}
                {project.description && (
                  <p className="text-sm text-gray-600 pt-2 border-t">{project.description}</p>
                )}
              </CardContent>
            </Card>

            <OverviewTasksCard projectId={id} initialTasks={(tasks ?? []) as any} />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Team on this job</CardTitle>
                {isOwner && (
                  <ManageTeamDialog
                    projectId={id}
                    allProfiles={(allProfiles ?? []) as Profile[]}
                    members={memberProfiles}
                  />
                )}
              </CardHeader>
              <CardContent>
                {members && members.length > 0 ? (
                  <div className="space-y-3">
                    {members.map(m => {
                      const memberProfile = m.profile as Profile
                      return (
                        <div key={m.id} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                              {(memberProfile?.full_name ?? '?')[0]?.toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {memberProfile?.full_name ?? 'Unknown'}
                            </span>
                          </div>
                          {memberProfile?.role && memberProfile.role !== 'owner' && (
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                              memberProfile.role === 'lead_tech'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {memberProfile.role === 'lead_tech' ? 'Lead Tech' : 'Technician'}
                            </span>
                          )}
                        </div>
                      )
                    })}
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
          canManage={isOwner || isLeadTech}
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

      {tab === 'documents' && (
        <DocumentsTab
          projectId={id}
          documents={(documents ?? []) as any}
          canUpload={isOwner || isLeadTech}
        />
      )}

      {tab === 'team' && isOwner && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Team ({members?.length ?? 0})</h2>
            <ManageTeamDialog
              projectId={id}
              allProfiles={(allProfiles ?? []) as Profile[]}
              members={memberProfiles}
            />
          </div>
          {members && members.length > 0 ? (
            <div className="space-y-2">
              {members.map(m => {
                const memberProfile = m.profile as Profile
                return (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg border bg-white p-3">
                    <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                      {(memberProfile?.full_name ?? '?')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{memberProfile?.full_name ?? 'Unknown'}</p>
                      <p className="text-xs text-gray-400 capitalize">{memberProfile?.role ?? ''}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No members assigned to this job yet.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Labelled detail row used in the project overview card. */
function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2 text-sm text-gray-600">
      {icon}
      <span>
        <span className="font-medium">{label}:</span>{' '}
        {children}
      </span>
    </div>
  )
}
