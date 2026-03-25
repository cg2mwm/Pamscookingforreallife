import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  // Read raw body for Stripe signature verification
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // Only handle successful payments
  if (event.type === 'checkout.session.completed') {
    const session    = event.data.object
    const orderId    = session.metadata?.order_id
    const pickupDate = session.metadata?.pickup_date

    if (!orderId) {
      return new Response('Missing order_id in metadata', { status: 400 })
    }

    // ── Mark the order as PAID ──────────────────────────────
    const { error: orderErr } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId)

    if (orderErr) {
      console.error('Failed to update order:', orderErr)
      return new Response('DB error updating order', { status: 500 })
    }

    // ── Mark the pickup date as BOOKED in availability ──────
    // This blocks that date from being chosen by future customers
    if (pickupDate) {
      await supabase
        .from('availability')
        .update({ booked: true })
        .eq('date', pickupDate)
    }

    console.log(`✅ Order ${orderId} paid. Date ${pickupDate} marked booked.`)
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
