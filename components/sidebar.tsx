'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Clock,
  FileText,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/timesheets', label: 'Timesheets', icon: Clock },
  { href: '/documents', label: 'Documents', icon: FileText },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-6 border-b shrink-0">
        <span className="font-bold text-lg">Rope Access PM</span>
      </div>
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-3 shrink-0">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <aside className="hidden md:flex h-screen w-60 flex-col border-r bg-white shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex h-14 items-center gap-3 border-b bg-white px-4">
        <button
          onClick={() => setOpen(true)}
          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-bold text-base">Rope Access PM</span>
      </div>

      {/* Mobile drawer backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 rounded-md p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </aside>
    </>
  )
}
