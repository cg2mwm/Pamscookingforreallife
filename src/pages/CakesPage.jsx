import { useState, useEffect } from 'react'
import { getCakes, getSetting } from '../supabase'
import CakeCard from '../components/CakeCard'
import './CakesPage.css'

export default function CakesPage() {
  const [cakes, setCakes] = useState([])
  const [pg, setPg] = useState({})
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState('All')
  const [query, setQuery] = useState('')

  useEffect(() => {
    getCakes().then(d => { setCakes(d); setLoading(false) })
    getSetting('page_cakes').then(d => setPg(d || {}))
  }, [])

  const categories = ['All', ...new Set(cakes.map(c => c.category).filter(Boolean))]
  const visible = cakes.filter(c => {
    const cat = active === 'All' || c.category === active
    const q = !query || c.title.toLowerCase().includes(query.toLowerCase())
    return cat && q
  })

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>{pg.heading || 'Cake Catalog'}</h1>
          <p>{pg.subtext || 'Every cake made from scratch, just for your occasion.'}</p>
        </div>
      </div>
      <section className="section">
        <div className="container">
          <div className="cakes-controls">
            <div className="cakes-filters">
              {categories.map(cat => (
                <button key={cat} className={`filter-btn ${active === cat ? 'active' : ''}`} onClick={() => setActive(cat)}>{cat}</button>
              ))}
            </div>
            <input type="search" placeholder="Search cakes…" value={query} onChange={e => setQuery(e.target.value)} className="cakes-search" />
          </div>
          {loading ? <p className="loading">Loading cakes…</p>
            : visible.length === 0
              ? <div style={{ textAlign:'center', padding:'4rem 0' }}>
                  <p>No cakes match. <button onClick={() => { setActive('All'); setQuery('') }} style={{ color:'var(--sage)', textDecoration:'underline', cursor:'pointer', fontSize:'1rem' }}>Clear filters</button></p>
                </div>
              : <div className="cakes-grid">{visible.map(cake => <CakeCard key={cake.id} cake={cake} />)}</div>
          }
        </div>
      </section>
    </div>
  )
}
