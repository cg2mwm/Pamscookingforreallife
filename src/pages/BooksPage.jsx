import { useState, useEffect } from 'react'
import { getBooks, getSetting } from '../supabase'
import './BooksPage.css'

export default function BooksPage() {
  const [books, setBooks]     = useState([])
  const [pg, setPg]           = useState({})
  const [loading, setLoading] = useState(true)
  const [active, setActive]   = useState('All')

  useEffect(() => {
    getBooks().then(d => { setBooks(d); setLoading(false) })
    getSetting('page_books').then(d => setPg(d || {}))
  }, [])

  // Only show categories that have at least one book
  const categories = ['All', ...new Set(books.map(b => b.category).filter(Boolean))]
  const visible = active === 'All' ? books : books.filter(b => b.category === active)

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>{pg.heading || 'Books & Cookbooks'}</h1>
          <p>{pg.subtext  || 'Recipes and cooking wisdom you can take home.'}</p>
        </div>
      </div>

      {pg.intro && (
        <section className="section" style={{ paddingBottom: 0 }}>
          <div className="container">
            <p style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', fontSize: '1.05rem', lineHeight: 1.8 }}>{pg.intro}</p>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          {/* Category filter — only shows if at least one book has a category */}
          {categories.length > 1 && (
            <div className="cakes-filters" style={{marginBottom:'1.5rem'}}>
              {categories.map(cat => (
                <button key={cat} className={`filter-btn ${active === cat ? 'active' : ''}`} onClick={() => setActive(cat)}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {loading ? <p className="loading">Loading books…</p>
            : visible.length === 0
              ? (
                <div style={{textAlign:'center',padding:'2rem 0'}}>
                  <p style={{color:'var(--text-muted)',fontStyle:'italic'}}>
                    {active === 'All' ? 'No books listed yet — check back soon!' : `No books in this category yet.`}
                  </p>
                  {active !== 'All' && (
                    <button onClick={() => setActive('All')} style={{color:'var(--sage)',textDecoration:'underline',cursor:'pointer',fontSize:'1rem',background:'none',border:'none',marginTop:'0.5rem'}}>Show all books</button>
                  )}
                </div>
              )
              : (
                <div className="books-grid">
                  {visible.map(book => (
                    <article key={book.id} className="book-card card">
                      <div className="book-card__img-wrap">
                        {book.image_url
                          ? <img src={book.image_url} alt={book.title} loading="lazy" />
                          : <div className="img-placeholder book-card__placeholder">📚</div>
                        }
                        {book.featured && <span className="badge badge-brown book-card__feat">Featured</span>}
                        {!book.available && <div className="book-card__sold">Out of Stock</div>}
                      </div>
                      <div className="book-card__body">
                        {book.category && <span className="badge badge-sage" style={{ marginBottom:'0.5rem' }}>{book.category}</span>}
                        <h3 className="book-card__title">{book.title}</h3>
                        <p className="book-card__desc">{book.description}</p>
                        <div className="book-card__footer">
                          <span className="book-card__price">${Number(book.price).toFixed(2)}</span>
                          {book.available && (
                            book.buy_link
                              ? <a href={book.buy_link} target="_blank" rel="noopener noreferrer" className="btn btn-sage btn-sm">Buy Now</a>
                              : <a href="/booking" className="btn btn-outline btn-sm">Contact to Order</a>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )
          }
        </div>
      </section>
    </div>
  )
}
