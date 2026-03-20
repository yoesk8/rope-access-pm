'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { UserPlus } from 'lucide-react'
import { inviteMember } from './invite-action'

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

export function InviteDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    const data = new FormData(e.currentTarget)
    const res = await inviteMember(data)
    setResult(res)
    setLoading(false)
    if (res.success) {
      setTimeout(() => { setOpen(false); setResult(null) }, 1500)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors">
        <UserPlus className="h-4 w-4" /> Invite Member
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <input name="full_name" required className={inputCls} placeholder="John Smith" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" required className={inputCls} placeholder="john@example.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <select name="role" required className={inputCls}>
              <option value="technician">Technician</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          {result?.error && <p className="text-sm text-red-500">{result.error}</p>}
          {result?.success && <p className="text-sm text-green-600">Invite sent! They'll receive an email to set their password.</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Sending invite…' : 'Send Invite'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
