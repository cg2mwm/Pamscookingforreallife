import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPosts, getSetting } from '../supabase'
import './BlogPage.css'

export default function BlogPage() {
  const [posts, setPosts]   = useState([])
  const [pg, setPg]         = useState({})
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState('All')

  useEffect(() => {
    getPosts().then(d => { setPosts(d); setLoading(false) })
    getSetting('page_recipes').then(d => setPg(d || {}))
  }, [])

  const fmt = d => new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })

  // Only show categories that actually have at least one post
  const categories = ['All', ...new Set(posts.map(p => p.category).filter(Boolean))]
  const visible = active === 'All' ? posts : posts.filter(p => p.category === active)

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>{pg.heading || 'Recipes & Tips'}</h1>
          <p>{pg.subtext || 'Techniques, stories, and recipes from my kitchen to yours.'}</p>
        </div>
      </div>
      <section className="section">
        <div className="container">
          {/* Category filter — only shows if at least one post has a category */}
          {categories.length > 1 && (
            <div className="cakes-filters" style={{marginBottom:'1.5rem'}}>
              {categories.map(cat => (
                <button key={cat} className={`filter-btn ${active === cat ? 'active' : ''}`} onClick={() => setActive(cat)}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {loading ? <p className="loading">Loading recipes…</p>
            : visible.length === 0
              ? (
                <div style={{textAlign:'center',padding:'2rem 0'}}>
                  <p style={{color:'var(--text-muted)'}}>No recipes in this category yet.</p>
                  <button onClick={() => setActive('All')} style={{color:'var(--sage)',textDecoration:'underline',cursor:'pointer',fontSize:'1rem',background:'none',border:'none',marginTop:'0.5rem'}}>Show all recipes</button>
                </div>
              )
              : (
                <div className="blog-grid">
                  {visible.map((post, i) => (
                    <Link to={`/recipes/${post.id}`} key={post.id} className={`blog-card card fade-up delay-${Math.min(i+1,3)}`}>
                      <div className="blog-card__img">
                        {post.image_url ? <img src={post.image_url} alt={post.title} loading="lazy" /> : <div className="img-placeholder">📖</div>}
                      </div>
                      <div className="blog-card__body">
                        <div className="blog-card__meta">
                          <time>{fmt(post.date)}</time>
                          {post.category && <span className="badge badge-sage">{post.category}</span>}
                          {post.tags?.slice(0,1).map(t => <span key={t} className="badge badge-sage">{t}</span>)}
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
