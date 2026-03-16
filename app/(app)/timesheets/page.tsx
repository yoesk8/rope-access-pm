import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogTimesheetDialog } from './log-timesheet-dialog'
import { ApproveButton } from './approve-button'

export default async function TimesheetsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const isManager = profile?.role === 'admin' || profile?.role === 'manager'

  const query = supabase
    .from('timesheets')
    .select('*, project:projects(name), profile:profiles(full_name)')
    .order('date', { ascending: false })

  const { data: timesheets } = isManager
    ? await query
    : await query.eq('user_id', user!.id)

  const { data: projects } = await supabase.from('projects').select('id, name').eq('status', 'active')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
        <LogTimesheetDialog projects={projects ?? []} userId={user!.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isManager ? 'All Timesheets' : 'My Timesheets'}</CardTitle>
        </CardHeader>
        <CardContent>
          {timesheets && timesheets.length > 0 ? (
            <div className="divide-y">
              {timesheets.map(t => (
                <div key={t.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      {isManager && <span className="text-gray-500">{(t.profile as any)?.full_name} · </span>}
                      {(t.project as any)?.name}
                    </p>
                    <p className="text-sm text-gray-500">{t.date} · {t.hours}h{t.description ? ` · ${t.description}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      t.status === 'approved' ? 'bg-green-100 text-green-700' :
                      t.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{t.status}</span>
                    {isManager && t.status === 'pending' && (
                      <ApproveButton timesheetId={t.id} approverId={user!.id} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-8 text-center">No timesheets yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
