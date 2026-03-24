import { useState, useEffect } from 'react'
import { supabase, getCakes, saveCake, deleteCake, getPosts, savePost, deletePost, getSetting, setSetting, getAvailability, saveAvailability, deleteAvailability, uploadImage } from '../supabase'
import './Admin.css'

// ─── Auth ────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault(); setErr(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) { setErr('Wrong email or password. Try again.'); setLoading(false) }
  }

  return (
    <div className="login-screen">
      <div className="login-box">
        <img src="/images/biz-card.jpg" alt="Pam's Cooking" className="login-logo" />
        <h2>Kitchen Door</h2>
        <p>Private access only</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div className="form-field"><label>Password</label><input type="password" value={pass} onChange={e => setPass(e.target.value)} required /></div>
          {err && <p className="login-err">{err}</p>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  )
}

// ─── Image Upload helper ─────────────────────────────────────
function ImgUpload({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const handle = async e => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    try { const url = await uploadImage(file); onChange(url) }
    catch(err) { alert('Upload failed: ' + err.message) }
    finally { setUploading(false) }
  }
  return (
    <div className="form-field">
      <label>{label}</label>
      <div className="img-upload-row">
        {value && <img src={value} alt="" className="img-thumb" />}
        <label className={`btn btn-outline btn-sm ${uploading ? 'disabled' : ''}`}>
          {uploading ? 'Uploading…' : value ? 'Replace Image' : 'Upload Image'}
          <input type="file" accept="image/*" onChange={handle} style={{ display: 'none' }} disabled={uploading} />
        </label>
        {value && <button className="btn btn-sm" style={{ color: 'var(--red)' }} onClick={() => onChange('')}>Remove</button>}
      </div>
      {value && <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="or paste image URL" style={{ marginTop: '0.4rem', fontSize: '0.78rem' }} className="url-input" />}
    </div>
  )
}

// ─── Cake Editor ─────────────────────────────────────────────
function CakeEditor({ cake, onSave, onCancel }) {
  const blank = { title:'', price:'', deposit_percent:30, description:'', category:'', servings:'', available:true, featured:false, image_url:'', gallery:[], allergens:[], body:'' }
  const [form, setForm] = useState(cake || blank)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title || !form.price) return alert('Title and price are required.')
    setSaving(true)
    await saveCake({ ...form, price: parseFloat(form.price) })
    setSaving(false); onSave()
  }

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <h3>{cake?.id ? 'Edit Cake' : 'New Cake'}</h3>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-sage btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Cake'}</button>
        </div>
      </div>
      <div className="editor-body">
        <div className="form-row-2">
          <div className="form-field"><label>Cake Name *</label><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Strawberry Dream Cake" /></div>
          <div className="form-field"><label>Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select…</option>
              {['Wedding','Birthday','Anniversary','Custom','Seasonal'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row-2">
          <div className="form-field"><label>Price ($) *</label><input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="250.00" /></div>
          <div className="form-field"><label>Deposit %</label><input type="number" value={form.deposit_percent} onChange={e => set('deposit_percent', e.target.value)} /></div>
        </div>
        <div className="form-field"><label>Short Description</label><textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} /></div>
        <div className="form-field"><label>Serves</label><input value={form.servings} onChange={e => set('servings', e.target.value)} placeholder="20-25 people" /></div>
        <ImgUpload label="Main Image" value={form.image_url} onChange={v => set('image_url', v)} />
        <div className="form-field"><label>Allergens (comma separated)</label><input value={form.allergens?.join(', ')} onChange={e => set('allergens', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Dairy, Gluten, Eggs" /></div>
        <div className="form-field"><label>Full Details (markdown ok)</label><textarea rows={6} value={form.body} onChange={e => set('body', e.target.value)} /></div>
        <div className="toggle-row">
          <label className="toggle"><input type="checkbox" checked={form.available} onChange={e => set('available', e.target.checked)} /><span>Available for orders</span></label>
          <label className="toggle"><input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} /><span>Featured on homepage</span></label>
        </div>
      </div>
    </div>
  )
}

// ─── Post Editor ─────────────────────────────────────────────
function PostEditor({ post, onSave, onCancel }) {
  const blank = { title:'', date: new Date().toISOString().split('T')[0], excerpt:'', image_url:'', video_url:'', external_video_url:'', pdf_url:'', tags:[], body:'' }
  const [form, setForm] = useState(post || blank)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const handleSave = async () => {
    if (!form.title) return alert('Title is required.')
    setSaving(true)
    await savePost({ ...form, tags: typeof form.tags === 'string' ? form.tags.split(',').map(s => s.trim()) : form.tags })
    setSaving(false); onSave()
  }

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <h3>{post?.id ? 'Edit Recipe/Post' : 'New Recipe/Post'}</h3>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-sage btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Post'}</button>
        </div>
      </div>
      <div className="editor-body">
        <div className="form-row-2">
          <div className="form-field"><label>Title *</label><input value={form.title} onChange={e => set('title', e.target.value)} /></div>
          <div className="form-field"><label>Date</label><input type="date" value={form.date?.split('T')[0]} onChange={e => set('date', e.target.value)} /></div>
        </div>
        <div className="form-field"><label>Excerpt (shown in listings)</label><textarea rows={2} value={form.excerpt} onChange={e => set('excerpt', e.target.value)} /></div>
        <ImgUpload label="Hero Image" value={form.image_url} onChange={v => set('image_url', v)} />
        <div className="form-field"><label>YouTube / Vimeo URL (optional)</label><input value={form.external_video_url} onChange={e => set('external_video_url', e.target.value)} placeholder="https://youtube.com/..." /></div>
        <div className="form-field"><label>Tags (comma separated)</label><input value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags} onChange={e => set('tags', e.target.value)} placeholder="Tutorial, Frosting, Beginner" /></div>
        <div className="form-field"><label>Full Content (markdown ok)</label><textarea rows={10} value={form.body} onChange={e => set('body', e.target.value)} /></div>
      </div>
    </div>
  )
}

// ─── Visual Calendar Editor ───────────────────────────────────
function CalendarEditor() {
  const [availability, setAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [newDate, setNewDate] = useState('')
  const [newSlots, setNewSlots] = useState('')
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  const load = () => getAvailability().then(d => { setAvailability(d); setLoading(false) })
  useEffect(() => { load() }, [])

  const availMap = {}
  availability.forEach(a => { availMap[a.date] = a })

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()

  const addDate = async () => {
    if (!newDate) return
    const slots = newSlots.split(',').map(s => s.trim()).filter(Boolean)
    await saveAvailability({ date: newDate, slots, booked: false })
    setNewDate(''); setNewSlots(''); load()
  }

  const toggleBooked = async (row) => {
    await saveAvailability({ ...row, booked: !row.booked }); load()
  }

  const removeDate = async (id) => {
    if (!confirm('Remove this date?')) return
    await deleteAvailability(id); load()
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push({ d, dateStr, row: availMap[dateStr] || null })
  }

  return (
    <div>
      <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', marginBottom:'1.5rem', color:'var(--sage-dark)' }}>Manage Availability</h3>

      <div className="admin-cal-nav">
        <button className="btn btn-outline btn-sm" onClick={() => { if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11)}else setCalMonth(m=>m-1) }}>‹ Prev</button>
        <span className="admin-cal-month">{MONTHS[calMonth]} {calYear}</span>
        <button className="btn btn-outline btn-sm" onClick={() => { if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0)}else setCalMonth(m=>m+1) }}>Next ›</button>
      </div>

      <div className="admin-cal-grid">
        {DAYS.map(d => <div key={d} className="admin-cal-dayname">{d}</div>)}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e${i}`} className="admin-cal-cell admin-cal-cell--empty" />
          const { d, dateStr, row } = cell
          return (
            <div key={dateStr} className={`admin-cal-cell ${row ? (row.booked ? 'admin-cal-cell--booked' : 'admin-cal-cell--avail') : ''}`}>
              <span className="admin-cal-num">{d}</span>
              {row && (
                <div className="admin-cal-info">
                  {row.booked ? <span className="admin-cal-tag booked">Booked</span> : <span className="admin-cal-tag avail">{row.slots?.length} slot{row.slots?.length !== 1 ? 's' : ''}</span>}
                  <div className="admin-cal-actions">
                    <button title={row.booked ? 'Mark available' : 'Mark booked'} onClick={() => toggleBooked(row)}>{row.booked ? '✓' : '✕'}</button>
                    <button title="Remove" onClick={() => removeDate(row.id)} style={{ color:'var(--red)' }}>🗑</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="add-date-form">
        <h4>Add Available Date</h4>
        <div className="form-row-2">
          <div className="form-field"><label>Date</label><input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
          <div className="form-field"><label>Time Slots (comma separated)</label><input value={newSlots} onChange={e => setNewSlots(e.target.value)} placeholder="10:00 AM, 2:00 PM, 4:00 PM" /></div>
        </div>
        <button className="btn btn-sage" onClick={addDate} disabled={!newDate}>Add Date</button>
      </div>
    </div>
  )
}

// ─── Settings / Page Editor ───────────────────────────────────
function SettingsEditor() {
  const [homepage, setHomepage] = useState(null)
  const [payments, setPayments] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getSetting('homepage').then(d => setHomepage(d || { bakeryName:"Pam's Cooking for Real Life", tagline:'', aboutStory:'', phone:'', email:'', instagram:'' }))
    getSetting('payments').then(d => setPayments(d || { method:'PayPal', payment_id:'', custom_instructions:'' }))
  }, [])

  const setH = (k, v) => setHomepage(h => ({ ...h, [k]: v }))
  const setP = (k, v) => setPayments(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    await setSetting('homepage', homepage)
    await setSetting('payments', payments)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  if (!homepage || !payments) return <p className="loading">Loading settings…</p>

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem' }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', color:'var(--sage-dark)' }}>Site Settings</h3>
        <button className="btn btn-sage" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save All Settings'}
        </button>
      </div>

      <div className="settings-section">
        <h4>📄 Homepage Content</h4>
        <div className="form-field"><label>Bakery / Site Name</label><input value={homepage.bakeryName} onChange={e => setH('bakeryName', e.target.value)} /></div>
        <div className="form-field"><label>Tagline (shown under hero title)</label><input value={homepage.tagline} onChange={e => setH('tagline', e.target.value)} /></div>
        <div className="form-field"><label>Your Story / About Section</label><textarea rows={6} value={homepage.aboutStory} onChange={e => setH('aboutStory', e.target.value)} placeholder="Write a few paragraphs about yourself and your baking…" /></div>
      </div>

      <div className="settings-section">
        <h4>📞 Contact Info</h4>
        <div className="form-row-2">
          <div className="form-field"><label>Phone</label><input value={homepage.phone} onChange={e => setH('phone', e.target.value)} placeholder="(336) 555-0100" /></div>
          <div className="form-field"><label>Email</label><input value={homepage.email} onChange={e => setH('email', e.target.value)} placeholder="pam@example.com" /></div>
        </div>
        <div className="form-field"><label>Instagram Handle (without @)</label><input value={homepage.instagram} onChange={e => setH('instagram', e.target.value)} placeholder="pamscooking" /></div>
      </div>

      <div className="settings-section">
        <h4>💳 Payment Settings</h4>
        <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'1rem' }}>When a customer clicks "Pay Deposit", they'll be sent here to pay.</p>
        <div className="form-row-2">
          <div className="form-field">
            <label>Payment Method</label>
            <select value={payments.method} onChange={e => setP('method', e.target.value)}>
              {['PayPal','Venmo','CashApp','Zelle','BankTransfer','Custom'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Your PayPal email / Venmo / CashApp handle</label>
            <input value={payments.payment_id} onChange={e => setP('payment_id', e.target.value)} placeholder="youremail@gmail.com or @YourHandle" />
          </div>
        </div>
        <div className="form-field">
          <label>Custom Instructions (if method is Custom or Zelle)</label>
          <textarea rows={2} value={payments.custom_instructions} onChange={e => setP('custom_instructions', e.target.value)} placeholder="Send payment to 336-555-0100 via Zelle with your name in the memo." />
        </div>
      </div>
    </div>
  )
}

// ─── Main Admin Shell ─────────────────────────────────────────
export default function Admin() {
  const [user, setUser] = useState(undefined)
  const [tab, setTab] = useState('cakes')
  const [cakes, setCakes] = useState([])
  const [posts, setPosts] = useState([])
  const [editingCake, setEditingCake] = useState(null)
  const [editingPost, setEditingPost] = useState(null)
  const [showNewCake, setShowNewCake] = useState(false)
  const [showNewPost, setShowNewPost] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null))
    supabase.auth.onAuthStateChange((_, s) => setUser(s?.user || null))
  }, [])

  useEffect(() => {
    if (!user) return
    getCakes().then(setCakes)
    getPosts().then(setPosts)
  }, [user])

  const signOut = () => supabase.auth.signOut()

  const refreshCakes = () => { getCakes().then(setCakes); setEditingCake(null); setShowNewCake(false) }
  const refreshPosts = () => { getPosts().then(setPosts); setEditingPost(null); setShowNewPost(false) }

  const handleDeleteCake = async (id) => {
    if (!confirm('Delete this cake?')) return
    await deleteCake(id); getCakes().then(setCakes)
  }
  const handleDeletePost = async (id) => {
    if (!confirm('Delete this post?')) return
    await deletePost(id); getPosts().then(setPosts)
  }

  if (user === undefined) return <div className="loading">Loading…</div>
  if (!user) return <LoginScreen />

  const TABS = [
    { id: 'cakes', label: '🎂 Cakes' },
    { id: 'recipes', label: '📖 Recipes' },
    { id: 'calendar', label: '📅 Calendar' },
    { id: 'settings', label: '⚙️ Settings' },
  ]

  return (
    <div className="admin">
      <header className="admin-header">
        <div className="admin-header__inner">
          <div className="admin-brand">
            <img src="/images/biz-card.jpg" alt="Pam's" className="admin-logo" />
            <span>Kitchen Manager</span>
          </div>
          <nav className="admin-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`admin-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </nav>
          <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
            <a href="/" target="_blank" className="btn btn-outline btn-sm">View Site →</a>
            <button className="btn btn-sm" style={{ color:'var(--text-muted)' }} onClick={signOut}>Sign Out</button>
          </div>
        </div>
      </header>

      <main className="admin-main">

        {/* ── Cakes Tab ── */}
        {tab === 'cakes' && (
          <div>
            {(showNewCake || editingCake) ? (
              <CakeEditor cake={editingCake} onSave={refreshCakes} onCancel={() => { setShowNewCake(false); setEditingCake(null) }} />
            ) : (
              <>
                <div className="tab-header">
                  <h2>Cakes</h2>
                  <button className="btn btn-sage" onClick={() => setShowNewCake(true)}>+ Add New Cake</button>
                </div>
                {cakes.length === 0 ? <p className="empty-msg">No cakes yet. Add your first one!</p> : (
                  <div className="admin-list">
                    {cakes.map(cake => (
                      <div key={cake.id} className="admin-item">
                        <div className="admin-item__img">
                          {cake.image_url ? <img src={cake.image_url} alt={cake.title} /> : <div className="img-placeholder">🎂</div>}
                        </div>
                        <div className="admin-item__info">
                          <strong>{cake.title}</strong>
                          <span>${Number(cake.price).toLocaleString()} · {cake.category}</span>
                          <div style={{ display:'flex', gap:'0.4rem', marginTop:'0.3rem' }}>
                            {cake.featured && <span className="badge badge-brown">Featured</span>}
                            <span className={`badge ${cake.available ? 'badge-sage' : ''}`} style={!cake.available ? { background:'#fee', color:'#c0392b' } : {}}>{cake.available ? 'Available' : 'Unavailable'}</span>
                          </div>
                        </div>
                        <div className="admin-item__actions">
                          <button className="btn btn-outline btn-sm" onClick={() => setEditingCake(cake)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCake(cake.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Recipes Tab ── */}
        {tab === 'recipes' && (
          <div>
            {(showNewPost || editingPost) ? (
              <PostEditor post={editingPost} onSave={refreshPosts} onCancel={() => { setShowNewPost(false); setEditingPost(null) }} />
            ) : (
              <>
                <div className="tab-header">
                  <h2>Recipes & Blog Posts</h2>
                  <button className="btn btn-sage" onClick={() => setShowNewPost(true)}>+ Add New Post</button>
                </div>
                {posts.length === 0 ? <p className="empty-msg">No posts yet.</p> : (
                  <div className="admin-list">
                    {posts.map(post => (
                      <div key={post.id} className="admin-item">
                        <div className="admin-item__img">
                          {post.image_url ? <img src={post.image_url} alt={post.title} /> : <div className="img-placeholder">📖</div>}
                        </div>
                        <div className="admin-item__info">
                          <strong>{post.title}</strong>
                          <span>{new Date(post.date).toLocaleDateString()}</span>
                          <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>{post.excerpt?.slice(0,80)}…</p>
                        </div>
                        <div className="admin-item__actions">
                          <button className="btn btn-outline btn-sm" onClick={() => setEditingPost(post)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeletePost(post.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Calendar Tab ── */}
        {tab === 'calendar' && <CalendarEditor />}

        {/* ── Settings Tab ── */}
        {tab === 'settings' && <SettingsEditor />}

      </main>
    </div>
  )
}
