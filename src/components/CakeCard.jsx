import { Link } from 'react-router-dom'
import './CakeCard.css'

export default function CakeCard({ cake }) {
  const depositAmt = ((cake.price * (cake.deposit_percent || 30)) / 100).toFixed(2)

  return (
    <article className="cake-card card">
      <Link to={`/cakes/${cake.id}`} className="cake-card__img-wrap">
        {cake.image_url
          ? <img src={cake.image_url} alt={cake.title} loading="lazy" className="cake-card__img" />
          : <div className="img-placeholder">🎂</div>
        }
        <span className="badge badge-sage cake-card__cat">{cake.category}</span>
        {cake.featured && <span className="badge badge-brown cake-card__feat">Featured</span>}
        {!cake.available && <div className="cake-card__sold">Currently Unavailable</div>}
      </Link>

      <div className="cake-card__body">
        <Link to={`/cakes/${cake.id}`}><h3 className="cake-card__title">{cake.title}</h3></Link>
        <p className="cake-card__desc">{cake.description}</p>

        {cake.servings && <p className="cake-card__servings">🍽 Serves {cake.servings}</p>}

        {/* Allergens shown right on the card */}
        {cake.allergens?.length > 0 && (
          <div className="cake-card__allergens">
            <span className="cake-card__allergens-label">⚠️ Contains:</span>
            {cake.allergens.map(a => (
              <span key={a} className="allergen-tag">{a}</span>
            ))}
          </div>
        )}

        <div className="cake-card__footer">
          <div>
            <div className="cake-card__price">${Number(cake.price).toLocaleString()}</div>
            <div className="cake-card__deposit">${depositAmt} deposit</div>
          </div>
          {cake.available && (
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <Link to={`/cakes/${cake.id}`} className="btn btn-outline btn-sm">Details</Link>
              <Link to={`/cakes/${cake.id}#order`} className="btn btn-sage btn-sm">Order</Link>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
