'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const plans = [
  {
    value: 'basic',
    name: 'Basic',
    price: 'Free',
    description: 'Up to 3 team members & 3 active jobs.',
  },
  {
    value: 'field',
    name: 'Field',
    price: '£29 / user / mo',
    description: 'Unlimited jobs, photos, documents & messaging.',
    highlight: true,
    badge: 'Most popular',
  },
  {
    value: 'operations',
    name: 'Operations',
    price: '£49 / user / mo',
    description: 'Everything in Field + teams management & lead tech role.',
  },
]

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPlan = searchParams.get('plan') ?? 'basic'

  const [plan, setPlan] = useState(initialPlan)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: 'owner', plan },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // If session returned immediately (email confirm disabled), also set plan on profile
    if (data.session && data.user) {
      await supabase.from('profiles').update({ plan, role: 'owner', full_name: fullName }).eq('id', data.user.id)

      if (plan === 'field' || plan === 'operations') {
        // Redirect to Stripe Checkout for paid plans
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan }),
        })
        const { url, error: checkoutError } = await res.json()
        if (checkoutError || !url) {
          setError('Failed to start checkout. Please try again.')
          setLoading(false)
          return
        }
        window.location.href = url
        return
      }

      router.push('/dashboard')
      router.refresh()
    } else {
      // Email confirmation required
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
          <p className="text-gray-500">
            We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/login" className="inline-block text-sm text-gray-600 hover:text-gray-900 underline">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="border-b bg-white px-4 h-14 flex items-center justify-between max-w-3xl mx-auto">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
        <span className="font-semibold text-gray-900">Rope Access PM</span>
        <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          Sign in
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500">Choose a plan, then fill in your details.</p>
        </div>

        {/* Plan picker */}
        <div className="grid gap-3 sm:grid-cols-3">
          {plans.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPlan(p.value)}
              className={cn(
                'relative text-left rounded-xl border p-4 transition-all',
                plan === p.value
                  ? 'border-gray-900 ring-2 ring-gray-900 bg-white'
                  : 'border-gray-200 bg-white hover:border-gray-400'
              )}
            >
              {p.badge && (
                <span className="absolute -top-3 left-3 rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
                  {p.badge}
                </span>
              )}
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-semibold text-gray-900">{p.name}</span>
                {plan === p.value && (
                  <span className="h-4 w-4 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-gray-500 mb-1">{p.price}</p>
              <p className="text-xs text-gray-400">{p.description}</p>
            </button>
          ))}
        </div>

        {/* Sign-up form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-5">
          <h2 className="font-semibold text-gray-900">Your details</h2>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Full name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Work email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating account…' : `Create account — ${plans.find(p => p.value === plan)?.name} plan`}
            </button>

            <p className="text-center text-xs text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-gray-700 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
