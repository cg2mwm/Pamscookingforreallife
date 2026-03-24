import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { marked } from 'marked'
import { getCake, getSetting } from '../supabase'
import './CakeDetail.css'

export default function CakeDetail() {
  const { id } = useParams()
  const [cake, setCake] = useState(null)
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    getCake(id).then(c => {
      if (!c) { setNotFound(true); setLoading(false); return }
      setCake(c); setLoading(false)
    })
    getSetting('payments').then(setPayment)
  }, [id])

  if (loading) return <p className="loading">Loading…</p>
  if (notFound) return <Navigate to="/cakes" replace />

  const depositAmt = ((cake.price * (cake.deposit_percent || 30)) / 100).toFixed(2)
  const allImages = [cake.image_url, ...(cake.gallery || [])].filter(Boolean)

  function getPayLink() {
    if (!payment) return null
    const { method, payment_id } = payment
    if (method === 'PayPal') {
      const id = payment_id.includes('@') ? payment_id.replace('@', '') : payment_id
      return `https://paypal.me/${id}/${depositAmt}`
    }
    if (method === 'Venmo') return `https://venmo.com/${payment_id}?txn=charge&amount=${depositAmt}&note=Cake+Deposit`
    if (method === 'CashApp') return `https://cash.app/${payment_id.startsWith('$') ? payment_id : '$' + payment_id}/${depositAmt}`
    return null
  }

  const payLink = getPayLink()
  const html = cake.body ? marked.parse(cake.body) : ''

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
          <div className="cake-gallery">
            <div className="cake-gallery__main">
              {allImages[activeImg]
                ? <img src={allImages[activeImg]} alt={cake.title} />
                : <div className="img-placeholder" style={{ aspectRatio: '4/3' }}>🎂</div>
              }
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

          <div className="cake-info">
            <div className="cake-info__price-row">
              <span className="cake-info__price">${Number(cake.price).toLocaleString()}</span>
              {cake.featured && <span className="badge badge-brown">Featured</span>}
            </div>
            <p style={{ marginBottom: '1.25rem', lineHeight: 1.75 }}>{cake.description}</p>
            {cake.servings && <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>🍽 Serves {cake.servings}</p>}
            {cake.allergens?.length > 0 && (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Contains:</span>
                {cake.allergens.map(a => <span key={a} className="badge badge-sage">{a}</span>)}
              </div>
            )}

            <div className="divider" />

            <div id="order" className="cake-order">
              <div className="cake-order__deposit">
                <span>Required Deposit ({cake.deposit_percent || 30}%)</span>
                <span className="cake-order__amt">${depositAmt}</span>
              </div>
              {cake.available ? (
                <>
                  {payLink
                    ? <a href={payLink} target="_blank" rel="noopener noreferrer" className="btn btn-sage btn-full">Pay ${depositAmt} Deposit</a>
                    : payment?.custom_instructions
                      ? <div className="cake-order__instructions">{payment.custom_instructions}</div>
                      : null
                  }
                  <Link to="/booking" className="btn btn-outline btn-full">Book a Consultation First</Link>
                </>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>This cake is currently unavailable. Contact us about a custom order.</p>
              )}
            </div>
          </div>
        </div>

        {html && (
          <div className="container" style={{ marginTop: '3rem' }}>
            <div className="divider" style={{ marginBottom: '2rem' }} />
            <div className="prose" style={{ maxWidth: '700px' }} dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        )}
      </section>
    </div>
  )
}
