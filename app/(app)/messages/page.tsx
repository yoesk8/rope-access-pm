import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { MarkReadButton } from './mark-read-button'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  if (profile?.role === 'technician') redirect('/dashboard')

  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_from_user_fkey(full_name), project:projects(name)')
    .eq('to_user', user!.id)
    .order('created_at', { ascending: false })

  const unread = messages?.filter(m => !m.read_at) ?? []
  const read = messages?.filter(m => m.read_at) ?? []

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        {unread.length > 0 && (
          <span className="text-sm text-gray-500">{unread.length} unread</span>
        )}
      </div>

      {(!messages || messages.length === 0) && (
        <Card>
          <CardContent className="py-16 text-center text-gray-400 text-sm">
            No messages yet.
          </CardContent>
        </Card>
      )}

      {unread.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Unread</p>
          {unread.map(msg => (
            <Card key={msg.id} className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900">{(msg.sender as any)?.full_name ?? 'Unknown'}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{(msg.project as any)?.name ?? 'General'}</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                  <MarkReadButton messageId={msg.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {read.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Read</p>
          {read.map(msg => (
            <Card key={msg.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-700">{(msg.sender as any)?.full_name ?? 'Unknown'}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">{(msg.project as any)?.name ?? 'General'}</span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(msg.created_at).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
