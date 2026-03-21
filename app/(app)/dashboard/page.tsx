import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderKanban, Users, Clock, FileText, MessageSquare, HardHat, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role, plan, full_name').eq('id', user!.id).single()
  const role = profile?.role
  const plan = profile?.plan ?? 'basic'

  // ── TECHNICIAN ────────────────────────────────────────────────
  if (role === 'technician') {
    const { data: myMembers } = await supabase
      .from('project_members')
      .select('project:projects(id, name, client, location, status)')
      .eq('user_id', user!.id)

    const projects = (myMembers ?? []).map(m => m.project as any).filter(Boolean)

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}.</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Assigned Jobs</CardTitle>
            <HardHat className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{projects.length}</p></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>My Jobs</CardTitle></CardHeader>
          <CardContent>
            {projects.length > 0 ? (
              <div className="space-y-2">
                {projects.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-sm text-gray-500">{p.client ?? ''}{p.location ? ` · ${p.location}` : ''}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      p.status === 'active' ? 'bg-green-100 text-green-700' :
                      p.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{p.status}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">You haven't been assigned to any jobs yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── LEAD TECHNICIAN ────────────────────────────────────────────
  if (role === 'lead_tech') {
    const [{ data: myMembers }, { data: myTasks }, { count: unread }] = await Promise.all([
      supabase.from('project_members').select('project:projects(id, name, client, location, status)').eq('user_id', user!.id),
      supabase.from('tasks').select('id, title, status, priority, project:projects(name)').eq('assigned_to', user!.id).neq('status', 'done').order('created_at'),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('to_user', user!.id).is('read_at', null),
    ])

    const projects = (myMembers ?? []).map(m => m.project as any).filter(Boolean)
    const active = projects.filter((p: any) => p.status === 'active')

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Jobs</CardTitle>
              <FolderKanban className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent><p className="text-3xl font-bold">{active.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Open Tasks</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent><p className="text-3xl font-bold">{myTasks?.length ?? 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Unread Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent><p className="text-3xl font-bold">{unread ?? 0}</p></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>My Assigned Jobs</CardTitle></CardHeader>
          <CardContent>
            {projects.length > 0 ? (
              <div className="space-y-2">
                {projects.map((p: any) => (
                  <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-sm text-gray-500">{p.client ?? ''}{p.location ? ` · ${p.location}` : ''}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      p.status === 'active' ? 'bg-green-100 text-green-700' :
                      p.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{p.status}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No jobs assigned yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── ACCOUNT OWNER ─────────────────────────────────────────────
  const [
    { count: projectCount },
    { count: teamCount },
    { count: pendingTimesheets },
    { count: docCount },
    { count: unreadMessages },
    { data: recentProjects },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'owner'),
    supabase.from('timesheets').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('documents').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('to_user', user!.id).is('read_at', null),
    supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: 'Total Jobs', value: projectCount ?? 0, icon: FolderKanban, color: 'text-blue-600' },
    { label: 'Team Members', value: teamCount ?? 0, icon: Users, color: 'text-green-600' },
    { label: 'Pending Timesheets', value: pendingTimesheets ?? 0, icon: Clock, color: 'text-orange-600' },
    { label: 'Documents', value: docCount ?? 0, icon: FileText, color: 'text-purple-600' },
    ...(plan !== 'basic' ? [{ label: 'Unread Messages', value: unreadMessages ?? 0, icon: MessageSquare, color: 'text-red-500' }] : []),
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${stats.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Jobs</CardTitle></CardHeader>
        <CardContent>
          {recentProjects && recentProjects.length > 0 ? (
            <div className="space-y-3">
              {recentProjects.map(project => (
                <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-500">{project.client ?? 'No client'}{project.location ? ` · ${project.location}` : ''}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    project.status === 'active' ? 'bg-green-100 text-green-700' :
                    project.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                    project.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{project.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No jobs yet. <Link href="/projects/new" className="text-blue-600 underline">Create your first job.</Link></p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
