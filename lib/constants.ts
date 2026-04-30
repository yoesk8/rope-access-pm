import type { ProjectStatus, Role, Plan } from '@/types'
import { Crown, HardHat, Shield } from 'lucide-react'

// ── Project status display ────────────────────────────────────────────────────

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  active:    'bg-green-100 text-green-700',
  draft:     'bg-yellow-100 text-yellow-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
}

/** Preferred display order for grouping projects by status. */
export const STATUS_ORDER: ProjectStatus[] = ['active', 'draft', 'completed', 'cancelled']

export const STATUS_HEADINGS: Record<ProjectStatus, string> = {
  active:    'Active',
  draft:     'Draft',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

// ── Role display ──────────────────────────────────────────────────────────────

export const ROLE_COLORS: Record<Role, string> = {
  owner:      'bg-purple-100 text-purple-700',
  lead_tech:  'bg-blue-100 text-blue-700',
  technician: 'bg-gray-100 text-gray-600',
}

export const ROLE_LABELS: Record<Role, string> = {
  owner:      'Account Owner',
  lead_tech:  'Lead Technician',
  technician: 'Technician',
}

export const ROLE_ICONS: Record<Role, React.ElementType> = {
  owner:      Crown,
  lead_tech:  Shield,
  technician: HardHat,
}

// ── Plan display ──────────────────────────────────────────────────────────────

export const PLAN_LABELS: Record<Plan, string> = {
  basic:      'Basic (Free)',
  field:      'Field',
  operations: 'Operations',
}

export const PLAN_COLORS: Record<Plan, string> = {
  basic:      'bg-gray-100 text-gray-600',
  field:      'bg-blue-100 text-blue-700',
  operations: 'bg-purple-100 text-purple-700',
}
