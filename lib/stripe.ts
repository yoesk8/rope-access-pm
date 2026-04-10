import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-03-25.dahlia',
    })
  }
  return _stripe
}

export const PRICE_IDS: Record<string, string> = {
  field:      process.env.STRIPE_FIELD_PRICE_ID      ?? '',
  operations: process.env.STRIPE_OPERATIONS_PRICE_ID ?? '',
}
