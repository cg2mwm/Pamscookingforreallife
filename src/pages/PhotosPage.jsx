import { useState, useEffect } from 'react'
import { getGalleries, getGalleryPhotos } from '../supabase'
import './PhotosPage.css'

function GalleryDetail({ gallery, onBack }) {
  const [photos, setPhotos] = useState([])
  const [lightbox, setLightbox] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getGalleryPhotos(gallery.id).then(d => { setPhotos(d); setLoading(false) })
  }, [gallery.id])

  return (
    <div>
      <div className="page-header page-header--short">
        <div className="container">
          <button className="back-link" onClick={onBack}>← Back to Gallery</button>
          <h1>{gallery.title}</h1>
          {gallery.description && <p>{gallery.description}</p>}
        </div>
      </div>

      <section className="section">
        <div className="container">
          {loading ? <p className="loading">Loading photos…</p> : (
            <>
              <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', marginBottom:'2rem', textAlign:'center' }}>
                {photos.length} photo{photos.length !== 1 ? 's' : ''} — click any photo to enlarge
              </p>

              <div className="process-steps">
                {photos.map((photo, i) => (
                  <div key={photo.id} className="process-step">
                    <div className="process-step__num">
                      {photo.step_number > 0 ? `Step ${photo.step_number}` : `Photo ${i + 1}`}
                    </div>
                    <div className="process-step__img" onClick={() => setLightbox(photo)}>
                      <img src={photo.image_url} alt={photo.caption || `Step ${i + 1}`} loading="lazy" />
                      <div className="process-step__zoom">🔍</div>
                    </div>
                    {photo.caption && (
                      <div className="process-step__caption">{photo.caption}</div>
                    )}
                  </div>
                ))}
              </div>

              {photos.length === 0 && (
                <p style={{ textAlign:'center', color:'var(--text-muted)', fontStyle:'italic' }}>
                  No photos added to this gallery yet.
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <div className="lightbox__box" onClick={e => e.stopPropagation()}>
            <button className="lightbox__close" onClick={() => setLightbox(null)}>✕</button>
            <img src={lightbox.image_url} alt={lightbox.caption || ''} className="lightbox__img" />
            {lightbox.caption && (
              <div className="lightbox__info"><p>{lightbox.caption}</p></div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PhotosPage() {
  const [galleries, setGalleries] = useState([])
  const [loading, setLoading]     = useState(true)
  const [active, setActive]       = useState(null)
  const [filter, setFilter]       = useState('All')

  useEffect(() => {
    getGalleries().then(d => { setGalleries(d); setLoading(false) })
  }, [])

  if (active) return <GalleryDetail gallery={active} onBack={() => setActive(null)} />

  const categories = ['All', ...new Set(galleries.map(g => g.category).filter(Boolean))]
  const visible    = filter === 'All' ? galleries : galleries.filter(g => g.category === filter)

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>Photo Gallery</h1>
          <p>See how Pam's cakes come together — from first ingredients to final decoration.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {categories.length > 2 && (
            <div className="photo-filters">
              {categories.map(cat => (
                <button key={cat} className={`filter-btn ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {loading ? <p className="loading">Loading galleries…</p>
            : visible.length === 0
              ? <p style={{ textAlign:'center', color:'var(--text-muted)', fontStyle:'italic', padding:'3rem 0' }}>No photo galleries yet — check back soon!</p>
              : (
                <div className="gallery-grid">
                  {visible.map(gallery => (
                    <div key={gallery.id} className="gallery-card card" onClick={() => setActive(gallery)}>
                      <div className="gallery-card__img">
                        {gallery.cover_image
                          ? <img src={gallery.cover_image} alt={gallery.title} loading="lazy" />
                          : <div className="img-placeholder gallery-card__placeholder">📸</div>
                        }
                        <div className="gallery-card__overlay">
                          <span>See How It's Made →</span>
                        </div>
                        {gallery.category && (
                          <span className="badge badge-sage gallery-card__cat">{gallery.category}</span>
                        )}
                      </div>
                      <div className="gallery-card__body">
                        <h3 className="gallery-card__title">{gallery.title}</h3>
                        {gallery.description && <p className="gallery-card__desc">{gallery.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )
          }
        </div>
      </section>
    </div>
  )
}
