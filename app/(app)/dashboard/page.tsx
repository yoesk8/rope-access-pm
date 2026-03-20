import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderKanban, Users, Clock, FileText, CheckCircle2, MessageSquare, HardHat } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const isTech = profile?.role === 'technician'

  if (isTech) {
    // Technician dashboard — my jobs, my tasks, my timesheets
    const [
      { data: myProjects },
      { data: myTasks },
      { count: pendingTimesheets },
    ] = await Promise.all([
      supabase.from('project_members').select('project:projects(id, name, client, location, status)').eq('user_id', user!.id),
      supabase.from('tasks').select('id, title, status, project:projects(name)').eq('assigned_to', user!.id).neq('status', 'done').order('created_at'),
      supabase.from('timesheets').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).eq('status', 'pending'),
    ])

    const projects = (myProjects ?? []).map(m => m.project as any).filter(Boolean)

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back. Here's your current workload.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Assigned Jobs</CardTitle>
              <HardHat className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent><p className="text-3xl font-bold">{projects.length}</p></CardContent>
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
              <CardTitle className="text-sm font-medium text-gray-500">Pending Timesheets</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent><p className="text-3xl font-bold">{pendingTimesheets ?? 0}</p></CardContent>
          </Card>
        </div>

        {/* Open tasks */}
        {myTasks && myTasks.length > 0 && (
          <Card>
            <CardHeader><CardTitle>My Open Tasks</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {myTasks.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <p className="text-xs text-gray-400">{task.project?.name}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>{task.status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* My jobs */}
        <Card>
          <CardHeader><CardTitle>My Jobs</CardTitle></CardHeader>
          <CardContent>
            {projects.length > 0 ? (
              <div className="space-y-2">
                {projects.map((project: any) => (
                  <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-500">{project.client ?? ''}{project.location ? ` · ${project.location}` : ''}</p>
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
              <p className="text-sm text-gray-500">You haven't been assigned to any jobs yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Admin / Manager dashboard
  const [
    { count: projectCount },
    { count: teamCount },
    { count: pendingTimesheets },
    { count: docCount },
    { count: unreadMessages },
    { data: recentProjects },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('timesheets').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('documents').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('to_user', user!.id).is('read_at', null),
    supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: 'Total Projects', value: projectCount ?? 0, icon: FolderKanban, color: 'text-blue-600' },
    { label: 'Team Members', value: teamCount ?? 0, icon: Users, color: 'text-green-600' },
    { label: 'Pending Timesheets', value: pendingTimesheets ?? 0, icon: Clock, color: 'text-orange-600' },
    { label: 'Documents', value: docCount ?? 0, icon: FileText, color: 'text-purple-600' },
    { label: 'Unread Messages', value: unreadMessages ?? 0, icon: MessageSquare, color: 'text-red-500' },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {recentProjects && recentProjects.length > 0 ? (
            <div className="space-y-3">
              {recentProjects.map(project => (
                <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-500">{project.client ?? 'No client'} · {project.location ?? 'No location'}</p>
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
            <p className="text-sm text-gray-500">No projects yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
