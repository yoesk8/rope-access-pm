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
    <div className="flex -mx-4 -my-4 -mt-[72px] md:-mx-8 md:-my-8 min-h-screen overflow-hidden">
      <Suspense>
        <ProjectNav
          projectId={id}
          projectName={project.name}
          projectStatus={project.status as ProjectStatus}
          role={role}
        />
      </Suspense>
      <div className="flex-1 overflow-auto p-4 pt-[72px] md:pt-8 md:p-8">
        {children}
      </div>
    </div>
  )
}
