import { Link } from 'react-router-dom'
import { getPaymentLink } from '../utils/content'
import './CakeCard.css'

export default function CakeCard({ cake }) {
  const deposit = getPaymentLink(cake.price, cake.depositPercent)
  const depositAmount = ((cake.price * cake.depositPercent) / 100).toFixed(2)

  return (
    <article className="cake-card card">
      <Link to={`/cakes/${cake.slug}`} className="cake-card__image-wrap">
        {cake.image ? (
          <img src={cake.image} alt={cake.title} className="cake-card__image" loading="lazy" />
        ) : (
          <div className="cake-card__image img-placeholder">🎂</div>
        )}
        <span className="badge badge-rose cake-card__category">{cake.category}</span>
        {cake.featured && <span className="badge badge-gold cake-card__featured">Featured</span>}
        {!cake.available && <div className="cake-card__unavailable">Currently Unavailable</div>}
      </Link>

      <div className="cake-card__body">
        <Link to={`/cakes/${cake.slug}`}>
          <h3 className="cake-card__title">{cake.title}</h3>
        </Link>
        <p className="cake-card__desc">{cake.description}</p>

        {cake.servings && (
          <p className="cake-card__servings">🍽 Serves {cake.servings}</p>
        )}

        <div className="cake-card__footer">
          <div className="cake-card__pricing">
            <span className="cake-card__price">${cake.price.toLocaleString()}</span>
            <span className="cake-card__deposit">
              ${depositAmount} deposit
            </span>
          </div>

          {cake.available && (
            <div className="cake-card__actions">
              <Link to={`/cakes/${cake.slug}`} className="btn btn-outline btn--sm">
                Details
              </Link>
              {deposit.url ? (
                <a href={deposit.url} target="_blank" rel="noopener noreferrer" className="btn btn-rose btn--sm">
                  Order
                </a>
              ) : (
                <Link to="/booking" className="btn btn-rose btn--sm">
                  Order
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
