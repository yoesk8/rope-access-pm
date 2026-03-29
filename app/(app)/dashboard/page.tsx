import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FolderKanban, Users, Clock, MessageSquare, CheckCircle2, Plus, ChevronRight } from 'lucide-react'

const roleLabels: Record<string, { label: string; color: string }> = {
  owner:      { label: 'Account Owner',   color: 'bg-purple-100 text-purple-700' },
  lead_tech:  { label: 'Lead Technician', color: 'bg-blue-100 text-blue-700' },
  technician: { label: 'Technician',      color: 'bg-gray-100 text-gray-600' },
}

const statusColors: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  draft:     'bg-yellow-100 text-yellow-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-2xl bg-white border p-4 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function JobRow({ p }: { p: any }) {
  return (
    <Link
      href={`/projects/${p.id}`}
      className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-gray-50 -mx-4 px-4 transition-colors"
    >
      <div className="min-w-0">
        <p className="font-medium text-gray-900 truncate">{p.name}</p>
        {(p.client || p.location) && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{p.client ?? ''}{p.location ? ` · ${p.location}` : ''}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {p.status}
        </span>
        <ChevronRight className="h-4 w-4 text-gray-300" />
      </div>
    </Link>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role, plan, full_name').eq('id', user!.id).single()
  const role = profile?.role
  const plan = profile?.plan ?? 'basic'
  const roleInfo = role ? roleLabels[role] : null
  const firstName = profile?.full_name?.split(' ')[0] ?? null

  // ── TECHNICIAN ─────────────────────────────────────────────────
  if (role === 'technician') {
    const { data: myMembers } = await supabase
      .from('project_members')
      .select('project:projects(id, name, client, location, status)')
      .eq('user_id', user!.id)

    const projects = (myMembers ?? []).map(m => m.project as any).filter(Boolean)
    const active = projects.filter((p: any) => p.status === 'active')

    return (
      <div className="space-y-6 max-w-lg">
        <div>
          <p className="text-sm text-gray-400">Welcome back{firstName ? `, ${firstName}` : ''}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
            {roleInfo && <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleInfo.color}`}>{roleInfo.label}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Assigned" value={projects.length} icon={FolderKanban} color="bg-blue-50 text-blue-500" />
          <StatCard label="Active" value={active.length} icon={CheckCircle2} color="bg-green-50 text-green-500" />
        </div>

        <div className="rounded-2xl bg-white border">
          <div className="px-4 pt-4 pb-2">
            <h2 className="font-semibold text-gray-900">Assigned Jobs</h2>
          </div>
          <div className="px-4 pb-4">
            {projects.length > 0 ? projects.map((p: any) => <JobRow key={p.id} p={p} />) : (
              <p className="text-sm text-gray-400 py-6 text-center">No jobs assigned yet.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── LEAD TECHNICIAN ────────────────────────────────────────────
  if (role === 'lead_tech') {
    const [{ data: myMembers }, { data: myTasks }, { count: unread }] = await Promise.all([
      supabase.from('project_members').select('project:projects(id, name, client, location, status)').eq('user_id', user!.id),
      supabase.from('tasks').select('id').eq('assigned_to', user!.id).neq('status', 'done'),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('to_user', user!.id).is('read_at', null),
    ])

    const projects = (myMembers ?? []).map(m => m.project as any).filter(Boolean)
    const active = projects.filter((p: any) => p.status === 'active')

    return (
      <div className="space-y-6 max-w-lg">
        <div>
          <p className="text-sm text-gray-400">Welcome back{firstName ? `, ${firstName}` : ''}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            {roleInfo && <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleInfo.color}`}>{roleInfo.label}</span>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Active Jobs"   value={active.length}      icon={FolderKanban}  color="bg-green-50 text-green-500" />
          <StatCard label="Open Tasks"    value={myTasks?.length ?? 0} icon={CheckCircle2} color="bg-orange-50 text-orange-500" />
          <StatCard label="Messages"      value={unread ?? 0}          icon={MessageSquare} color="bg-blue-50 text-blue-500" />
        </div>

        <div className="rounded-2xl bg-white border">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="font-semibold text-gray-900">My Jobs</h2>
            <Link href="/projects" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">View all</Link>
          </div>
          <div className="px-4 pb-4">
            {projects.length > 0 ? projects.slice(0, 5).map((p: any) => <JobRow key={p.id} p={p} />) : (
              <p className="text-sm text-gray-400 py-6 text-center">No jobs assigned yet.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── ACCOUNT OWNER ──────────────────────────────────────────────
  const [
    { count: activeCount },
    { count: teamCount },
    { count: pendingTimesheets },
    { count: unreadMessages },
    { data: recentProjects },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'owner'),
    supabase.from('timesheets').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('to_user', user!.id).is('read_at', null),
    supabase.from('projects').select('id, name, client, location, status').eq('status', 'active').order('created_at', { ascending: false }).limit(5),
  ])

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400">Welcome back{firstName ? `, ${firstName}` : ''}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            {roleInfo && <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleInfo.color}`}>{roleInfo.label}</span>}
          </div>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" /> New Job
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Active Jobs"          value={activeCount ?? 0}        icon={FolderKanban}  color="bg-green-50 text-green-600" />
        <StatCard label="Team Members"         value={teamCount ?? 0}          icon={Users}         color="bg-blue-50 text-blue-600" />
        <StatCard label="Pending Timesheets"   value={pendingTimesheets ?? 0}  icon={Clock}         color="bg-orange-50 text-orange-500" />
        {plan !== 'basic' && (
          <StatCard label="Unread Messages"    value={unreadMessages ?? 0}     icon={MessageSquare} color="bg-purple-50 text-purple-500" />
        )}
      </div>

      <div className="rounded-2xl bg-white border">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="font-semibold text-gray-900">Active Jobs</h2>
          <Link href="/projects" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">View all</Link>
        </div>
        <div className="px-4 pb-4">
          {recentProjects && recentProjects.length > 0 ? (
            recentProjects.map(p => <JobRow key={p.id} p={p} />)
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400 mb-3">No active jobs yet.</p>
              <Link href="/projects/new" className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors">
                <Plus className="h-4 w-4" /> Create your first job
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
