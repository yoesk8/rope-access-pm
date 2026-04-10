import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { stripe } from '@/lib/stripe'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; plan?: string }>
}) {
  const { session_id, plan } = await searchParams
  if (!session_id || !plan) redirect('/dashboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify the checkout session with Stripe
  const session = await stripe.checkout.sessions.retrieve(session_id)

  if (session.payment_status === 'paid' || session.status === 'complete') {
    await supabase.from('profiles').update({
      plan,
      stripe_subscription_id: session.subscription as string,
      subscription_status: 'active',
    }).eq('id', user.id)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-5">
        <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">You're all set!</h1>
        <p className="text-gray-500">
          Your <span className="font-semibold capitalize">{plan}</span> plan is now active.
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
