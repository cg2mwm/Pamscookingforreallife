import { createClient } from '@supabase/supabase-js'

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let body
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { amount, cakeTitle, depositPercent } = body
  if (!amount) {
    return new Response(JSON.stringify({ error: 'Missing amount' }), { status: 400 })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

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

  const isProd  = process.env.PAYPAL_ENV === 'live'
  const baseUrl = isProd ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

  // Get access token
  const tokenRes  = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${paypalClientId}:${paypalClientSecret}`),
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const tokenData = await tokenRes.json()
  if (!tokenRes.ok) {
    return new Response(JSON.stringify({ error: 'PayPal auth failed' }), { status: 500 })
  }

  // Create PayPal order
  const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        description: `${cakeTitle} — ${depositPercent || 30}% deposit`,
        amount: {
          currency_code: 'USD',
          value: Number(amount).toFixed(2),
        },
      }],
    }),
  })
  const orderData = await orderRes.json()
  if (!orderRes.ok) {
    return new Response(JSON.stringify({ error: orderData.message || 'Order creation failed' }), { status: 500 })
  }

  return new Response(JSON.stringify({ id: orderData.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
