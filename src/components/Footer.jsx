import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">

        <div className="footer__brand">
          <img src="/images/biz-card.jpg" alt="Pam's Cooking for Real Life" className="footer__bizcard" />
        </div>

        <div className="footer__nav">
          <h4>Explore</h4>
          <Link to="/cakes">Cake Catalog</Link>
          <Link to="/recipes">Recipes & Tips</Link>
          <Link to="/booking">Book a Consultation</Link>
        </div>

        <div className="footer__contact">
          <h4>Get in Touch</h4>
          <p>Burlington, NC</p>
          <p className="footer__note">All cakes made to order, from scratch.</p>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container">
          <p>© {new Date().getFullYear()} Pam's Cooking for Real Life · Burlington, NC</p>
        </div>
      </div>
    </footer>
  )
}
