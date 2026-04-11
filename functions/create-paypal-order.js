export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  let body
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }
  const { amount, cakeTitle, depositPercent } = body
  if (!amount) return new Response(JSON.stringify({ error: 'Missing amount' }), { status: 400 })

  const clientId     = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const isProd       = process.env.PAYPAL_ENV === 'live'
  const baseUrl      = isProd ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

  if (!clientId)     return new Response(JSON.stringify({ error: 'PAYPAL_CLIENT_ID not set' }), { status: 500 })
  if (!clientSecret) return new Response(JSON.stringify({ error: 'PAYPAL_CLIENT_SECRET not set' }), { status: 500 })

  const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const tokenData = await tokenRes.json()
  if (!tokenRes.ok) return new Response(JSON.stringify({ error: 'PayPal auth failed', details: tokenData.error_description || JSON.stringify(tokenData) }), { status: 500 })

  const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        description: `${cakeTitle} — ${depositPercent || 30}% deposit`,
        amount: { currency_code: 'USD', value: Number(amount).toFixed(2) },
      }],
    }),
  })
  const orderData = await orderRes.json()
  if (!orderRes.ok) return new Response(JSON.stringify({ error: orderData.message || 'Order creation failed' }), { status: 500 })

  return new Response(JSON.stringify({ id: orderData.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
