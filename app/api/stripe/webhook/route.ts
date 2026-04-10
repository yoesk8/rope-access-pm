import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId  = session.metadata?.supabase_user_id
      const plan    = session.metadata?.plan
      if (userId && plan) {
        await supabase.from('profiles').update({
          plan,
          stripe_subscription_id: session.subscription as string,
          subscription_status: 'active',
        }).eq('id', userId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub      = event.data.object as Stripe.Subscription
      const userId   = sub.metadata?.supabase_user_id
      const status   = sub.status // active, past_due, canceled, etc.
      if (userId) {
        await supabase.from('profiles').update({
          subscription_status: status,
          // If cancelled/past_due, downgrade to basic
          ...(status === 'canceled' || status === 'unpaid' ? { plan: 'basic', stripe_subscription_id: null } : {}),
        }).eq('id', userId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub    = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (userId) {
        await supabase.from('profiles').update({
          plan: 'basic',
          stripe_subscription_id: null,
          subscription_status: 'cancelled',
        }).eq('id', userId)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice    = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      await supabase.from('profiles').update({
        subscription_status: 'past_due',
      }).eq('stripe_customer_id', customerId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
