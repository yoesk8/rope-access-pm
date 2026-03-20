import Link from 'next/link'
import { Check, X, ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Basic',
    price: 'Free',
    period: 'forever',
    description: 'For sole traders and small crews just getting started.',
    highlight: false,
    cta: 'Get started free',
    features: [
      { text: 'Up to 3 team members', included: true },
      { text: '3 active jobs', included: true },
      { text: 'Task management', included: true },
      { text: 'Daily logs', included: true },
      { text: 'Basic timesheets', included: true },
      { text: 'Photo uploads', included: false },
      { text: 'Document control', included: false },
      { text: 'Checklists & forms', included: false },
      { text: 'Teams management', included: false },
      { text: 'Lead technician role', included: false },
      { text: 'Messaging', included: false },
    ],
  },
  {
    name: 'Field',
    price: '£29',
    period: 'per user / month',
    description: 'For active rope access teams running multiple jobs.',
    highlight: true,
    badge: 'Most popular',
    cta: 'Start 14-day trial',
    features: [
      { text: 'Unlimited team members', included: true },
      { text: 'Unlimited active jobs', included: true },
      { text: 'Task management + photos', included: true },
      { text: 'Daily logs', included: true },
      { text: 'Timesheets & approvals', included: true },
      { text: 'Photo uploads & gallery', included: true },
      { text: 'Document control', included: true },
      { text: 'Checklists & forms', included: true },
      { text: 'Teams management', included: false },
      { text: 'Lead technician role', included: false },
      { text: 'Messaging', included: true },
    ],
  },
  {
    name: 'Operations',
    price: '£49',
    period: 'per user / month',
    description: 'For companies managing multiple teams across many sites.',
    highlight: false,
    cta: 'Start 14-day trial',
    features: [
      { text: 'Unlimited team members', included: true },
      { text: 'Unlimited active jobs', included: true },
      { text: 'Task management + photos', included: true },
      { text: 'Daily logs', included: true },
      { text: 'Timesheets & approvals', included: true },
      { text: 'Photo uploads & gallery', included: true },
      { text: 'Document control', included: true },
      { text: 'Checklists & forms', included: true },
      { text: 'Teams management', included: true },
      { text: 'Lead technician role', included: true },
      { text: 'Messaging', included: true },
    ],
  },
]

const faqs = [
  {
    q: 'Can I change plans later?',
    a: 'Yes. Upgrade or downgrade at any time — changes take effect at the start of your next billing cycle.',
  },
  {
    q: 'What counts as a "user"?',
    a: "Any team member with an active account — admin, manager, lead technician, or technician. Deactivated accounts don't count toward your limit.",
  },
  {
    q: 'Is there a free trial?',
    a: 'Field and Operations plans come with a 14-day free trial. No credit card required.',
  },
  {
    q: 'Do you offer annual billing?',
    a: 'Yes — pay annually and get 2 months free (equivalent to a 17% discount).',
  },
  {
    q: 'Is my data secure?',
    a: "All data is encrypted at rest and in transit. We use Supabase (built on AWS) with row-level security so each organisation's data is fully isolated.",
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg text-gray-900">Rope Access PM</Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-6 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          Built for rope access teams of all sizes. Start free, upgrade when you're ready.
        </p>
      </section>

      {/* Plans */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={cn(
                'relative rounded-2xl border bg-white p-8 flex flex-col',
                plan.highlight ? 'border-gray-900 shadow-lg ring-1 ring-gray-900' : 'border-gray-200'
              )}
            >
              {plan.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{plan.name}</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-gray-400 mb-1 ml-1">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{plan.description}</p>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map(f => (
                  <li key={f.text} className="flex items-start gap-2.5 text-sm">
                    {f.included ? (
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
                    )}
                    <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors',
                  plan.highlight
                    ? 'bg-gray-900 text-white hover:bg-gray-700'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                )}
              >
                {plan.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          All prices exclude VAT. Annual billing available — <span className="font-medium text-gray-600">save 17%</span>.
        </p>
      </section>

      {/* Feature comparison note */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto rounded-2xl bg-orange-50 border border-orange-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Need something specific for IRATA compliance?</h2>
          <p className="text-gray-600 text-sm mb-4">
            We can work with your company to add custom checklist templates, IRATA-level tracking, and bespoke reporting. Get in touch to discuss enterprise options.
          </p>
          <a
            href="mailto:hello@ropeaccesspm.com"
            className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700 hover:underline"
          >
            Contact us <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-6">
            {faqs.map(faq => (
              <div key={faq.q} className="border-b pb-6 last:border-0">
                <p className="font-semibold text-gray-900 mb-2">{faq.q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8 px-6 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Rope Access PM · <Link href="/" className="hover:text-gray-600">Home</Link></p>
      </footer>
    </div>
  )
}
