import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY  // service key bypasses RLS for server writes
  )

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { cake, depositAmount, pickupDate, customer } = body

  if (!cake || !depositAmount || !pickupDate || !customer?.email) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
  }

  // 1. Create the order in Supabase first (status: pending_payment)
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      cake_id:       cake.id,
      cake_title:    cake.title,
      cake_image:    cake.image_url || null,
      cake_price:    cake.price,
      deposit_amount: depositAmount,
      pickup_date:   pickupDate,
      customer_name:  customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone || null,
      notes:          customer.notes || null,
      status:         'pending_payment',
    })
    .select()
    .single()

  if (orderErr) {
    return new Response(JSON.stringify({ error: orderErr.message }), { status: 500 })
  }

  // 2. Create Stripe Checkout session
  const siteUrl = process.env.URL || 'http://localhost:5173'
  let session
  try {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customer.email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${cake.title} — Cake Deposit`,
            description: `Pickup: ${new Date(pickupDate + 'T12:00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })} · ${cake.deposit_percent || 30}% deposit`,
          },
          unit_amount: Math.round(depositAmount * 100), // Stripe uses cents
        },
        quantity: 1,
      }],
      metadata: {
        order_id:    order.id,
        pickup_date: pickupDate,
      },
      success_url: `${siteUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl}/cakes/${cake.id}`,
    })
  } catch (stripeErr) {
    // Clean up the order if Stripe fails
    await supabase.from('orders').delete().eq('id', order.id)
    return new Response(JSON.stringify({ error: stripeErr.message }), { status: 500 })
  }

  // 3. Store session ID on the order so we can look it up later
  await supabase
    .from('orders')
    .update({ stripe_session_id: session.id })
    .eq('id', order.id)

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
