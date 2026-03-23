import { Link } from 'react-router-dom'
import { homepage, cakes, blogPosts } from '../utils/content'
import CakeCard from '../components/CakeCard'
import './Home.css'

export default function Home() {
  const featured = cakes.filter(c => c.featured && c.available).slice(0, 3)
  const allVisible = featured.length === 0 ? cakes.slice(0, 3) : featured
  const latestPost = blogPosts[0]

  return (
    <div className="home">
      {/* ── Hero ── */}
      <section className="hero">
        {homepage.heroImage && (
          <img src={homepage.heroImage} alt="Bakery hero" className="hero__bg" />
        )}
        <div className="hero__overlay" />
        <div className="container hero__content">
          <span className="hero__eyebrow fade-up fade-up-1">
            ✦ Handcrafted with Love
          </span>
          <h1 className="hero__title fade-up fade-up-2">
            {homepage.bakeryName}
          </h1>
          <p className="hero__tagline fade-up fade-up-3">
            {homepage.tagline}
          </p>
          <div className="hero__actions fade-up fade-up-4">
            <Link to="/cakes" className="btn btn-primary">
              View Our Cakes
            </Link>
            <Link to="/booking" className="btn btn-outline hero__btn-outline">
              Book a Consultation
            </Link>
          </div>
        </div>
        <div className="hero__scroll-hint">
          <span>Scroll</span>
          <div className="hero__scroll-line" />
        </div>
      </section>

      {/* ── Featured Cakes ── */}
      <section className="section featured">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Our Work</span>
            <h2>Featured Creations</h2>
            <div className="divider" />
            <p className="section-sub">
              Every cake is made entirely to order — because your celebration deserves something made just for you.
            </p>
          </div>

          <div className="cakes-grid">
            {allVisible.map((cake, i) => (
              <div key={cake.slug} className={`fade-up fade-up-${i + 1}`}>
                <CakeCard cake={cake} />
              </div>
            ))}
          </div>

          <div className="section-cta">
            <Link to="/cakes" className="btn btn-outline">
              Browse All Cakes →
            </Link>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section className="section about">
        <div className="container about__inner">
          <div className="about__image-col">
            <div className="about__image-frame">
              {homepage.heroImage ? (
                <img src={homepage.heroImage} alt="Baker at work" />
              ) : (
                <div className="about__placeholder">🎂</div>
              )}
              <div className="about__image-accent" />
            </div>
          </div>
          <div className="about__text-col">
            <span className="section-label">The Story</span>
            <h2>Made by hand.<br />Made for you.</h2>
            <div className="divider" />
            <div
              className="about__story prose"
              dangerouslySetInnerHTML={{
                __html: homepage.aboutStory
                  ? homepage.aboutStory.replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>')
                  : ''
              }}
            />
            <div className="about__details">
              {homepage.location && (
                <div className="about__detail">
                  <span className="about__detail-icon">📍</span>
                  <span>{homepage.location}</span>
                </div>
              )}
              {homepage.phone && (
                <div className="about__detail">
                  <span className="about__detail-icon">📞</span>
                  <a href={`tel:${homepage.phone}`}>{homepage.phone}</a>
                </div>
              )}
              {homepage.email && (
                <div className="about__detail">
                  <span className="about__detail-icon">✉️</span>
                  <a href={`mailto:${homepage.email}`}>{homepage.email}</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Latest Recipe ── */}
      {latestPost && (
        <section className="section latest-post">
          <div className="container">
            <div className="latest-post__inner">
              <div className="latest-post__image-wrap">
                {latestPost.image ? (
                  <img src={latestPost.image} alt={latestPost.title} />
                ) : (
                  <div className="img-placeholder latest-post__placeholder">📖</div>
                )}
              </div>
              <div className="latest-post__content">
                <span className="section-label">From the Kitchen</span>
                <h2>{latestPost.title}</h2>
                <div className="divider" />
                <p>{latestPost.excerpt}</p>
                <Link to={`/blog/${latestPost.slug}`} className="btn btn-primary">
                  Read the Recipe →
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Booking CTA ── */}
      <section className="booking-cta">
        <div className="container booking-cta__inner">
          <span className="section-label">Let's Create Together</span>
          <h2>Ready to order your dream cake?</h2>
          <p>
            Book a free consultation — we'll talk about your vision, your event, and make it happen.
          </p>
          <Link to="/booking" className="btn btn-gold">
            Check Availability →
          </Link>
        </div>
      </section>
    </div>
  )
}
