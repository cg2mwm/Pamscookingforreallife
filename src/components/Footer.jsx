import { Link } from 'react-router-dom'
import { homepage } from '../utils/content'
import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <span className="footer__logo">
            <span className="footer__star">✦</span> {homepage.bakeryName}
          </span>
          <p className="footer__tagline">{homepage.tagline}</p>
          {homepage.instagram && (
            <a
              href={`https://instagram.com/${homepage.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="footer__insta"
            >
              @{homepage.instagram}
            </a>
          )}
        </div>

        <div className="footer__nav">
          <h4>Explore</h4>
          <Link to="/cakes">Cake Catalog</Link>
          <Link to="/blog">Recipes & Tips</Link>
          <Link to="/booking">Book a Consult</Link>
        </div>

        <div className="footer__contact">
          <h4>Get in Touch</h4>
          {homepage.email && <a href={`mailto:${homepage.email}`}>{homepage.email}</a>}
          {homepage.phone && <a href={`tel:${homepage.phone}`}>{homepage.phone}</a>}
          {homepage.location && <span>{homepage.location}</span>}
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container">
          <p>© {year} {homepage.bakeryName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
