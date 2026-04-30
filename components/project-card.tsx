import Link from 'next/link'
import { Building2, CalendarDays, MapPin, Tag } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { STATUS_COLORS } from '@/lib/constants'
import { formatJobCategory } from '@/lib/utils'
import type { ProjectRow } from '@/types'

interface Props {
  project: ProjectRow
}

/** Card shown in the projects list and owner dashboard job grid. */
export function ProjectCard({ project }: Props) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 leading-snug">{project.name}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[project.status]}`}>
              {project.status}
            </span>
          </div>

          {project.job_category && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Tag className="h-3 w-3" />
              {formatJobCategory(project.job_category)}
            </div>
          )}

          {project.client && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Building2 className="h-3.5 w-3.5" />
              {project.client}
            </div>
          )}

          {project.location && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin className="h-3.5 w-3.5" />
              {project.location}
            </div>
          )}

          {(project.start_date || project.end_date) && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <CalendarDays className="h-3.5 w-3.5" />
              {project.start_date ?? '—'} → {project.end_date ?? '—'}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
