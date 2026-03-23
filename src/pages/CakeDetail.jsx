import { useParams, Link, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { marked } from 'marked'
import { cakes, getPaymentLink } from '../utils/content'
import './CakeDetail.css'

export default function CakeDetail() {
  const { slug } = useParams()
  const cake = cakes.find(c => c.slug === slug)
  const [activeImage, setActiveImage] = useState(0)

  if (!cake) return <Navigate to="/cakes" replace />

  const allImages = [cake.image, ...(cake.gallery || [])].filter(Boolean)
  const deposit = getPaymentLink(cake.price, cake.depositPercent)
  const depositAmount = ((cake.price * cake.depositPercent) / 100).toFixed(2)
  const htmlBody = cake.body ? marked.parse(cake.body) : ''

  return (
    <div>
      <div className="page-header page-header--short">
        <div className="container">
          <Link to="/cakes" className="back-link">← Back to Cakes</Link>
          <h1>{cake.title}</h1>
          <span className="badge badge-rose">{cake.category}</span>
        </div>
      </div>

      <section className="section">
        <div className="container cake-detail">
          {/* Image Gallery */}
          <div className="cake-gallery">
            <div className="cake-gallery__main">
              {allImages.length > 0 ? (
                <img src={allImages[activeImage]} alt={cake.title} />
              ) : (
                <div className="img-placeholder cake-gallery__placeholder">🎂</div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="cake-gallery__thumbs">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    className={`cake-gallery__thumb ${i === activeImage ? 'active' : ''}`}
                    onClick={() => setActiveImage(i)}
                  >
                    <img src={img} alt={`View ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="cake-info">
            <div className="cake-info__price-row">
              <span className="cake-info__price">${cake.price.toLocaleString()}</span>
              {cake.featured && <span className="badge badge-gold">Featured</span>}
            </div>

            <p className="cake-info__desc">{cake.description}</p>

            {cake.servings && (
              <div className="cake-info__meta">
                <span>🍽</span> <span>Serves {cake.servings}</span>
              </div>
            )}

            {cake.allergens && cake.allergens.length > 0 && (
              <div className="cake-info__allergens">
                <span className="cake-info__meta-label">Contains:</span>
                {cake.allergens.map(a => (
                  <span key={a} className="badge badge-rose">{a}</span>
                ))}
              </div>
            )}

            <div className="divider" />

            <div className="cake-info__order">
              <div className="cake-info__deposit-info">
                <span className="cake-info__deposit-label">Required Deposit ({cake.depositPercent}%)</span>
                <span className="cake-info__deposit-amount">${depositAmount}</span>
              </div>

              {cake.available ? (
                <>
                  {deposit.url ? (
                    <a href={deposit.url} target="_blank" rel="noopener noreferrer" className="btn btn-rose btn-full">
                      {deposit.label}
                    </a>
                  ) : (
                    <div>
                      <p className="cake-info__instructions">{deposit.instructions}</p>
                      <Link to="/booking" className="btn btn-rose btn-full">Book a Consultation</Link>
                    </div>
                  )}
                  <Link to="/booking" className="btn btn-outline btn-full">
                    Book a Consultation First
                  </Link>
                </>
              ) : (
                <div className="cake-info__unavailable">
                  <p>This cake is currently unavailable. Contact us about a custom order.</p>
                  <a href={`mailto:${(window.__homepage_email || 'hello@example.com')}`} className="btn btn-outline btn-full">
                    Get in Touch
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        {htmlBody && (
          <div className="container">
            <div className="divider" style={{ margin: '3rem 0' }} />
            <div
              className="prose cake-body"
              dangerouslySetInnerHTML={{ __html: htmlBody }}
            />
          </div>
        )}
      </section>
    </div>
  )
}
