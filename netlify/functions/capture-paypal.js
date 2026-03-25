import { createClient } from '@supabase/supabase-js'

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let body
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { paypalOrderId, orderId, pickupDate } = body
  if (!paypalOrderId || !orderId || !pickupDate) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  // ── Get PayPal credentials from Supabase settings ──────────
  const { data: paymentSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'payments')
    .single()

  const paypalClientId     = process.env.PAYPAL_CLIENT_ID     || paymentSetting?.value?.paypal_client_id
  const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET || paymentSetting?.value?.paypal_client_secret

  if (!paypalClientId || !paypalClientSecret) {
    return new Response(JSON.stringify({ error: 'PayPal not configured' }), { status: 500 })
  }

  // ── Get PayPal access token ────────────────────────────────
  const isLive    = !paypalClientId.startsWith('AY') // sandbox IDs start with AY usually — actually check env
  const isProd    = process.env.PAYPAL_ENV === 'live'
  const baseUrl   = isProd
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

  let accessToken
  try {
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${paypalClientId}:${paypalClientSecret}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Token error')
    accessToken = tokenData.access_token
  } catch (err) {
    return new Response(JSON.stringify({ error: 'PayPal auth failed: ' + err.message }), { status: 500 })
  }

  // ── Capture the PayPal order ───────────────────────────────
  let captureData
  try {
    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  'application/json',
      },
    })
    captureData = await captureRes.json()
    if (!captureRes.ok) throw new Error(captureData.message || 'Capture failed')
    if (captureData.status !== 'COMPLETED') throw new Error('Payment not completed: ' + captureData.status)
  } catch (err) {
    return new Response(JSON.stringify({ error: 'PayPal capture failed: ' + err.message }), { status: 400 })
  }

  // ── Payment confirmed! Now book the date and mark order paid ──
  await supabase
    .from('availability')
    .update({ booked: true })
    .eq('date', pickupDate)
    .eq('type', 'pickup')

  await supabase
    .from('orders')
    .update({ status: 'paid' })
    .eq('id', orderId)

  return new Response(JSON.stringify({ success: true, captureId: captureData.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
