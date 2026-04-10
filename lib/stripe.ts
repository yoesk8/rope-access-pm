import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

export const PRICE_IDS: Record<string, string> = {
  field:      process.env.STRIPE_FIELD_PRICE_ID      ?? '',
  operations: process.env.STRIPE_OPERATIONS_PRICE_ID ?? '',
}
