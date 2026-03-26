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

  // ── Detailed env check ─────────────────────────────────────
  if (!clientId) return new Response(JSON.stringify({ error: 'PAYPAL_CLIENT_ID is not set in Netlify environment variables' }), { status: 500 })
  if (!clientSecret) return new Response(JSON.stringify({ error: 'PAYPAL_CLIENT_SECRET is not set in Netlify environment variables' }), { status: 500 })

  console.log('PayPal env:', isProd ? 'LIVE' : 'SANDBOX')
  console.log('Client ID starts with:', clientId.substring(0, 6))
  console.log('Base URL:', baseUrl)

  // Get access token
  let tokenData
  try {
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })
    tokenData = await tokenRes.json()
    console.log('Token response status:', tokenRes.status)
    console.log('Token response:', JSON.stringify(tokenData))
    if (!tokenRes.ok) {
      return new Response(JSON.stringify({
        error: 'PayPal auth failed',
        details: tokenData.error_description || tokenData.error || JSON.stringify(tokenData)
      }), { status: 500 })
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Network error reaching PayPal: ' + err.message }), { status: 500 })
  }

  // Create PayPal order
  let orderData
  try {
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
          amount: { currency_code: 'USD', value: Number(amount).toFixed(2) },
        }],
      }),
    })
    orderData = await orderRes.json()
    console.log('Order response status:', orderRes.status)
    if (!orderRes.ok) {
      return new Response(JSON.stringify({
        error: 'PayPal order creation failed',
        details: orderData.message || JSON.stringify(orderData)
      }), { status: 500 })
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Network error creating order: ' + err.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ id: orderData.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
