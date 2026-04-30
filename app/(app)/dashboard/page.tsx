import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  FolderKanban, Users, Clock, MessageSquare,
  CheckCircle2, Plus, HardHat, Shield, ChevronRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ProjectCard } from '@/components/project-card'
import { STATUS_ORDER, STATUS_HEADINGS, STATUS_COLORS, ROLE_COLORS, ROLE_LABELS, ROLE_ICONS } from '@/lib/constants'
import type { ProjectRow, ProjectStatus, Role } from '@/types'

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  href,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
  href?: string
}) {
  const inner = (
    <div className={`rounded-2xl bg-white border p-4 flex items-center gap-4 ${href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

/** Compact job row used in the technician and lead-tech dashboards. */
function JobRow({ p }: { p: ProjectRow }) {
  return (
    <Link
      href={`/projects/${p.id}`}
      className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-gray-50 -mx-4 px-4 transition-colors"
    >
      <div className="min-w-0">
        <p className="font-medium text-gray-900 truncate">{p.name}</p>
        {(p.client || p.location) && (
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {p.client ?? ''}{p.location ? ` · ${p.location}` : ''}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {p.status}
        </span>
        <ChevronRight className="h-4 w-4 text-gray-300" />
      </div>
    </Link>
  )
}

/** Greeting header shared by all three role views. */
function DashboardHeader({ firstName, role }: { firstName: string | null; role: Role }) {
  const roleInfo = ROLE_COLORS[role] ? { label: ROLE_LABELS[role], color: ROLE_COLORS[role] } : null
  return (
    <div>
      <p className="text-sm text-gray-400">Welcome back{firstName ? `, ${firstName}` : ''}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        {roleInfo && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleInfo.color}`}>
            {roleInfo.label}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, plan, full_name')
    .eq('id', user!.id)
    .single()

  const role = profile?.role as Role
  const plan = profile?.plan ?? 'basic'
  const firstName = profile?.full_name?.split(' ')[0] ?? null

  // ── Technician view ───────────────────────────────────────────────────────
  if (role === 'technician') {
    const { data: myMembers } = await supabase
      .from('project_members')
      .select('project:projects(*)')
      .eq('user_id', user!.id)

    const projects = (myMembers ?? []).map(m => m.project as unknown as ProjectRow).filter(Boolean)
    const activeCount = projects.filter(p => p.status === 'active').length

    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-400">Welcome back{firstName ? `, ${firstName}` : ''}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS.technician}`}>
              {ROLE_LABELS.technician}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Assigned" value={projects.length} icon={FolderKanban} color="bg-blue-50 text-blue-500" />
          <StatCard label="Active"   value={activeCount}     icon={CheckCircle2} color="bg-green-50 text-green-500" />
        </div>

        <div className="rounded-2xl bg-white border">
          <div className="px-4 pt-4 pb-2">
            <h2 className="font-semibold text-gray-900">Assigned Jobs</h2>
          </div>
          <div className="px-4 pb-4">
            {projects.length > 0
              ? projects.map(p => <JobRow key={p.id} p={p} />)
              : <p className="text-sm text-gray-400 py-6 text-center">No jobs assigned yet.</p>
            }
          </div>
        </div>
      </div>
    )
  }

  // ── Lead technician view ──────────────────────────────────────────────────
  if (role === 'lead_tech') {
    const [{ data: myMembers }, { data: myTasks }, { count: unread }] = await Promise.all([
      supabase.from('project_members').select('project:projects(*)').eq('user_id', user!.id),
      supabase.from('tasks').select('id').eq('assigned_to', user!.id).neq('status', 'done'),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('to_user', user!.id).is('read_at', null),
    ])

    const projects = (myMembers ?? []).map(m => m.project as unknown as ProjectRow).filter(Boolean)
    const activeCount = projects.filter(p => p.status === 'active').length

    return (
      <div className="space-y-6">
        <DashboardHeader firstName={firstName} role={role} />

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Active Jobs" value={activeCount}           icon={FolderKanban}  color="bg-green-50 text-green-500"   href="/projects" />
          <StatCard label="Open Tasks"  value={myTasks?.length ?? 0}  icon={CheckCircle2}  color="bg-orange-50 text-orange-500" />
          <StatCard label="Messages"    value={unread ?? 0}           icon={MessageSquare} color="bg-blue-50 text-blue-500"     href="/messages" />
        </div>

        <div className="rounded-2xl bg-white border">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="font-semibold text-gray-900">My Jobs</h2>
            <Link href="/projects" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              View all
            </Link>
          </div>
          <div className="px-4 pb-4">
            {projects.length > 0
              ? projects.slice(0, 5).map(p => <JobRow key={p.id} p={p} />)
              : <p className="text-sm text-gray-400 py-6 text-center">No jobs assigned yet.</p>
            }
          </div>
        </div>
      </div>
    )
  }

  // ── Account owner view ────────────────────────────────────────────────────
  const [
    { count: activeCount },
    { count: teamCount },
    { count: pendingTimesheets },
    { count: unreadMessages },
    { data: projects },
    { data: members },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'owner'),
    supabase.from('timesheets').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('to_user', user!.id).is('read_at', null),
    supabase.from('projects').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name, role').neq('role', 'owner').order('full_name'),
  ])

  const projectRows = (projects ?? []) as ProjectRow[]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <DashboardHeader firstName={firstName} role={role} />
        <Link
          href="/projects/new"
          className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" /> New Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Active Jobs"        value={activeCount ?? 0}       icon={FolderKanban}  color="bg-green-50 text-green-600"   href="/projects" />
        <StatCard label="Team Members"       value={teamCount ?? 0}         icon={Users}         color="bg-blue-50 text-blue-600"     href="/team" />
        <StatCard label="Pending Timesheets" value={pendingTimesheets ?? 0} icon={Clock}         color="bg-orange-50 text-orange-500" href="/timesheets" />
        {plan !== 'basic' && (
          <StatCard label="Unread Messages"  value={unreadMessages ?? 0}    icon={MessageSquare} color="bg-purple-50 text-purple-500" href="/messages" />
        )}
      </div>

      {/* Jobs grouped by status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-semibold text-gray-900">Jobs</h2>
          <Link href="/projects" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
            View all
          </Link>
        </div>

        {projectRows.length > 0 ? (
          <div className="space-y-6">
            {STATUS_ORDER.map(status => {
              const group = projectRows.filter(p => p.status === status)
              if (group.length === 0) return null
              return (
                <div key={status}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {STATUS_HEADINGS[status]}{' '}
                    <span className="text-gray-400 font-normal normal-case tracking-normal">({group.length})</span>
                  </h3>
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
          <div className="rounded-2xl border bg-white py-12 text-center">
            <p className="text-sm text-gray-400 mb-3">No jobs yet.</p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Create your first job
            </Link>
          </div>
        )}
      </div>

      {/* Team members grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Team</h2>
          <Link href="/team" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
            Manage
          </Link>
        </div>

        {members && members.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {members.map(member => {
              const memberRole = member.role as Role
              const RoleIcon = ROLE_ICONS[memberRole] ?? HardHat
              return (
                <div key={member.id} className="rounded-2xl bg-white border p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                    {(member.full_name ?? '?')[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{member.full_name ?? 'Unnamed'}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${ROLE_COLORS[memberRole] ?? 'bg-gray-100 text-gray-600'}`}>
                      <RoleIcon className="h-3 w-3" />
                      {ROLE_LABELS[memberRole] ?? memberRole}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border bg-white py-10 text-center">
            <p className="text-sm text-gray-400 mb-3">No team members yet.</p>
            <Link href="/team" className="text-sm text-blue-600 hover:underline">
              Add your first member
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
