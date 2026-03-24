import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { marked } from 'marked'
import { getPost } from '../supabase'
import './BlogPost.css'

function VideoEmbed({ video, videoUrl }) {
  if (video) return <video controls className="post-video" preload="metadata"><source src={video} type="video/mp4" />Your browser does not support video.</video>
  if (videoUrl) {
    const isYT = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')
    const isVimeo = videoUrl.includes('vimeo.com')
    if (isYT || isVimeo) {
      let src = videoUrl
      if (isYT) { const m = videoUrl.match(/(?:v=|youtu\.be\/)([^&?/]+)/); if (m) src = `https://www.youtube.com/embed/${m[1]}` }
      if (isVimeo) { const m = videoUrl.match(/vimeo\.com\/(\d+)/); if (m) src = `https://player.vimeo.com/video/${m[1]}` }
      return <div className="post-video-wrap"><iframe src={src} title="Video" allowFullScreen frameBorder="0" /></div>
    }
    return <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">Watch Video →</a>
  }
  return null
}

export default function BlogPost() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    getPost(id).then(p => { if (!p) { setNotFound(true) } else { setPost(p) }; setLoading(false) })
  }, [id])

  if (loading) return <p className="loading">Loading…</p>
  if (notFound) return <Navigate to="/recipes" replace />

  const fmt = d => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const html = post.body ? marked.parse(post.body) : ''

  return (
    <div>
      <div className="page-header page-header--short">
        <div className="container">
          <Link to="/recipes" className="back-link">← Back to Recipes</Link>
          <h1>{post.title}</h1>
          <time style={{ display: 'block', color: 'rgba(253,250,244,0.55)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{fmt(post.date)}</time>
        </div>
      </div>

      <section className="section">
        <div className="container post-layout">
          <article>
            {post.image_url && <img src={post.image_url} alt={post.title} className="post-hero" />}
            {post.tags?.length > 0 && <div className="post-tags">{post.tags.map(t => <span key={t} className="badge badge-sage">{t}</span>)}</div>}
            <p className="post-excerpt">{post.excerpt}</p>
            <VideoEmbed video={post.video_url} videoUrl={post.external_video_url} />
            <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
            {post.pdf_url && (
              <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--sage-pale)' }}>
                <a href={post.pdf_url} download className="btn btn-primary">⬇ Download Recipe Card (PDF)</a>
              </div>
            )}
          </article>

          <aside className="post-sidebar">
            <div className="post-sidebar__card">
              <h4>Want this cake?</h4>
              <p>Browse our full catalog and place a custom order.</p>
              <Link to="/cakes" className="btn btn-sage btn-full">View Cakes</Link>
            </div>
            <div className="post-sidebar__card">
              <h4>Book a Consult</h4>
              <p>Let's create something together.</p>
              <Link to="/booking" className="btn btn-outline btn-full">Check Availability</Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
