'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/components/user-provider'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Clock,
  LogOut,
  MessageSquare,
} from 'lucide-react'

function useNav() {
  const { role, plan } = useUser()
  const isOwner = role === 'owner'
  const isLeadTech = role === 'lead_tech'

  return [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { href: '/projects', label: isOwner ? 'Jobs' : 'My Jobs', icon: FolderKanban, show: true },
    { href: '/team', label: 'Team', icon: Users, show: isOwner },
    { href: '/timesheets', label: 'Timesheets', icon: Clock, show: isOwner || isLeadTech },
    {
      href: '/messages',
      label: 'Messages',
      icon: MessageSquare,
      show: (isOwner && plan !== 'basic') || isLeadTech,
    },
  ].filter(n => n.show)
}

function NavLink({
  href,
  label,
  icon: Icon,
  badge,
  onClick,
  vertical = false,
}: {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
  onClick?: () => void
  vertical?: boolean
}) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')

  if (vertical) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          'flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors relative',
          active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
        )}
      >
        <div className="relative">
          <Icon className="h-5 w-5" />
          {badge ? (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {badge > 9 ? '9+' : badge}
            </span>
          ) : null}
        </div>
        {label}
        {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-gray-900" />}
      </Link>
    )
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors relative',
        active ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      <div className="relative">
        <Icon className="h-4 w-4 shrink-0" />
        {badge ? (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </div>
      <span className="flex-1">{label}</span>
    </Link>
  )
}

export function Sidebar({ unreadCount = 0 }: { unreadCount?: number }) {
  const nav = useNav()
  const router = useRouter()
  const pathname = usePathname()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Attach badge to messages
  const navWithBadge = nav.map(item =>
    item.href === '/messages' ? { ...item, badge: unreadCount } : { ...item, badge: 0 }
  )

  return (
    <>
      {/* ── Desktop sidebar ─────────────────── */}
      <aside className="hidden md:flex h-screen w-56 flex-col border-r bg-white shrink-0">
        <div className="flex h-14 items-center px-5 border-b shrink-0">
          <span className="font-bold text-base">Rope Access PM</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
          {navWithBadge.map(({ href, label, icon, badge }) => (
            <NavLink key={href} href={href} label={label} icon={icon} badge={badge} />
          ))}
        </nav>
        <div className="border-t p-3 shrink-0">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex h-12 items-center justify-between border-b bg-white px-4">
        <span className="font-bold text-base">Rope Access PM</span>
        <button
          onClick={handleSignOut}
          className="rounded-md p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* ── Mobile bottom tab bar ────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex bg-white border-t">
        {navWithBadge.map(({ href, label, icon, badge }) => (
          <NavLink key={href} href={href} label={label} icon={icon} badge={badge} vertical />
        ))}
      </nav>
    </>
  )
}
