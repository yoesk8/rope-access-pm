import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

export const PRICE_IDS: Record<string, string> = {
  field:      process.env.STRIPE_FIELD_PRICE_ID      ?? '',
  operations: process.env.STRIPE_OPERATIONS_PRICE_ID ?? '',
}
