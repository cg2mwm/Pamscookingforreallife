import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPosts } from '../supabase'
import './BlogPage.css'

export default function BlogPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getPosts().then(d => { setPosts(d); setLoading(false) }) }, [])

  const fmt = d => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>Recipes & Tips</h1>
          <p>Techniques, stories, and recipes from my kitchen to yours.</p>
        </div>
      </div>
      <section className="section">
        <div className="container">
          {loading ? <p className="loading">Loading recipes…</p>
            : posts.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No recipes yet — check back soon!</p>
            : (
              <div className="blog-grid">
                {posts.map((post, i) => (
                  <Link to={`/recipes/${post.id}`} key={post.id} className={`blog-card card fade-up delay-${Math.min(i+1,3)}`}>
                    <div className="blog-card__img">
                      {post.image_url ? <img src={post.image_url} alt={post.title} loading="lazy" /> : <div className="img-placeholder">📖</div>}
                    </div>
                    <div className="blog-card__body">
                      <div className="blog-card__meta">
                        <time>{fmt(post.date)}</time>
                        {post.tags?.slice(0,2).map(t => <span key={t} className="badge badge-sage">{t}</span>)}
                      </div>
                      <h3>{post.title}</h3>
                      <p>{post.excerpt}</p>
                      <span className="blog-card__more">Read more →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          }
        </div>
      </section>
    </div>
  )
}
