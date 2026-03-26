import { createClient } from '@supabase/supabase-js'

export default async function handler(req) {
  const url        = new URL(req.url)
  const sessionId  = url.searchParams.get('session_id')

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Missing session_id' }), { status: 400 })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('stripe_session_id', sessionId)
    .single()

  if (error || !order) {
    return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 })
  }

  return new Response(JSON.stringify({ order }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
