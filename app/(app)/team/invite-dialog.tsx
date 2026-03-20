'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { UserPlus, Copy, Check } from 'lucide-react'
import { inviteMember } from './invite-action'

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function InviteDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [password] = useState(generatePassword)

  function handleOpenChange(val: boolean) {
    setOpen(val)
    if (!val) {
      setCreated(null)
      setError(null)
    }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const data = new FormData(e.currentTarget)
    const res = await inviteMember(data)
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      setCreated({ email: data.get('email') as string, password: data.get('password') as string })
    }
  }

  function copyPassword() {
    if (!created) return
    navigator.clipboard.writeText(created.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors">
        <UserPlus className="h-4 w-4" /> Add Member
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{created ? 'Account Created' : 'Add Team Member'}</DialogTitle>
        </DialogHeader>

        {created ? (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-gray-600">
              Share these login details with <strong>{created.email}</strong> — they can change their password after signing in.
            </p>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-2">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</p>
                <p className="text-sm font-mono text-gray-900">{created.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Temporary Password</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono text-gray-900 flex-1">{created.password}</p>
                  <button onClick={copyPassword} className="text-gray-400 hover:text-gray-700 transition-colors">
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400">Screenshot or copy this before closing — the password won't be shown again.</p>
            <button
              onClick={() => handleOpenChange(false)}
              className="w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Temporary Password</label>
              <input name="password" required className={inputCls} defaultValue={password} />
              <p className="text-xs text-gray-400">Auto-generated — you can change it before creating the account.</p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
