import { useState } from 'react'
import { cakes } from '../utils/content'
import CakeCard from '../components/CakeCard'
import './CakesPage.css'

const ALL = 'All'
const categories = [ALL, ...new Set(cakes.map(c => c.category).filter(Boolean))]

export default function CakesPage() {
  const [active, setActive] = useState(ALL)
  const [query, setQuery] = useState('')

  const visible = cakes.filter(cake => {
    const matchCat = active === ALL || cake.category === active
    const matchQ = !query || cake.title.toLowerCase().includes(query.toLowerCase())
    return matchCat && matchQ
  })

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>Our Cake Catalog</h1>
          <p>Every cake is made to order, from scratch, for your occasion.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="cakes-controls">
            <div className="cakes-filters">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`filter-btn ${active === cat ? 'active' : ''}`}
                  onClick={() => setActive(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <input
              type="search"
              placeholder="Search cakes…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="cakes-search"
            />
          </div>

          {visible.length === 0 ? (
            <div className="cakes-empty">
              <p>No cakes match your search. <button onClick={() => { setActive(ALL); setQuery('') }}>Clear filters</button></p>
            </div>
          ) : (
            <div className="cakes-grid-full">
              {visible.map(cake => <CakeCard key={cake.slug} cake={cake} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
