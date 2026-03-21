'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  LayoutGrid,
  CheckSquare,
  Camera,
  ClipboardList,
  BookOpen,
  FileText,
  Users,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProjectStatus, Role } from '@/types'

const statusColors: Record<ProjectStatus, string> = {
  draft: 'bg-yellow-400',
  active: 'bg-green-400',
  completed: 'bg-gray-400',
  cancelled: 'bg-red-400',
}

// Tabs visible per role
const ownerTabs = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
  { key: 'photos', label: 'Photos', icon: Camera },
  { key: 'checklists', label: 'Checklists', icon: ClipboardList },
  { key: 'logs', label: 'Daily Logs', icon: BookOpen },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'team', label: 'Team', icon: Users },
]

const leadTechTabs = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid },
  { key: 'documents', label: 'Reports', icon: FileText },
]

const techTabs = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid },
]

interface Props {
  projectId: string
  projectName: string
  projectStatus: ProjectStatus
  role: Role
}

export function ProjectNav({ projectId, projectName, projectStatus, role }: Props) {
  const searchParams = useSearchParams()
  const active = searchParams.get('tab') ?? 'overview'

  const tabs =
    role === 'owner' ? ownerTabs :
    role === 'lead_tech' ? leadTechTabs :
    techTabs

  function NavItem({ item }: { item: { key: string; label: string; icon: React.ElementType } }) {
    const Icon = item.icon
    const isActive = active === item.key
    return (
      <Link
        href={`/projects/${projectId}?tab=${item.key}`}
        className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          isActive
            ? 'bg-white/15 text-white'
            : 'text-gray-300 hover:bg-white/10 hover:text-white'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
    )
  }

  return (
    <>
      {/* Desktop: vertical dark sidebar */}
      <aside className="hidden md:flex w-52 shrink-0 flex-col bg-gray-900 min-h-0">
        <div className="p-4 border-b border-white/10">
          <Link
            href="/projects"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All Jobs
          </Link>
          <div className="flex items-start gap-2">
            <span className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', statusColors[projectStatus])} />
            <p className="text-sm font-semibold text-white leading-snug">{projectName}</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-0.5">
            {tabs.map(item => <NavItem key={item.key} item={item} />)}
          </div>
        </nav>
      </aside>

      {/* Mobile: horizontal scrolling tab bar */}
      <div className="md:hidden flex gap-1 bg-gray-900 overflow-x-auto px-3 py-2 -mx-4 -mt-4 mb-4">
        {tabs.map(item => {
          const Icon = item.icon
          const isActive = active === item.key
          return (
            <Link
              key={item.key}
              href={`/projects/${projectId}?tab=${item.key}`}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors',
                isActive ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </>
  )
}
