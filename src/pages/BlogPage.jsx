import { Link } from 'react-router-dom'
import { blogPosts } from '../utils/content'
import './BlogPage.css'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

export default function BlogPage() {
  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>Recipes & Tips</h1>
          <p>Techniques, stories, and recipes from our kitchen to yours.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {blogPosts.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              No posts yet — check back soon!
            </p>
          ) : (
            <div className="blog-grid">
              {blogPosts.map((post, i) => (
                <Link to={`/blog/${post.slug}`} key={post.slug} className={`blog-card card fade-up fade-up-${Math.min(i + 1, 4)}`}>
                  <div className="blog-card__image-wrap">
                    {post.image ? (
                      <img src={post.image} alt={post.title} loading="lazy" />
                    ) : (
                      <div className="img-placeholder blog-card__placeholder">📖</div>
                    )}
                  </div>
                  <div className="blog-card__body">
                    <div className="blog-card__meta">
                      <time>{formatDate(post.date)}</time>
                      {post.tags && post.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="badge badge-rose">{tag}</span>
                      ))}
                    </div>
                    <h3 className="blog-card__title">{post.title}</h3>
                    <p className="blog-card__excerpt">{post.excerpt}</p>
                    <span className="blog-card__read-more">Read more →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
