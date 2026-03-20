import Link from 'next/link'
import { InviteHandler } from '@/components/invite-handler'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import {
  ShieldCheck,
  ArrowRight,
  ClipboardList,
  Users,
  Clock,
  FileText,
  Camera,
  CheckSquare,
  BookOpen,
  BarChart3,
  Zap,
  Lock,
} from 'lucide-react'

const features = [
  {
    icon: ClipboardList,
    title: 'Job Management',
    description: 'Every job tracked from kickoff to sign-off. Status, location, client, rigging details — all in one place.',
  },
  {
    icon: Users,
    title: 'Team Coordination',
    description: 'Assign technicians to jobs, manage roles, and keep your crew organised across multiple sites.',
  },
  {
    icon: CheckSquare,
    title: 'Tasks & Checklists',
    description: 'Assign tasks with priorities and due dates. Run pre-work safety checklists directly from the field.',
  },
  {
    icon: Camera,
    title: 'Photo Documentation',
    description: 'Capture and store site photos against each project. Visual records ready for client reports.',
  },
  {
    icon: BookOpen,
    title: 'Daily Logs',
    description: 'Log weather, crew count, and site notes every day. Build a complete project history automatically.',
  },
  {
    icon: FileText,
    title: 'Document Control',
    description: 'Attach risk assessments, method statements, inspection reports, and IRATA certs to each job.',
  },
  {
    icon: Clock,
    title: 'Timesheets',
    description: 'Technicians log hours per job. Managers review and approve — payroll and billing, sorted.',
  },
  {
    icon: BarChart3,
    title: 'Reporting',
    description: 'At-a-glance dashboard for active jobs, pending approvals, and team utilisation.',
  },
]

const stats = [
  { value: 'Zero', label: 'paperwork chasing' },
  { value: '1 place', label: 'for every job document' },
  { value: 'Real-time', label: 'visibility from site to office' },
  { value: 'IRATA-aware', label: 'built for rope access teams' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <InviteHandler />

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-gray-900 text-lg">RopeAccess PM</span>
          </div>
          <Link href="/login" className={cn(buttonVariants({ size: 'sm' }))}>
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 75% 20%, #1d4ed8 0%, transparent 50%)' }} />
        <div className="relative max-w-6xl mx-auto px-6 py-28 text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-medium px-4 py-1.5 rounded-full">
            <ShieldCheck className="h-4 w-4" />
            Purpose-built for rope access contractors
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight">
            Run every job.<br />
            <span className="text-blue-400">Not just the paperwork.</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            The complete platform for rope access teams. Manage projects, coordinate technicians, capture site photos, and control compliance documents — from any device, on any site.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/login" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-base">
              Get started free <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-3.5 rounded-xl transition-colors text-base border border-white/20">
              Sign in to your account
            </Link>
          </div>
        </div>

        {/* Mock dashboard preview */}
        <div className="max-w-5xl mx-auto px-6 pb-0">
          <div className="bg-white/5 border border-white/10 rounded-t-2xl overflow-hidden">
            <div className="bg-white/10 px-4 py-2.5 flex items-center gap-2 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="w-3 h-3 rounded-full bg-white/20" />
              </div>
              <div className="flex-1 bg-white/10 rounded h-5 mx-8" />
            </div>
            <div className="p-6 grid grid-cols-4 gap-4">
              {['Active Jobs', 'Team Members', 'Open Tasks', 'Pending Docs'].map((label, i) => (
                <div key={label} className="bg-white/10 rounded-xl p-4 space-y-1">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-2xl font-bold text-white">{[12, 8, 34, 5][i]}</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 space-y-2">
              {['Gutter Cleaning — Canary Wharf · Active', 'Facade Inspection — Shard · In Progress', 'Anchor Testing — City Tower · Completed'].map(job => (
                <div key={job} className="bg-white/10 rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-slate-300">{job.split('·')[0].trim()}</span>
                  <span className="text-xs text-blue-400 font-medium">{job.split('·')[1].trim()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-slate-50 border-b border-gray-100 py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">Built for the way rope access teams actually work</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center space-y-1">
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value pillars */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Everything your team needs. Nothing they don't.</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Fieldwire is great for construction. RopeAccess PM is built specifically for working at height — with the workflows, language, and compliance requirements your team already uses.</p>
          </div>

          {/* Alternating feature blocks */}
          <div className="space-y-24">

            {/* Feature 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1.5 rounded-lg">
                  <ClipboardList className="h-4 w-4" /> Project Control
                </div>
                <h3 className="text-3xl font-bold text-gray-900">Every job, every detail — tracked from day one</h3>
                <p className="text-gray-500 leading-relaxed text-lg">Create jobs with rope access-specific fields: access type, max height, rigging details, anchor points, and risk considerations. Your site contact, tools needed, and method statement — all attached to the job, not lost in email.</p>
                <ul className="space-y-3">
                  {['Active, completed & on-hold job status', 'Rope access category & access type fields', 'Site contact details always at hand', 'Full job history from first access to final report'].map(item => (
                    <li key={item} className="flex items-start gap-3 text-gray-700">
                      <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-slate-100 rounded-2xl p-6 space-y-3 border border-blue-100">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Canary Wharf — Facade Wash</p>
                      <p className="text-xs text-gray-400 mt-0.5">Client: Brookfield Properties</p>
                    </div>
                    <span className="text-xs font-medium bg-green-100 text-green-700 px-2.5 py-1 rounded-full">Active</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[['Category', 'IRATA Level 2'], ['Access Type', 'Single Rope'], ['Max Height', '180m'], ['Anchor Points', '12 rated anchors']].map(([k, v]) => (
                      <div key={k} className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-400">{k}</p>
                        <p className="font-medium text-gray-700">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">Site Contact</p>
                  <p className="text-sm font-semibold text-gray-900">Mark Davies — Site Manager</p>
                  <p className="text-xs text-gray-400">+44 7700 900123</p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="bg-gradient-to-br from-purple-50 to-slate-100 rounded-2xl p-6 space-y-3 border border-purple-100 lg:order-1">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-3">Team on this job</p>
                  <div className="space-y-2">
                    {[['James R.', 'Lead Tech', 'bg-blue-100 text-blue-700'], ['Sarah K.', 'Technician', 'bg-gray-100 text-gray-600'], ['Tom W.', 'Technician', 'bg-gray-100 text-gray-600']].map(([name, role, cls]) => (
                      <div key={name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">{name[0]}</div>
                          <span className="text-sm font-medium text-gray-800">{name}</span>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{role}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-2">
                  <p className="text-xs font-medium text-gray-500">Open Tasks</p>
                  {[['Inspect anchor points A1–A4', 'High', 'James R.'], ['Complete daily log', 'Medium', 'Sarah K.'], ['Upload site photos', 'Low', 'Tom W.']].map(([task, priority, assignee]) => (
                    <div key={task} className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded border-2 border-gray-200 shrink-0" />
                      <span className="text-xs text-gray-700 flex-1">{task}</span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${priority === 'High' ? 'bg-red-50 text-red-600' : priority === 'Medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-400'}`}>{priority}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6 lg:order-2">
                <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 text-sm font-semibold px-3 py-1.5 rounded-lg">
                  <Users className="h-4 w-4" /> Team & Tasks
                </div>
                <h3 className="text-3xl font-bold text-gray-900">Your crew, coordinated — even at 100 metres</h3>
                <p className="text-gray-500 leading-relaxed text-lg">Add technicians to jobs, assign tasks with priorities and due dates, and run safety checklists before any work begins. Everyone knows what they're doing, and the record is there to prove it.</p>
                <ul className="space-y-3">
                  {['Assign techs to specific jobs', 'Task priorities: high, medium, low', 'Pre-work safety checklists (DROPS, PPE, Rescue)', 'Contact manager directly from the job'].map(item => (
                    <li key={item} className="flex items-start gap-3 text-gray-700">
                      <ShieldCheck className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-semibold px-3 py-1.5 rounded-lg">
                  <Lock className="h-4 w-4" /> Compliance & Docs
                </div>
                <h3 className="text-3xl font-bold text-gray-900">Stop hunting for documents. Keep audits worry-free.</h3>
                <p className="text-gray-500 leading-relaxed text-lg">Attach risk assessments, method statements, IRATA certificates, and inspection reports directly to each job. Daily logs capture weather, crew count, and site conditions automatically — building your audit trail as you work.</p>
                <ul className="space-y-3">
                  {['Risk assessments & method statements per job', 'IRATA cert tracking per technician', 'Daily logs: weather, crew, site conditions', 'Photo evidence timestamped to the project'].map(item => (
                    <li key={item} className="flex items-start gap-3 text-gray-700">
                      <ShieldCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-slate-100 rounded-2xl p-6 space-y-3 border border-green-100">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-3">Project Documents</p>
                  <div className="space-y-2">
                    {[['Risk Assessment v2.pdf', 'PDF', '2.4 MB'], ['Method Statement.docx', 'DOC', '890 KB'], ['IRATA Certs — Team.pdf', 'PDF', '1.1 MB'], ['Rescue Plan — Site A.pdf', 'PDF', '640 KB']].map(([name, type, size]) => (
                      <div key={name} className="flex items-center gap-3 py-1.5">
                        <div className={`text-xs font-bold px-1.5 py-0.5 rounded ${type === 'PDF' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{type}</div>
                        <span className="text-sm text-gray-700 flex-1">{name}</span>
                        <span className="text-xs text-gray-400">{size}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-500">Daily Log — Today</p>
                    <span className="text-xs text-green-600 font-medium">Submitted</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-gray-50 rounded p-2"><p className="text-gray-400">Weather</p><p className="font-medium">Clear, 12°C</p></div>
                    <div className="bg-gray-50 rounded p-2"><p className="text-gray-400">Crew</p><p className="font-medium">4 techs</p></div>
                    <div className="bg-gray-50 rounded p-2"><p className="text-gray-400">Wind</p><p className="font-medium">8 mph</p></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-slate-900 py-24 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-white">Everything in one platform</h2>
            <p className="text-slate-400 max-w-xl mx-auto">No more spreadsheets, WhatsApp groups, or email chains. One tool your whole team can use from the ground or 200 feet up.</p>
          </div>
          <div className="grid grid-cols-1 gap-px bg-white/5 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl overflow-hidden">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-slate-900 p-6 space-y-3 hover:bg-slate-800 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why not fieldwire */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why not just use Fieldwire?</h2>
            <p className="text-gray-500 text-lg">Fieldwire is a great tool — for general construction. Rope access is different.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: Zap, title: 'Rope access job fields', desc: 'IRATA category, access type, max height, rigging details, anchor points — built in, not bolted on.' },
              { icon: ShieldCheck, title: 'Industry-specific checklists', desc: 'Pre-seeded safety checklists: DROPS Awareness, PPE Inspection, Rescue Plan Review. Ready to run on day one.' },
              { icon: Users, title: 'Tech-first mobile interface', desc: 'Technicians get a focused view of their assigned jobs and tasks. No clutter, no confusion at height.' },
              { icon: FileText, title: 'Built for small teams', desc: 'No per-seat enterprise pricing. Designed for 2–50 person rope access businesses, not 500-person contractors.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-6 rounded-2xl border border-gray-100 bg-gray-50 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl font-bold text-white">Ready to get your team organised?</h2>
          <p className="text-blue-100 text-lg">Join rope access contractors who've ditched the spreadsheets.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/login" className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-base">
              Get started free <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
            <span className="font-bold text-white">RopeAccess PM</span>
          </div>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} RopeAccess PM. Built for the rope access industry.</p>
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
            Sign in →
          </Link>
        </div>
      </footer>
    </div>
  )
}
