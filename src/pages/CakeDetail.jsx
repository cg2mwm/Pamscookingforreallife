import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { marked } from 'marked'
import { getCake, getSetting, getAvailability, placeOrder, buildPaymentLink } from '../supabase'
import './CakeDetail.css'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

function PickupCalendar({ selected, onSelect, availableDates }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  // Build a quick lookup: "2026-04-15" -> true
  const availSet = new Set(availableDates.map(a => a.date))

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const isPast = new Date(dateStr) <= new Date(today.toDateString())
    const isAvail = !isPast && availSet.has(dateStr)
    cells.push({ d, dateStr, isPast, isAvail })
  }

  const prev = () => { if (month === 0) { setYear(y=>y-1); setMonth(11) } else setMonth(m=>m-1) }
  const next = () => { if (month === 11) { setYear(y=>y+1); setMonth(0) } else setMonth(m=>m+1) }

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
          const isSelected = selected === cell.dateStr
          return (
            <button
              key={cell.dateStr}
              disabled={!cell.isAvail}
              onClick={() => onSelect(cell.dateStr)}
              className={`pickup-cal__cell ${cell.isAvail ? 'pickup-cal__cell--avail' : 'pickup-cal__cell--disabled'} ${isSelected ? 'pickup-cal__cell--selected' : ''}`}
              title={cell.isAvail ? 'Available for pickup' : ''}
            >
              <span className="pickup-cal__num">{cell.d}</span>
              {cell.isAvail && <span className="pickup-cal__dot" />}
            </button>
          )
        })}
      </div>
      <div className="pickup-cal__legend">
        <span><span className="leg-dot leg-avail"/>Available</span>
        <span><span className="leg-dot leg-selected"/>Selected</span>
      </div>
    </div>
  )
}

export default function CakeDetail() {
  const { id } = useParams()
  const [cake, setCake] = useState(null)
  const [payment, setPayment] = useState(null)
  const [availableDates, setAvailableDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeImg, setActiveImg] = useState(0)

  const [orderStep, setOrderStep] = useState('details')
  const [pickupDate, setPickupDate] = useState('')
  const [form, setForm] = useState({ name:'', email:'', phone:'', notes:'' })
  const [placing, setPlacing] = useState(false)
  const [orderDone, setOrderDone] = useState(false)

  useEffect(() => {
    getCake(id).then(c => { if (!c) setNotFound(true); else setCake(c); setLoading(false) })
    getSetting('payments').then(setPayment)
    // Only load dates Pam has marked available (not booked)
    getAvailability().then(all => setAvailableDates(all.filter(a => !a.booked)))
  }, [id])

  if (loading) return <p className="loading">Loading…</p>
  if (notFound) return <Navigate to="/cakes" replace />

  const depositAmt = ((cake.price * (cake.deposit_percent || 30)) / 100).toFixed(2)
  const allImages = [cake.image_url, ...(cake.gallery || [])].filter(Boolean)
  const payLink = buildPaymentLink(payment, depositAmt)
  const html = cake.body ? marked.parse(cake.body) : ''
  const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })

  const handlePlaceOrder = async () => {
    if (!form.name || !form.email || !pickupDate) return alert('Please fill in your name, email, and pickup date.')
    setPlacing(true)
    try {
      await placeOrder({
        cake_id: cake.id,
        cake_title: cake.title,
        cake_image: cake.image_url,
        cake_price: cake.price,
        deposit_amount: parseFloat(depositAmt),
        pickup_date: pickupDate,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        notes: form.notes,
        status: 'pending_payment'
      })
      setOrderDone(true)
      if (payLink) window.open(payLink, '_blank')
    } catch(e) {
      alert('Something went wrong. Please try again.')
    }
    setPlacing(false)
  }

  if (orderDone) return (
    <div>
      <div className="page-header page-header--short">
        <div className="container"><h1>Order Received! 🎂</h1></div>
      </div>
      <section className="section">
        <div className="container order-success">
          <div className="order-success__icon">🎉</div>
          <h2>Thank you, {form.name}!</h2>
          <div className="order-success__details">
            <div><span>Cake</span><strong>{cake.title}</strong></div>
            <div><span>Pickup Date</span><strong>{fmtDate(pickupDate)}</strong></div>
            <div><span>Deposit Due</span><strong>${depositAmt}</strong></div>
          </div>
          {payLink
            ? <p className="order-success__note">A payment window opened — please complete your ${depositAmt} deposit to confirm. If it didn't open, <a href={payLink} target="_blank" rel="noopener noreferrer">click here to pay</a>.</p>
            : payment?.custom_instructions
              ? <div className="order-success__instructions"><strong>How to pay your deposit:</strong><p>{payment.custom_instructions}</p></div>
              : null
          }
          <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', marginTop:'1rem' }}>
            We'll be in touch at <strong>{form.email}</strong> to confirm your order!
          </p>
          <Link to="/cakes" className="btn btn-outline" style={{ marginTop:'1.5rem' }}>← Back to Cakes</Link>
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
                  <button key={i} className={`thumb ${i === activeImg ? 'active' : ''}`} onClick={() => setActiveImg(i)}>
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
                  {['details','date','confirm'].map((s, i) => {
                    const labels = ['Your Info','Pickup Date','Pay Deposit']
                    const stepIndex = ['details','date','confirm'].indexOf(orderStep)
                    const isDone = i < stepIndex
                    const isActive = s === orderStep
                    return (
                      <div key={s} style={{ display:'flex', alignItems:'center', gap:'0.25rem' }}>
                        <div className={`order-step-tab ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                          <span>{isDone ? '✓' : i+1}</span>{labels[i]}
                        </div>
                        {i < 2 && <div className="order-step-arrow">›</div>}
                      </div>
                    )
                  })}
                </div>

                {/* Step 1: Info */}
                {orderStep === 'details' && (
                  <div className="order-panel">
                    <h4>Your Contact Info</h4>
                    <div className="form-field"><label>Full Name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Jane Smith" /></div>
                    <div className="form-field"><label>Email *</label><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="jane@email.com" /></div>
                    <div className="form-field"><label>Phone (optional)</label><input type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></div>
                    <div className="form-field"><label>Special requests / notes</label><textarea rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Dietary needs, flavors, decorations…" /></div>
                    <button className="btn btn-sage btn-full" onClick={() => { if (!form.name || !form.email) return alert('Please enter your name and email.'); setOrderStep('date') }}>
                      Next: Pick Pickup Date →
                    </button>
                  </div>
                )}

                {/* Step 2: Pickup date — only Pam's available dates */}
                {orderStep === 'date' && (
                  <div className="order-panel">
                    <h4>Choose Your Pickup Date</h4>
                    {availableDates.length === 0
                      ? <p style={{ color:'var(--text-muted)', fontStyle:'italic', textAlign:'center', padding:'1rem 0' }}>No pickup dates are currently available. Please <Link to="/booking" style={{ color:'var(--sage)' }}>book a consultation</Link> to discuss timing.</p>
                      : <>
                          <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'1rem' }}>
                            Green dots show dates available for pickup. Only dates Pam has opened are selectable.
                          </p>
                          <PickupCalendar selected={pickupDate} onSelect={setPickupDate} availableDates={availableDates} />
                          {pickupDate && <div className="selected-date">✓ {fmtDate(pickupDate)}</div>}
                        </>
                    }
                    <div style={{ display:'flex', gap:'0.75rem', marginTop:'1rem' }}>
                      <button className="btn btn-outline" onClick={() => setOrderStep('details')}>← Back</button>
                      <button className="btn btn-sage btn-full" disabled={!pickupDate} onClick={() => setOrderStep('confirm')}>
                        Next: Review & Pay →
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Confirm */}
                {orderStep === 'confirm' && (
                  <div className="order-panel">
                    <h4>Review Your Order</h4>
                    <div className="order-review">
                      <div><span>Cake</span><strong>{cake.title}</strong></div>
                      <div><span>Pickup Date</span><strong>{fmtDate(pickupDate)}</strong></div>
                      <div><span>Name</span><strong>{form.name}</strong></div>
                      <div><span>Email</span><strong>{form.email}</strong></div>
                      <div className="order-review__total"><span>Deposit ({cake.deposit_percent || 30}%)</span><strong>${depositAmt}</strong></div>
                    </div>
                    {!payLink && payment?.custom_instructions && (
                      <div className="order-instructions">{payment.custom_instructions}</div>
                    )}
                    <div style={{ display:'flex', gap:'0.75rem', marginTop:'1rem' }}>
                      <button className="btn btn-outline" onClick={() => setOrderStep('date')}>← Back</button>
                      <button className="btn btn-sage btn-full" onClick={handlePlaceOrder} disabled={placing}>
                        {placing ? 'Placing order…' : `Pay $${depositAmt} Deposit & Confirm`}
                      </button>
                    </div>
                    <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.75rem', textAlign:'center' }}>
                      Clicking saves your order and opens the payment page.
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
