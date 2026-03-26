import { createClient } from '@supabase/supabase-js'

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  let body
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { paypalOrderId, orderId, pickupDate } = body
  if (!paypalOrderId || !orderId || !pickupDate) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
  }

  // ── Keys come ONLY from Netlify environment variables ──────
  const clientId     = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const isProd       = process.env.PAYPAL_ENV === 'live'
  const baseUrl      = isProd ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: 'PayPal environment variables not set in Netlify' }), { status: 500 })
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // Get access token
  const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const tokenData = await tokenRes.json()
  if (!tokenRes.ok) {
    return new Response(JSON.stringify({ error: 'PayPal auth failed: ' + (tokenData.error_description || JSON.stringify(tokenData)) }), { status: 500 })
  }

  // Capture the payment
  const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Content-Type':  'application/json',
    },
  })
  const captureData = await captureRes.json()
  if (!captureRes.ok || captureData.status !== 'COMPLETED') {
    return new Response(JSON.stringify({ error: 'Payment not completed: ' + (captureData.message || captureData.status) }), { status: 400 })
  }

  // ── Payment confirmed — now book the date and mark order paid ──
  await supabase.from('availability').update({ booked: true }).eq('date', pickupDate).eq('type', 'pickup')
  await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId)

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
