import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import './OrderSuccess.css'

export default function OrderSuccess() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [status, setStatus] = useState('checking') // checking | paid | failed
  const [order, setOrder] = useState(null)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    if (!sessionId) { setStatus('failed'); return }

    // Poll the get-order function until status is 'paid'
    // Stripe webhook can take a few seconds to fire after redirect
    const check = async () => {
      try {
        const res  = await fetch(`/.netlify/functions/get-order?session_id=${sessionId}`)
        const data = await res.json()

        if (!res.ok) {
          setAttempts(a => a + 1)
          return
        }

        if (data.order?.status === 'paid' || data.order?.status === 'confirmed' || data.order?.status === 'completed') {
          setOrder(data.order)
          setStatus('paid')
        } else {
          // Still pending — keep polling
          setAttempts(a => a + 1)
        }
      } catch {
        setAttempts(a => a + 1)
      }
    }

    // Give up after ~30 seconds (10 attempts × 3s)
    if (attempts >= 10) {
      setStatus('failed')
      return
    }

    const timer = setTimeout(check, attempts === 0 ? 1000 : 3000)
    return () => clearTimeout(timer)
  }, [sessionId, attempts])

  const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })

  // ── Checking screen ──
  if (status === 'checking') return (
    <div>
      <div className="page-header"><div className="container"><h1>Confirming Payment…</h1></div></div>
      <section className="section">
        <div className="container success-wrap">
          <div className="checking-spinner" />
          <h2>Verifying your payment</h2>
          <p>Please wait a moment while we confirm your deposit with Stripe.</p>
          <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginTop:'0.5rem' }}>
            Do not refresh this page.
          </p>
        </div>
      </section>
    </div>
  )

  // ── Failed screen ──
  if (status === 'failed') return (
    <div>
      <div className="page-header"><div className="container"><h1>Something Went Wrong</h1></div></div>
      <section className="section">
        <div className="container success-wrap">
          <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>⚠️</div>
          <h2>We couldn't confirm your payment</h2>
          <p>This can happen if payment didn't complete, or if there was a connection issue.</p>
          <p style={{ marginTop:'0.75rem' }}>
            If your card was charged, please contact us and we'll sort it out right away.
          </p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', marginTop:'1.5rem', flexWrap:'wrap' }}>
            <Link to="/cakes" className="btn btn-outline">← Back to Cakes</Link>
            <Link to="/booking" className="btn btn-sage">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  )

  // ── Success screen ──
  return (
    <div>
      <div className="page-header page-header--success">
        <div className="container"><h1>Payment Confirmed! 🎂</h1></div>
      </div>
      <section className="section">
        <div className="container success-wrap">
          <div className="success-icon">🎉</div>
          <h2>Your order is confirmed, {order.customer_name.split(' ')[0]}!</h2>
          <p style={{ marginBottom:'1.5rem' }}>Your deposit has been received and your pickup date is locked in.</p>

          <div className="order-receipt">
            {order.cake_image && (
              <img src={order.cake_image} alt={order.cake_title} className="receipt-cake-img" />
            )}
            <div className="receipt-details">
              <div className="receipt-row">
                <span>Cake</span>
                <strong>{order.cake_title}</strong>
              </div>
              <div className="receipt-row">
                <span>Pickup Date</span>
                <strong>{fmtDate(order.pickup_date)}</strong>
              </div>
              <div className="receipt-row">
                <span>Your Name</span>
                <strong>{order.customer_name}</strong>
              </div>
              <div className="receipt-row">
                <span>Email</span>
                <strong>{order.customer_email}</strong>
              </div>
              {order.customer_phone && (
                <div className="receipt-row">
                  <span>Phone</span>
                  <strong>{order.customer_phone}</strong>
                </div>
              )}
              <div className="receipt-row receipt-row--total">
                <span>Deposit Paid</span>
                <strong>${Number(order.deposit_amount).toFixed(2)} ✓</strong>
              </div>
              <div className="receipt-row">
                <span>Remaining Balance</span>
                <strong>${(Number(order.cake_price) - Number(order.deposit_amount)).toFixed(2)} due at pickup</strong>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="receipt-notes">
              <strong>Your notes:</strong> {order.notes}
            </div>
          )}

          <p className="receipt-confirmation-note">
            A confirmation email has been sent to <strong>{order.customer_email}</strong>. 
            We'll be in touch to finalize the details for your {order.cake_title}!
          </p>

          <Link to="/cakes" className="btn btn-outline" style={{ marginTop:'1.5rem' }}>
            ← Browse More Cakes
          </Link>
        </div>
      </section>
    </div>
  )
}
