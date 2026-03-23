import { useParams, Link, Navigate } from 'react-router-dom'
import { marked } from 'marked'
import { blogPosts } from '../utils/content'
import './BlogPost.css'

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function VideoEmbed({ video, videoUrl }) {
  if (video) {
    return (
      <video controls className="post-video" preload="metadata">
        <source src={video} type="video/mp4" />
        Your browser does not support video.
      </video>
    )
  }
  if (videoUrl) {
    const isYoutube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')
    const isVimeo = videoUrl.includes('vimeo.com')
    if (isYoutube || isVimeo) {
      let src = videoUrl
      if (isYoutube) {
        const id = videoUrl.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1]
        if (id) src = `https://www.youtube.com/embed/${id}`
      }
      if (isVimeo) {
        const id = videoUrl.match(/vimeo\.com\/(\d+)/)?.[1]
        if (id) src = `https://player.vimeo.com/video/${id}`
      }
      return (
        <div className="post-video-wrap">
          <iframe src={src} title="Video" allowFullScreen frameBorder="0" />
        </div>
      )
    }
    return <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">Watch Video →</a>
  }
  return null
}

export default function BlogPost() {
  const { slug } = useParams()
  const post = blogPosts.find(p => p.slug === slug)

  if (!post) return <Navigate to="/blog" replace />

  const html = post.body ? marked.parse(post.body) : ''

  return (
    <div>
      <div className="page-header page-header--short">
        <div className="container">
          <Link to="/blog" className="back-link">← Back to Recipes</Link>
          <h1>{post.title}</h1>
          <time className="post-date">{formatDate(post.date)}</time>
        </div>
      </div>

      <section className="section">
        <div className="container post-layout">
          <article className="post-article">
            {post.image && (
              <img src={post.image} alt={post.title} className="post-hero-img" />
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="post-tags">
                {post.tags.map(tag => (
                  <span key={tag} className="badge badge-rose">{tag}</span>
                ))}
              </div>
            )}

            <p className="post-excerpt">{post.excerpt}</p>

            <VideoEmbed video={post.video} videoUrl={post.videoUrl} />

            <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

            {post.recipePdf && (
              <div className="post-pdf">
                <a href={post.recipePdf} download className="btn btn-primary">
                  ⬇ Download Recipe Card (PDF)
                </a>
              </div>
            )}
          </article>

          <aside className="post-sidebar">
            <div className="post-sidebar__card">
              <h4>Want this cake?</h4>
              <p>Browse our full catalog and place a custom order.</p>
              <Link to="/cakes" className="btn btn-rose btn-full">View Cakes</Link>
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
