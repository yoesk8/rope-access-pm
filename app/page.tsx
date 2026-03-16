import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import {
  FolderKanban,
  Users,
  Clock,
  FileText,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'

const features = [
  {
    icon: FolderKanban,
    title: 'Project Management',
    description: 'Track every job from initial quote to completion. Manage status, location, dates, and client details in one place.',
  },
  {
    icon: Users,
    title: 'Team & Certifications',
    description: 'Manage your rope access technicians, assign them to projects, and keep on top of training and certification records.',
  },
  {
    icon: Clock,
    title: 'Timesheets',
    description: 'Technicians log hours per job. Managers review and approve — keeping payroll and billing accurate.',
  },
  {
    icon: FileText,
    title: 'Document Control',
    description: 'Store risk assessments, method statements, inspection reports, and certificates against each project.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-gray-900 text-lg">RopeAccess PM</span>
          </div>
          <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-24 text-center">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">
            <ShieldCheck className="h-4 w-4" />
            Built for rope access teams
          </div>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight">
            Manage every job,<br />from rope to report
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Purpose-built project management for rope access contractors. Track jobs, manage your team, approve timesheets, and control documents — all in one platform.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/login" className={cn(buttonVariants({ size: 'lg' }))}>
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Everything your team needs</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Ready to get organised?</h2>
          <p className="text-gray-500">Sign in to start managing your rope access projects.</p>
          <Link href="/login" className={cn(buttonVariants({ size: 'lg' }))}>
            Sign in <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 px-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} RopeAccess PM. All rights reserved.
      </footer>
    </div>
  )
}
