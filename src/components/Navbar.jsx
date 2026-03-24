import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  useEffect(() => setOpen(false), [location])

  const solid = !isHome || scrolled

  return (
    <header className={`navbar ${solid ? 'navbar--solid' : 'navbar--clear'}`}>
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">
          Pam's Cooking for Real Life
        </Link>

        <nav className={`navbar__links ${open ? 'is-open' : ''}`}>
          <NavLink to="/cakes">Cakes</NavLink>
          <NavLink to="/recipes">Recipes</NavLink>
          <NavLink to="/booking">Book a Consult</NavLink>
        </nav>

        <button className={`burger ${open ? 'is-open' : ''}`} onClick={() => setOpen(!open)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}
