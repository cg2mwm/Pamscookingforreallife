import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCakes, getPosts, getSetting } from '../supabase'
import CakeCard from '../components/CakeCard'
import './Home.css'

export default function Home() {
  const [settings, setSettings] = useState(null)
  const [featured, setFeatured] = useState([])
  const [latestPost, setLatestPost] = useState(null)

  useEffect(() => {
    getSetting('homepage').then(s => setSettings(s || {}))
    getCakes().then(all => setFeatured(all.filter(c => c.featured && c.available).slice(0, 3)))
    getPosts().then(p => setLatestPost(p[0] || null))
  }, [])

  return (
    <div className="home">
      {/* ── Hero ── */}
      <section className="hero">
        <img src="/images/pam-cake.jpg" alt="Pam holding a beautiful strawberry cake" className="hero__photo" />
        <div className="hero__overlay" />
        <div className="container hero__content">
          <p className="hero__eyebrow fade-up delay-1">✦ Homemade with Love</p>
          <h1 className="hero__title fade-up delay-2">
            {settings?.bakeryName || "Pam's Cooking for Real Life"}
          </h1>
          <p className="hero__sub fade-up delay-3">
            {settings?.tagline || 'Handcrafted cakes for life\'s sweetest moments'}
          </p>
          <div className="hero__actions fade-up" style={{ animationDelay: '0.4s' }}>
            <Link to="/cakes" className="btn btn-primary">Browse Cakes</Link>
            <Link to="/booking" className="btn hero__outline-btn">Book a Consult</Link>
          </div>
        </div>
        <div className="hero__scroll"><div className="hero__scroll-line" /></div>
      </section>

      {/* ── Featured Cakes ── */}
      {featured.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <span className="section-label">Our Work</span>
              <h2>Featured Cakes</h2>
              <div className="divider centered" />
              <p className="section-sub">Every cake is made entirely from scratch, just for you.</p>
            </div>
            <div className="home-grid">
              {featured.map((cake, i) => (
                <div key={cake.id} className={`fade-up delay-${i + 1}`}>
                  <CakeCard cake={cake} />
                </div>
              ))}
            </div>
            <div className="section-cta">
              <Link to="/cakes" className="btn btn-outline">See All Cakes →</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── About Pam ── */}
      <section className="section gingham-bg about">
        <div className="container about__inner">
          <div className="about__img-col">
            <div className="about__frame">
              <img src="/images/pam-cake.jpg" alt="Pam with her strawberry cake" />
              <div className="about__frame-accent" />
            </div>
          </div>
          <div className="about__text">
            <span className="section-label">The Story</span>
            <h2>Real food.<br />Real love.</h2>
            <div className="divider" />
            {settings?.aboutStory
              ? settings.aboutStory.split('\n\n').map((p, i) => <p key={i} style={{ marginBottom: '1rem' }}>{p}</p>)
              : <p>Every cake starts with a conversation. I want to know your story — the love you're celebrating, the memory you're creating. Then I bake it in.</p>
            }
            <div className="about__details">
              <span>📍 Burlington, NC</span>
              {settings?.phone && <a href={`tel:${settings.phone}`}>📞 {settings.phone}</a>}
              {settings?.email && <a href={`mailto:${settings.email}`}>✉️ {settings.email}</a>}
            </div>
          </div>
        </div>
      </section>

      {/* ── Latest Recipe ── */}
      {latestPost && (
        <section className="section">
          <div className="container latest">
            <div className="latest__img">
              {latestPost.image_url
                ? <img src={latestPost.image_url} alt={latestPost.title} />
                : <div className="img-placeholder">📖</div>
              }
            </div>
            <div className="latest__content">
              <span className="section-label">From the Kitchen</span>
              <h2>{latestPost.title}</h2>
              <div className="divider" />
              <p>{latestPost.excerpt}</p>
              <Link to={`/recipes/${latestPost.id}`} className="btn btn-primary">Read the Recipe →</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Booking CTA ── */}
      <section className="booking-cta">
        <div className="container booking-cta__inner">
          <span className="section-label">Let's Create Together</span>
          <h2>Ready for your dream cake?</h2>
          <p>Book a free consultation and let's talk about your vision.</p>
          <Link to="/booking" className="btn btn-primary">Check Availability →</Link>
        </div>
      </section>
    </div>
  )
}
