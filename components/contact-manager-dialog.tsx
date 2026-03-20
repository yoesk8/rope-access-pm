'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MessageSquare } from 'lucide-react'

interface Props {
  projectId: string
  projectName: string
  managerId: string
  managerName: string
  managerEmail?: string
}

export function ContactManagerDialog({ projectId, projectName, managerId, managerName, managerEmail }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function send(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: sender } = await supabase.from('profiles').select('full_name').eq('id', user!.id).single()

    await supabase.from('messages').insert({
      project_id: projectId,
      from_user: user!.id,
      to_user: managerId,
      content: message.trim(),
    })

    setSending(false)
    setSent(true)
    setMessage('')
    startTransition(() => router.refresh())
    setTimeout(() => { setOpen(false); setSent(false) }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
        <MessageSquare className="h-4 w-4" /> Contact Manager
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Message {managerName}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500 -mt-2">Re: <span className="font-medium text-gray-700">{projectName}</span></p>
        {sent ? (
          <p className="text-sm text-green-600 py-4 text-center">Message sent!</p>
        ) : (
          <form onSubmit={send} className="space-y-3 mt-2">
            <textarea
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              placeholder="Describe the issue or question…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
            {managerEmail && (
              <p className="text-xs text-gray-400">An email notification will also be sent to {managerEmail}.</p>
            )}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={sending} className="px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
                {sending ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
