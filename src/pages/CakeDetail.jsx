import { useState, useEffect, useRef } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { marked } from 'marked'
import { getCake, getAvailability, placeOrder, getSetting } from '../supabase'
import './CakeDetail.css'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa']

// ── Pickup-date-only calendar ──────────────────────────────────
function PickupCalendar({ selected, onSelect, availableDates }) {
  const today   = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const availSet = new Set(availableDates.map(a => a.date))

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push({ d, ds, isAvail: new Date(ds) > new Date(today.toDateString()) && availSet.has(ds) })
  }

  const prev = () => { if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }
  const next = () => { if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }

  return (
    <div className="pickup-cal">
      <div className="pickup-cal__header">
        <button onClick={prev} className="cal-nav-btn">‹</button>
        <span>{MONTHS[month]} {year}</span>
        <button onClick={next} className="cal-nav-btn">›</button>
      </div>
      <div className="pickup-cal__grid">
        {DAYS.map(d => <div key={d} className="pickup-cal__dayname">{d}</div>)}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e${i}`} className="pickup-cal__cell pickup-cal__cell--empty" />
          return (
            <button key={cell.ds} disabled={!cell.isAvail}
              onClick={() => onSelect(cell.ds)}
              className={`pickup-cal__cell ${cell.isAvail ? 'pickup-cal__cell--avail' : 'pickup-cal__cell--disabled'} ${selected === cell.ds ? 'pickup-cal__cell--selected' : ''}`}
            >
              <span className="pickup-cal__num">{cell.d}</span>
              {cell.isAvail && <span className="pickup-cal__dot" />}
            </button>
          )
        })}
      </div>
      <div className="pickup-cal__legend">
        <span><span className="leg-dot leg-avail" /> Available</span>
        <span><span className="leg-dot leg-selected" /> Your pick</span>
      </div>
    </div>
  )
}

// ── PayPal button component ────────────────────────────────────
function PayPalButton({ amount, cakeTitle, depositPercent, clientId, onSuccess, onError }) {
  const containerRef = useRef(null)
  const renderedRef  = useRef(false)

  useEffect(() => {
    if (!clientId || !amount || renderedRef.current) return

    // Load PayPal SDK script dynamically with Pam's client ID
    const existingScript = document.getElementById('paypal-sdk')
    if (existingScript) existingScript.remove()

    const script = document.createElement('script')
    script.id  = 'paypal-sdk'
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`
    script.async = true

    script.onload = () => {
      if (!containerRef.current || renderedRef.current) return
      renderedRef.current = true

      window.paypal.Buttons({
        style: {
          layout:  'vertical',
          color:   'gold',
          shape:   'rect',
          label:   'pay',
          height:  48,
        },
        // Step 1: Create the PayPal order on our server
        createOrder: async () => {
          const res  = await fetch('/.netlify/functions/create-paypal-order', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ amount, cakeTitle, depositPercent }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Failed to create order')
          return data.id
        },
        // Step 2: Capture on our server — this is where date gets booked
        onApprove: async (data) => {
          onSuccess(data.orderID)
        },
        onError: (err) => {
          onError('PayPal encountered an error. Please try again.')
        },
        onCancel: () => {
          onError('Payment was cancelled. Your date has not been reserved yet.')
        },
      }).render(containerRef.current)
    }

    script.onerror = () => onError('Failed to load PayPal. Please refresh and try again.')
    document.head.appendChild(script)

    return () => { renderedRef.current = false }
  }, [clientId, amount])

  if (!clientId) return (
    <div className="submit-error">
      ⚠️ PayPal is not configured yet. Pam needs to add her PayPal credentials in the admin.
    </div>
  )

  return <div ref={containerRef} className="paypal-btn-container" />
}

// ── Main page ──────────────────────────────────────────────────
export default function CakeDetail() {
  const { id } = useParams()
  const [cake, setCake]           = useState(null)
  const [pickupDates, setPickupDates] = useState([])
  const [paypalClientId, setPaypalClientId] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)
  const [activeImg, setActiveImg] = useState(0)

  const [step, setStep]             = useState('details')
  const [pickupDate, setPickupDate] = useState('')
  const [form, setForm]             = useState({ name:'', email:'', phone:'', notes:'' })
  const [payError, setPayError]     = useState('')
  const [capturing, setCapturing]   = useState(false)
  const [orderDone, setOrderDone]   = useState(false)
  const [placedOrder, setPlacedOrder] = useState(null)

  useEffect(() => {
    getCake(id).then(c => { if (!c) setNotFound(true); else setCake(c); setLoading(false) })
    getAvailability('pickup').then(all => setPickupDates(all.filter(a => !a.booked)))
    getSetting('payments').then(p => { if (p?.paypal_client_id) setPaypalClientId(p.paypal_client_id) })
  }, [id])

  if (loading)  return <p className="loading">Loading…</p>
  if (notFound) return <Navigate to="/cakes" replace />

  const depositAmt = ((cake.price * (cake.deposit_percent || 30)) / 100).toFixed(2)
  const allImages  = [cake.image_url, ...(cake.gallery || [])].filter(Boolean)
  const html       = cake.body ? marked.parse(cake.body) : ''
  const fmtDate    = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
  const stepIndex  = ['details','date','confirm'].indexOf(step)
  const stepLabels = ['Your Info', 'Pickup Date', 'Pay Deposit']

  // Called after customer approves in PayPal popup
  const handlePayPalSuccess = async (paypalOrderId) => {
    setCapturing(true)
    setPayError('')
    try {
      // First create the order record in our DB
      const order = await placeOrder({
        cake_id:        cake.id,
        cake_title:     cake.title,
        cake_image:     cake.image_url,
        cake_price:     cake.price,
        deposit_amount: parseFloat(depositAmt),
        pickup_date:    pickupDate,
        customer_name:  form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        notes:          form.notes,
        status:         'pending_payment',
      })

      // Capture payment on server — this books the date ONLY if capture succeeds
      const res = await fetch('/.netlify/functions/capture-paypal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          paypalOrderId,
          orderId:    order.id,
          pickupDate,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Capture failed')

      // Only reach here if payment was 100% successful
      setPlacedOrder(order)
      setOrderDone(true)
    } catch(err) {
      setPayError('Payment failed: ' + err.message + '. You have not been charged. Please try again.')
    }
    setCapturing(false)
  }

  // ── Order confirmed screen ──
  if (orderDone) return (
    <div>
      <div className="page-header page-header--short">
        <div className="container"><h1>Order Confirmed! 🎂</h1></div>
      </div>
      <section className="section">
        <div className="container order-success">
          <div className="order-success__icon">🎉</div>
          <h2>Thank you, {form.name}!</h2>
          <div className="order-success__details">
            <div><span>Cake</span><strong>{cake.title}</strong></div>
            <div><span>Pickup Date</span><strong>{fmtDate(pickupDate)}</strong></div>
            <div><span>Deposit Paid</span><strong>${depositAmt} ✓</strong></div>
            <div><span>Remaining at Pickup</span><strong>${(cake.price - parseFloat(depositAmt)).toFixed(2)}</strong></div>
          </div>
          <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', marginTop:'1rem', lineHeight:1.6 }}>
            Your pickup date is confirmed and reserved. We'll reach out at <strong>{form.email}</strong> to finalize the details!
          </p>
          <Link to="/cakes" className="btn btn-outline" style={{ marginTop:'1.5rem' }}>← Browse More Cakes</Link>
        </div>
      </section>
    </div>
  )

  return (
    <div>
      <div className="page-header page-header--short">
        <div className="container">
          <Link to="/cakes" className="back-link">← Back to Cakes</Link>
          <h1>{cake.title}</h1>
          <span className="badge badge-sage">{cake.category}</span>
        </div>
      </div>

      <section className="section">
        <div className="container cake-detail">

          {/* Gallery */}
          <div className="cake-gallery">
            <div className="cake-gallery__main">
              {allImages[activeImg]
                ? <img src={allImages[activeImg]} alt={cake.title} />
                : <div className="img-placeholder" style={{ aspectRatio:'4/3', fontSize:'5rem' }}>🎂</div>}
            </div>
            {allImages.length > 1 && (
              <div className="cake-gallery__thumbs">
                {allImages.map((img, i) => (
                  <button key={i} className={`thumb ${i===activeImg?'active':''}`} onClick={()=>setActiveImg(i)}>
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Order Panel */}
          <div className="cake-info">
            <div className="cake-info__price-row">
              <span className="cake-info__price">${Number(cake.price).toLocaleString()}</span>
              {cake.featured && <span className="badge badge-brown">Featured</span>}
            </div>
            <p style={{ marginBottom:'1rem', lineHeight:1.75 }}>{cake.description}</p>
            {cake.servings && <p style={{ fontSize:'0.88rem', color:'var(--text-muted)', marginBottom:'0.5rem' }}>🍽 Serves {cake.servings}</p>}
            {cake.allergens?.length > 0 && (
              <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginBottom:'0.75rem', alignItems:'center' }}>
                <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Contains:</span>
                {cake.allergens.map(a => <span key={a} className="badge badge-sage">{a}</span>)}
              </div>
            )}
            <div className="divider" />

            {cake.available ? (
              <div className="order-flow">
                {/* Step indicators */}
                <div className="order-steps">
                  {['details','date','confirm'].map((s, i) => (
                    <div key={s} style={{ display:'flex', alignItems:'center', gap:'0.2rem' }}>
                      <div className={`order-step-tab ${s===step?'active':''} ${i<stepIndex?'done':''}`}>
                        <span>{i<stepIndex?'✓':i+1}</span>{stepLabels[i]}
                      </div>
                      {i < 2 && <div className="order-step-arrow">›</div>}
                    </div>
                  ))}
                </div>

                {/* Step 1: Contact info */}
                {step==='details' && (
                  <div className="order-panel">
                    <h4>Your Contact Info</h4>
                    <div className="form-field"><label>Full Name *</label>
                      <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Jane Smith" />
                    </div>
                    <div className="form-field"><label>Email *</label>
                      <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="jane@email.com" />
                    </div>
                    <div className="form-field"><label>Phone (optional)</label>
                      <input type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
                    </div>
                    <div className="form-field"><label>Special requests / notes</label>
                      <textarea rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Colors, flavors, decorations…" />
                    </div>
                    <button className="btn btn-sage btn-full"
                      onClick={()=>{ if(!form.name||!form.email) return alert('Please enter your name and email.'); setStep('date') }}>
                      Next: Pick Pickup Date →
                    </button>
                  </div>
                )}

                {/* Step 2: Pickup date */}
                {step==='date' && (
                  <div className="order-panel">
                    <h4>Choose Your Pickup Date</h4>
                    <div className="pickup-type-badge">🎂 Cake Pickup Dates Only</div>
                    {pickupDates.length === 0
                      ? <p style={{ color:'var(--text-muted)', fontStyle:'italic', textAlign:'center', padding:'1.5rem 0' }}>
                          No pickup dates available right now. <Link to="/booking" style={{ color:'var(--sage)' }}>Contact us</Link> to arrange one.
                        </p>
                      : <>
                          <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:'1rem' }}>
                            Green dots = available. Date is only held after payment is complete.
                          </p>
                          <PickupCalendar selected={pickupDate} onSelect={setPickupDate} availableDates={pickupDates} />
                          {pickupDate && <div className="selected-date">✓ {fmtDate(pickupDate)}</div>}
                        </>
                    }
                    <div style={{ display:'flex', gap:'0.75rem', marginTop:'1rem' }}>
                      <button className="btn btn-outline" onClick={()=>setStep('details')}>← Back</button>
                      <button className="btn btn-sage btn-full" disabled={!pickupDate} onClick={()=>{ setPayError(''); setStep('confirm') }}>
                        Next: Review & Pay →
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: PayPal payment */}
                {step==='confirm' && (
                  <div className="order-panel">
                    <h4>Review & Pay Deposit</h4>
                    <div className="order-review">
                      <div><span>Cake</span><strong>{cake.title}</strong></div>
                      <div><span>Pickup Date</span><strong>{fmtDate(pickupDate)}</strong></div>
                      <div><span>Name</span><strong>{form.name}</strong></div>
                      <div><span>Email</span><strong>{form.email}</strong></div>
                      <div className="order-review__total">
                        <span>Deposit ({cake.deposit_percent||30}%)</span>
                        <strong>${depositAmt}</strong>
                      </div>
                    </div>

                    <div className="paypal-note">
                      🔒 Pay securely with PayPal. Your pickup date is <strong>only reserved after payment completes</strong>.
                    </div>

                    {payError && <div className="submit-error">{payError}</div>}

                    {capturing ? (
                      <div className="capturing-msg">
                        <span className="btn-spinner" /> Confirming your payment and reserving your date…
                      </div>
                    ) : (
                      <PayPalButton
                        amount={depositAmt}
                        cakeTitle={cake.title}
                        depositPercent={cake.deposit_percent}
                        clientId={paypalClientId}
                        onSuccess={handlePayPalSuccess}
                        onError={msg => setPayError(msg)}
                      />
                    )}

                    {!capturing && (
                      <button className="btn btn-outline btn-sm" style={{ marginTop:'0.75rem' }} onClick={()=>setStep('date')}>
                        ← Change Date
                      </button>
                    )}
                    <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.75rem', textAlign:'center' }}>
                      This date stays open for everyone until your payment goes through.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color:'var(--text-muted)', fontStyle:'italic', marginTop:'1rem' }}>This cake is currently unavailable.</p>
            )}
          </div>
        </div>

        {html && (
          <div className="container" style={{ marginTop:'3rem' }}>
            <div className="divider" style={{ marginBottom:'2rem' }} />
            <div className="prose" style={{ maxWidth:'700px' }} dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        )}
      </section>
    </div>
  )
}
