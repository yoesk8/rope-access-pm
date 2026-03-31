import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ProjectNav } from './project-nav'
import type { ProjectStatus, Role } from '@/types'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: project }, { data: { user } }] = await Promise.all([
    supabase.from('projects').select('name, status').eq('id', id).single(),
    supabase.auth.getUser(),
  ])

  if (!project) notFound()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const role = (profile?.role ?? 'technician') as Role

  return (
    <>
      {/* Mobile: stacked layout — tab bar on top, content below */}
      <div className="md:hidden -mx-4 -mt-4">
        <Suspense>
          <ProjectNav
            projectId={id}
            projectName={project.name}
            projectStatus={project.status as ProjectStatus}
            role={role}
          />
        </Suspense>
      </div>
      <div className="md:hidden pt-2">
        {children}
      </div>

      {/* Desktop: flex row — dark sidebar + content */}
      <div className="hidden md:flex -mx-8 -my-8 min-h-screen overflow-hidden">
        <Suspense>
          <ProjectNav
            projectId={id}
            projectName={project.name}
            projectStatus={project.status as ProjectStatus}
            role={role}
          />
        </Suspense>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </div>
    </>
  )
}
