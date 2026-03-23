import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { homepage } from '../utils/content'
import './Navbar.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location])

  const navClass = [
    'navbar',
    isHome && !scrolled ? 'navbar--transparent' : 'navbar--solid',
    scrolled ? 'navbar--scrolled' : '',
  ].filter(Boolean).join(' ')

  return (
    <header className={navClass}>
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">✦</span>
          <span>{homepage.bakeryName}</span>
        </Link>

        <nav className={`navbar__links ${menuOpen ? 'is-open' : ''}`}>
          <NavLink to="/cakes">Cakes</NavLink>
          <NavLink to="/blog">Recipes</NavLink>
          <NavLink to="/booking">Book a Consult</NavLink>
          <a href="/admin/" className="navbar__admin">Admin</a>
        </nav>

        <button
          className={`navbar__burger ${menuOpen ? 'is-open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}
