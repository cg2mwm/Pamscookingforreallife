import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCakes, getPosts, getSetting } from '../supabase'
import CakeCard from '../components/CakeCard'
import './Home.css'

export default function Home() {
  const [pg, setPg] = useState(null)
  const [site, setSite] = useState(null)
  const [featured, setFeatured] = useState([])
  const [latestPost, setLatestPost] = useState(null)

  useEffect(() => {
    getSetting('page_home').then(d => setPg(d || {}))
    getSetting('homepage').then(d => setSite(d || {}))
    getCakes().then(all => setFeatured(all.filter(c => c.featured && c.available).slice(0, 3)))
    getPosts().then(p => setLatestPost(p[0] || null))
  }, [])

  if (!pg || !site) return null

  const heroTitle    = pg.hero_title    || site.bakeryName  || "Pam's Cooking for Real Life"
  const heroSub      = pg.hero_subtitle || site.tagline     || 'Handcrafted cakes for life\'s sweetest moments'
  const heroImg      = pg.hero_image    || '/images/pam-cake.jpg'
  const featHeading  = pg.featured_heading || 'Featured Cakes'
  const featSub      = pg.featured_subtext || 'Every cake is made entirely from scratch, just for you.'
  const aboutHeading = pg.about_heading    || 'Real food. Real love.'
  const aboutImg     = pg.about_image      || '/images/pam-cake.jpg'
  const ctaHeading   = pg.cta_heading   || 'Ready for your dream cake?'
  const ctaSub       = pg.cta_subtext   || "Book a free consultation and let's talk about your vision."

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <img src={heroImg} alt="Hero" className="hero__photo" />
        <div className="hero__overlay" />
        <div className="container hero__content">
          <p className="hero__eyebrow fade-up delay-1">✦ Homemade with Love</p>
          <h1 className="hero__title fade-up delay-2">{heroTitle}</h1>
          <p className="hero__sub fade-up delay-3">{heroSub}</p>
          <div className="hero__actions fade-up" style={{ animationDelay:'0.4s' }}>
            <Link to="/cakes" className="btn btn-primary">Browse Cakes</Link>
            <Link to="/booking" className="btn hero__outline-btn">Book a Consult</Link>
          </div>
        </div>
        <div className="hero__scroll"><div className="hero__scroll-line" /></div>
      </section>

      {/* Featured Cakes */}
      {featured.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <span className="section-label">Our Work</span>
              <h2>{featHeading}</h2>
              <div className="divider centered" />
              <p className="section-sub">{featSub}</p>
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

      {/* About */}
      <section className="section gingham-bg about">
        <div className="container about__inner">
          <div className="about__img-col">
            <div className="about__frame">
              <img src={aboutImg} alt="Pam with her cake" />
              <div className="about__frame-accent" />
            </div>
          </div>
          <div className="about__text">
            <span className="section-label">The Story</span>
            <h2 dangerouslySetInnerHTML={{ __html: aboutHeading.replace(/\n/g,'<br/>') }} />
            <div className="divider" />
            {(site.aboutStory || '').split('\n\n').filter(Boolean).map((p, i) => (
              <p key={i} style={{ marginBottom:'1rem' }}>{p}</p>
            ))}
            <div className="about__details">
              {site.location && <span>📍 {site.location}</span>}
              {site.phone    && <a href={`tel:${site.phone}`}>📞 {site.phone}</a>}
              {site.email    && <a href={`mailto:${site.email}`}>✉️ {site.email}</a>}
            </div>
          </div>
        </div>
      </section>

      {/* Latest Recipe */}
      {latestPost && (
        <section className="section">
          <div className="container latest">
            <div className="latest__img">
              {latestPost.image_url
                ? <img src={latestPost.image_url} alt={latestPost.title} />
                : <div className="img-placeholder">📖</div>}
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

      {/* CTA */}
      <section className="booking-cta">
        <div className="container booking-cta__inner">
          <span className="section-label">Let's Create Together</span>
          <h2>{ctaHeading}</h2>
          <p>{ctaSub}</p>
          <Link to="/booking" className="btn btn-primary">Check Availability →</Link>
        </div>
      </section>
    </div>
  )
}
