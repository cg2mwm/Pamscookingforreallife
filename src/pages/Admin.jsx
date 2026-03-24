import { useState, useEffect } from 'react'
import { supabase, getCakes, saveCake, deleteCake, getPosts, savePost, deletePost,
  getSetting, setSetting, getAvailability, saveAvailability, deleteAvailability,
  uploadImage, getOrders, updateOrderStatus, deleteOrder } from '../supabase'
import './Admin.css'

// ─── Auth ────────────────────────────────────────────────────
function LoginScreen() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) { setErr('Wrong email or password.'); setLoading(false) }
  }
  return (
    <div className="login-screen">
      <div className="login-box">
        <img src="/images/biz-card.jpg" alt="Pam's Cooking" className="login-logo" />
        <h2>Kitchen Door</h2>
        <p>Private access only</p>
        <form onSubmit={submit} className="login-form">
          <div className="form-field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
          <div className="form-field"><label>Password</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} required /></div>
          {err && <p className="login-err">{err}</p>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  )
}

// ─── Image Upload ─────────────────────────────────────────────
function ImgUpload({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const handle = async e => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    try { onChange(await uploadImage(file)) }
    catch(err) { alert('Upload failed: ' + err.message) }
    finally { setUploading(false) }
  }
  return (
    <div className="form-field">
      <label>{label}</label>
      <div className="img-upload-row">
        {value && <img src={value} alt="" className="img-thumb" />}
        <label className="btn btn-outline btn-sm" style={{ opacity: uploading ? 0.6 : 1 }}>
          {uploading ? 'Uploading…' : value ? 'Replace' : 'Upload Image'}
          <input type="file" accept="image/*" onChange={handle} style={{ display:'none' }} disabled={uploading} />
        </label>
        {value && <button className="btn btn-sm" style={{ color:'var(--red)' }} onClick={() => onChange('')}>Remove</button>}
      </div>
      {value && <input className="url-input" type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder="or paste image URL" />}
    </div>
  )
}

// ─── Cake Editor ─────────────────────────────────────────────
function CakeEditor({ cake, onSave, onCancel }) {
  const [form, setForm] = useState(cake || { title:'',price:'',deposit_percent:30,description:'',category:'',servings:'',available:true,featured:false,image_url:'',gallery:[],allergens:[],body:'' })
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const save = async () => {
    if (!form.title || !form.price) return alert('Title and price are required.')
    setSaving(true); await saveCake({...form, price:parseFloat(form.price)}); setSaving(false); onSave()
  }
  return (
    <div className="editor-panel">
      <div className="editor-header">
        <h3>{cake?.id ? 'Edit Cake' : 'New Cake'}</h3>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-sage btn-sm" onClick={save} disabled={saving}>{saving?'Saving…':'Save Cake'}</button>
        </div>
      </div>
      <div className="editor-body">
        <div className="form-row-2">
          <div className="form-field"><label>Cake Name *</label><input value={form.title} onChange={e=>set('title',e.target.value)} /></div>
          <div className="form-field"><label>Category</label>
            <select value={form.category} onChange={e=>set('category',e.target.value)}>
              <option value="">Select…</option>
              {['Wedding','Birthday','Anniversary','Custom','Seasonal'].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row-2">
          <div className="form-field"><label>Price ($) *</label><input type="number" value={form.price} onChange={e=>set('price',e.target.value)} /></div>
          <div className="form-field"><label>Deposit %</label><input type="number" value={form.deposit_percent} onChange={e=>set('deposit_percent',e.target.value)} /></div>
        </div>
        <div className="form-field"><label>Short Description</label><textarea rows={3} value={form.description} onChange={e=>set('description',e.target.value)} /></div>
        <div className="form-field"><label>Serves</label><input value={form.servings} onChange={e=>set('servings',e.target.value)} placeholder="20-25 people" /></div>
        <ImgUpload label="Main Image" value={form.image_url} onChange={v=>set('image_url',v)} />
        <div className="form-field"><label>Allergens (comma separated)</label><input value={form.allergens?.join(', ')} onChange={e=>set('allergens',e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} placeholder="Dairy, Gluten, Eggs" /></div>
        <div className="form-field"><label>Full Details</label><textarea rows={6} value={form.body} onChange={e=>set('body',e.target.value)} /></div>
        <div className="toggle-row">
          <label className="toggle"><input type="checkbox" checked={form.available} onChange={e=>set('available',e.target.checked)} /><span>Available for orders</span></label>
          <label className="toggle"><input type="checkbox" checked={form.featured} onChange={e=>set('featured',e.target.checked)} /><span>Featured on homepage</span></label>
        </div>
      </div>
    </div>
  )
}

// ─── Post Editor ─────────────────────────────────────────────
function PostEditor({ post, onSave, onCancel }) {
  const [form, setForm] = useState(post || { title:'',date:new Date().toISOString().split('T')[0],excerpt:'',image_url:'',external_video_url:'',tags:[],body:'' })
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const save = async () => {
    if (!form.title) return alert('Title is required.')
    setSaving(true)
    await savePost({...form, tags: typeof form.tags==='string' ? form.tags.split(',').map(s=>s.trim()) : form.tags})
    setSaving(false); onSave()
  }
  return (
    <div className="editor-panel">
      <div className="editor-header">
        <h3>{post?.id ? 'Edit Post' : 'New Post'}</h3>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-sage btn-sm" onClick={save} disabled={saving}>{saving?'Saving…':'Save Post'}</button>
        </div>
      </div>
      <div className="editor-body">
        <div className="form-row-2">
          <div className="form-field"><label>Title *</label><input value={form.title} onChange={e=>set('title',e.target.value)} /></div>
          <div className="form-field"><label>Date</label><input type="date" value={form.date?.split('T')[0]} onChange={e=>set('date',e.target.value)} /></div>
        </div>
        <div className="form-field"><label>Excerpt</label><textarea rows={2} value={form.excerpt} onChange={e=>set('excerpt',e.target.value)} /></div>
        <ImgUpload label="Hero Image" value={form.image_url} onChange={v=>set('image_url',v)} />
        <div className="form-field"><label>YouTube / Vimeo URL</label><input value={form.external_video_url} onChange={e=>set('external_video_url',e.target.value)} placeholder="https://youtube.com/..." /></div>
        <div className="form-field"><label>Tags (comma separated)</label><input value={Array.isArray(form.tags)?form.tags.join(', '):form.tags} onChange={e=>set('tags',e.target.value)} placeholder="Tutorial, Frosting" /></div>
        <div className="form-field"><label>Full Content</label><textarea rows={10} value={form.body} onChange={e=>set('body',e.target.value)} /></div>
      </div>
    </div>
  )
}

// ─── Visual Calendar Editor ───────────────────────────────────
function CalendarEditor() {
  const [avail, setAvail] = useState([])
  const [newDate, setNewDate] = useState('')
  const [newSlots, setNewSlots] = useState('')
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  const load = () => getAvailability().then(setAvail)
  useEffect(()=>{ load() },[])

  const availMap = {}
  avail.forEach(a => { availMap[a.date] = a })

  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate()
  const cells = []
  for (let i=0; i<firstDay; i++) cells.push(null)
  for (let d=1; d<=daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push({ d, dateStr, row: availMap[dateStr]||null })
  }

  const addDate = async () => {
    if (!newDate) return
    const slots = newSlots.split(',').map(s=>s.trim()).filter(Boolean)
    await saveAvailability({ date:newDate, slots, booked:false })
    setNewDate(''); setNewSlots(''); load()
  }
  const toggleBooked = async row => { await saveAvailability({...row, booked:!row.booked}); load() }
  const removeDate = async id => { if (!confirm('Remove this date?')) return; await deleteAvailability(id); load() }

  return (
    <div>
      <h3 className="tab-title">Manage Availability</h3>
      <p style={{color:'var(--text-muted)',marginBottom:'1.5rem',fontSize:'0.9rem'}}>These are the dates customers can choose for cake pickup. Add dates here and they'll appear in the order calendar.</p>

      <div className="admin-cal-nav">
        <button className="btn btn-outline btn-sm" onClick={()=>{ if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11)}else setCalMonth(m=>m-1) }}>‹ Prev</button>
        <span className="admin-cal-month">{MONTHS[calMonth]} {calYear}</span>
        <button className="btn btn-outline btn-sm" onClick={()=>{ if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0)}else setCalMonth(m=>m+1) }}>Next ›</button>
      </div>

      <div className="admin-cal-grid">
        {DAYS.map(d=><div key={d} className="admin-cal-dayname">{d}</div>)}
        {cells.map((cell,i)=>{
          if (!cell) return <div key={`e${i}`} className="admin-cal-cell admin-cal-cell--empty" />
          const {d,dateStr,row} = cell
          return (
            <div key={dateStr} className={`admin-cal-cell ${row?(row.booked?'admin-cal-cell--booked':'admin-cal-cell--avail'):''}`}>
              <span className="admin-cal-num">{d}</span>
              {row && (
                <div className="admin-cal-info">
                  {row.booked
                    ? <span className="admin-cal-tag booked">Booked</span>
                    : <span className="admin-cal-tag avail">{row.slots?.length||0} slot{row.slots?.length!==1?'s':''}</span>
                  }
                  <div className="admin-cal-actions">
                    <button title={row.booked?'Mark available':'Mark booked'} onClick={()=>toggleBooked(row)}>{row.booked?'✓':'✕'}</button>
                    <button title="Remove" onClick={()=>removeDate(row.id)} style={{color:'var(--red)'}}>🗑</button>
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
          <div className="form-field"><label>Date</label><input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} /></div>
          <div className="form-field"><label>Time Slots (comma separated, optional)</label><input value={newSlots} onChange={e=>setNewSlots(e.target.value)} placeholder="10:00 AM, 2:00 PM" /></div>
        </div>
        <button className="btn btn-sage" onClick={addDate} disabled={!newDate}>Add Date</button>
      </div>
    </div>
  )
}

// ─── Orders Dashboard ─────────────────────────────────────────
function OrdersDashboard() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = () => getOrders().then(d=>{ setOrders(d); setLoading(false) })
  useEffect(()=>{ load() },[])

  const fmtDate = d => new Date(d+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})
  const fmtTime = d => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})

  const STATUS_COLORS = {
    pending_payment: { bg:'#fff8e6', color:'#b7770a', label:'Awaiting Payment' },
    paid:            { bg:'#e8f5e9', color:'#2e7d32', label:'Deposit Paid' },
    confirmed:       { bg:'#e3f2fd', color:'#1565c0', label:'Confirmed' },
    completed:       { bg:'#f3e5f5', color:'#6a1b9a', label:'Completed' },
    cancelled:       { bg:'#ffebee', color:'#c62828', label:'Cancelled' },
  }

  const filtered = filter === 'all' ? orders : orders.filter(o=>o.status===filter)

  const changeStatus = async (id, status) => { await updateOrderStatus(id, status); load() }
  const removeOrder = async id => { if (!confirm('Delete this order?')) return; await deleteOrder(id); load() }

  return (
    <div>
      <h3 className="tab-title">Orders</h3>

      {/* Summary cards */}
      <div className="order-summary-cards">
        {[
          { label:'All Orders', key:'all', icon:'📋' },
          { label:'Awaiting Payment', key:'pending_payment', icon:'⏳' },
          { label:'Deposit Paid', key:'paid', icon:'✅' },
          { label:'Confirmed', key:'confirmed', icon:'📅' },
        ].map(card => (
          <button key={card.key} className={`summary-card ${filter===card.key?'active':''}`} onClick={()=>setFilter(card.key)}>
            <span className="summary-card__icon">{card.icon}</span>
            <span className="summary-card__count">{card.key==='all'?orders.length:orders.filter(o=>o.status===card.key).length}</span>
            <span className="summary-card__label">{card.label}</span>
          </button>
        ))}
      </div>

      {loading ? <p className="loading">Loading orders…</p>
        : filtered.length === 0
          ? <div className="empty-msg">
              {filter==='all' ? 'No orders yet — they\'ll appear here when customers place them.' : `No ${STATUS_COLORS[filter]?.label||filter} orders.`}
            </div>
          : (
          <div className="orders-list">
            {filtered.map(order => {
              const s = STATUS_COLORS[order.status] || { bg:'#f5f5f5', color:'#666', label: order.status }
              return (
                <div key={order.id} className="order-card">
                  <div className="order-card__img">
                    {order.cake_image ? <img src={order.cake_image} alt={order.cake_title} /> : <div className="img-placeholder">🎂</div>}
                  </div>
                  <div className="order-card__info">
                    <div className="order-card__top">
                      <strong className="order-card__name">{order.customer_name}</strong>
                      <span className="order-status-badge" style={{background:s.bg, color:s.color}}>{s.label}</span>
                    </div>
                    <div className="order-card__cake">🎂 {order.cake_title}</div>
                    <div className="order-card__details">
                      <span>📅 Pickup: <strong>{fmtDate(order.pickup_date)}</strong></span>
                      <span>💰 Deposit: <strong>${Number(order.deposit_amount).toFixed(2)}</strong></span>
                      <span>✉️ {order.customer_email}</span>
                      {order.customer_phone && <span>📞 {order.customer_phone}</span>}
                    </div>
                    {order.notes && <div className="order-card__notes">💬 {order.notes}</div>}
                    <div className="order-card__meta">Ordered {fmtTime(order.created_at)}</div>
                  </div>
                  <div className="order-card__actions">
                    <select
                      value={order.status}
                      onChange={e=>changeStatus(order.id, e.target.value)}
                      className="status-select"
                      style={{borderColor: s.color, color: s.color}}
                    >
                      <option value="pending_payment">Awaiting Payment</option>
                      <option value="paid">Deposit Paid</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button className="btn btn-danger btn-sm" onClick={()=>removeOrder(order.id)}>Delete</button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}

// ─── Page Editor ─────────────────────────────────────────────
function PageEditor() {
  const PAGES = [
    { key:'page_home',    label:'🏠 Home Page' },
    { key:'page_cakes',   label:'🎂 Cakes Page' },
    { key:'page_recipes', label:'📖 Recipes Page' },
    { key:'page_booking', label:'📅 Booking Page' },
  ]
  const [activePage, setActivePage] = useState('page_home')
  const [content, setContent] = useState({})
  const [homepage, setHomepage] = useState(null)
  const [payments, setPayments] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(()=>{
    PAGES.forEach(p => getSetting(p.key).then(v => setContent(c=>({...c,[p.key]:v||{}}))))
    getSetting('homepage').then(d=>setHomepage(d||{bakeryName:"Pam's Cooking for Real Life",tagline:'',aboutStory:'',phone:'',email:'',instagram:''}))
    getSetting('payments').then(d=>setPayments(d||{method:'PayPal',payment_id:'',custom_instructions:''}))
  },[])

  const setC = (k,v) => setContent(c=>({...c,[activePage]:{...c[activePage],[k]:v}}))
  const setH = (k,v) => setHomepage(h=>({...h,[k]:v}))
  const setP = (k,v) => setPayments(p=>({...p,[k]:v}))

  const save = async () => {
    setSaving(true)
    await setSetting(activePage, content[activePage])
    if (homepage) await setSetting('homepage', homepage)
    if (payments) await setSetting('payments', payments)
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),3000)
  }

  const pg = content[activePage] || {}

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
        <h3 className="tab-title" style={{marginBottom:0}}>Edit Pages</h3>
        <button className="btn btn-sage" onClick={save} disabled={saving}>
          {saving?'Saving…':saved?'✓ Saved!':'Save Changes'}
        </button>
      </div>

      {/* Page tabs */}
      <div className="page-tabs">
        {PAGES.map(p=>(
          <button key={p.key} className={`page-tab ${activePage===p.key?'active':''}`} onClick={()=>setActivePage(p.key)}>{p.label}</button>
        ))}
      </div>

      <div className="settings-section">
        {/* HOME PAGE */}
        {activePage==='page_home' && homepage && (
          <>
            <h4>Hero Section</h4>
            <div className="form-field"><label>Bakery Name / Hero Title</label><input value={homepage.bakeryName||''} onChange={e=>setH('bakeryName',e.target.value)} /></div>
            <div className="form-field"><label>Hero Tagline</label><input value={homepage.tagline||''} onChange={e=>setH('tagline',e.target.value)} /></div>
            <h4 style={{marginTop:'0.5rem'}}>Featured Cakes Section</h4>
            <div className="form-field"><label>Section Heading</label><input value={pg.featured_heading||''} onChange={e=>setC('featured_heading',e.target.value)} placeholder="Featured Cakes" /></div>
            <div className="form-field"><label>Section Subtext</label><input value={pg.featured_subtext||''} onChange={e=>setC('featured_subtext',e.target.value)} /></div>
            <h4 style={{marginTop:'0.5rem'}}>About / Story Section</h4>
            <div className="form-field"><label>About Heading</label><input value={pg.about_heading||''} onChange={e=>setC('about_heading',e.target.value)} placeholder="Real food. Real love." /></div>
            <div className="form-field"><label>Your Story (use blank lines for paragraphs)</label><textarea rows={6} value={homepage.aboutStory||''} onChange={e=>setH('aboutStory',e.target.value)} /></div>
            <h4 style={{marginTop:'0.5rem'}}>Bottom Call-to-Action</h4>
            <div className="form-field"><label>CTA Heading</label><input value={pg.cta_heading||''} onChange={e=>setC('cta_heading',e.target.value)} placeholder="Ready for your dream cake?" /></div>
            <div className="form-field"><label>CTA Subtext</label><input value={pg.cta_subtext||''} onChange={e=>setC('cta_subtext',e.target.value)} /></div>
            <h4 style={{marginTop:'0.5rem'}}>Contact Info (shown in footer + about section)</h4>
            <div className="form-row-2">
              <div className="form-field"><label>Phone</label><input value={homepage.phone||''} onChange={e=>setH('phone',e.target.value)} placeholder="(336) 555-0100" /></div>
              <div className="form-field"><label>Email</label><input value={homepage.email||''} onChange={e=>setH('email',e.target.value)} /></div>
            </div>
            <div className="form-field"><label>Instagram Handle (without @)</label><input value={homepage.instagram||''} onChange={e=>setH('instagram',e.target.value)} /></div>
          </>
        )}

        {/* CAKES PAGE */}
        {activePage==='page_cakes' && (
          <>
            <h4>Page Header</h4>
            <div className="form-field"><label>Page Heading</label><input value={pg.heading||''} onChange={e=>setC('heading',e.target.value)} placeholder="Cake Catalog" /></div>
            <div className="form-field"><label>Page Subtext</label><input value={pg.subtext||''} onChange={e=>setC('subtext',e.target.value)} /></div>
            <p className="settings-hint">To add, edit, or remove individual cakes, use the 🎂 Cakes tab.</p>
          </>
        )}

        {/* RECIPES PAGE */}
        {activePage==='page_recipes' && (
          <>
            <h4>Page Header</h4>
            <div className="form-field"><label>Page Heading</label><input value={pg.heading||''} onChange={e=>setC('heading',e.target.value)} placeholder="Recipes & Tips" /></div>
            <div className="form-field"><label>Page Subtext</label><input value={pg.subtext||''} onChange={e=>setC('subtext',e.target.value)} /></div>
            <p className="settings-hint">To add, edit, or remove individual recipes, use the 📖 Recipes tab.</p>
          </>
        )}

        {/* BOOKING PAGE */}
        {activePage==='page_booking' && (
          <>
            <h4>Page Header</h4>
            <div className="form-field"><label>Page Heading</label><input value={pg.heading||''} onChange={e=>setC('heading',e.target.value)} placeholder="Book a Consultation" /></div>
            <div className="form-field"><label>Page Subtext</label><input value={pg.subtext||''} onChange={e=>setC('subtext',e.target.value)} /></div>
            <div className="form-field"><label>Sidebar Info Text (one item per line)</label><textarea rows={5} value={pg.sidebar_text||''} onChange={e=>setC('sidebar_text',e.target.value)} placeholder={"30-minute call\nDiscuss your cake design\nPricing details"} /></div>
            <p className="settings-hint">To manage available dates, use the 📅 Calendar tab.</p>
          </>
        )}
      </div>

      {/* Payment settings always visible */}
      {payments && (
        <div className="settings-section" style={{marginTop:'1.5rem'}}>
          <h4>💳 Payment Settings</h4>
          <p style={{fontSize:'0.85rem',color:'var(--text-muted)',marginBottom:'1rem'}}>When customers pay their deposit, they're sent to this payment link.</p>
          <div className="form-row-2">
            <div className="form-field"><label>Payment Method</label>
              <select value={payments.method} onChange={e=>setP('method',e.target.value)}>
                {['PayPal','Venmo','CashApp','Zelle','BankTransfer','Custom'].map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-field"><label>Your PayPal email / Handle</label><input value={payments.payment_id||''} onChange={e=>setP('payment_id',e.target.value)} placeholder="youremail@gmail.com or @Handle" /></div>
          </div>
          <div className="form-field"><label>Custom Instructions (for Zelle, Bank Transfer, or Custom)</label><textarea rows={2} value={payments.custom_instructions||''} onChange={e=>setP('custom_instructions',e.target.value)} /></div>
        </div>
      )}
    </div>
  )
}

// ─── Main Admin Shell ─────────────────────────────────────────
export default function Admin() {
  const [user, setUser] = useState(undefined)
  const [tab, setTab] = useState('orders')
  const [cakes, setCakes] = useState([])
  const [posts, setPosts] = useState([])
  const [editingCake, setEditingCake] = useState(null)
  const [editingPost, setEditingPost] = useState(null)
  const [showNewCake, setShowNewCake] = useState(false)
  const [showNewPost, setShowNewPost] = useState(false)

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setUser(data.session?.user||null))
    supabase.auth.onAuthStateChange((_,s)=>setUser(s?.user||null))
  },[])

  useEffect(()=>{ if (!user) return; getCakes().then(setCakes); getPosts().then(setPosts) },[user])

  if (user===undefined) return <div className="loading">Loading…</div>
  if (!user) return <LoginScreen />

  const refreshCakes = () => { getCakes().then(setCakes); setEditingCake(null); setShowNewCake(false) }
  const refreshPosts = () => { getPosts().then(setPosts); setEditingPost(null); setShowNewPost(false) }
  const delCake = async id => { if (!confirm('Delete this cake?')) return; await deleteCake(id); getCakes().then(setCakes) }
  const delPost = async id => { if (!confirm('Delete this post?')) return; await deletePost(id); getPosts().then(setPosts) }

  const TABS = [
    { id:'orders',   label:'📋 Orders' },
    { id:'cakes',    label:'🎂 Cakes' },
    { id:'recipes',  label:'📖 Recipes' },
    { id:'calendar', label:'📅 Calendar' },
    { id:'pages',    label:'✏️ Edit Pages' },
  ]

  return (
    <div className="admin">
      <header className="admin-header">
        <div className="admin-header__inner">
          <div className="admin-brand">
            <img src="/images/biz-card.jpg" alt="" className="admin-logo" />
            <span>Kitchen Manager</span>
          </div>
          <nav className="admin-tabs">
            {TABS.map(t=>(
              <button key={t.id} className={`admin-tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>{t.label}</button>
            ))}
          </nav>
          <div style={{display:'flex',gap:'1rem',alignItems:'center',flexShrink:0}}>
            <a href="/" target="_blank" className="btn btn-outline btn-sm">View Site →</a>
            <button className="btn btn-sm" style={{color:'var(--text-muted)'}} onClick={()=>supabase.auth.signOut()}>Sign Out</button>
          </div>
        </div>
      </header>

      <main className="admin-main">

        {/* ── Orders ── */}
        {tab==='orders' && <OrdersDashboard />}

        {/* ── Cakes ── */}
        {tab==='cakes' && (
          <div>
            {(showNewCake||editingCake) ? (
              <CakeEditor cake={editingCake} onSave={refreshCakes} onCancel={()=>{setShowNewCake(false);setEditingCake(null)}} />
            ) : (
              <>
                <div className="tab-header">
                  <h2>Cakes</h2>
                  <button className="btn btn-sage" onClick={()=>setShowNewCake(true)}>+ Add New Cake</button>
                </div>
                {cakes.length===0 ? <p className="empty-msg">No cakes yet. Add your first one!</p> : (
                  <div className="admin-list">
                    {cakes.map(cake=>(
                      <div key={cake.id} className="admin-item">
                        <div className="admin-item__img">{cake.image_url?<img src={cake.image_url} alt={cake.title}/>:<div className="img-placeholder">🎂</div>}</div>
                        <div className="admin-item__info">
                          <strong>{cake.title}</strong>
                          <span>${Number(cake.price).toLocaleString()} · {cake.category}</span>
                          <div style={{display:'flex',gap:'0.4rem',marginTop:'0.3rem',flexWrap:'wrap'}}>
                            {cake.featured&&<span className="badge badge-brown">Featured</span>}
                            <span className="badge" style={cake.available?{background:'var(--sage-pale)',color:'var(--sage-dark)'}:{background:'#fee',color:'#c0392b'}}>{cake.available?'Available':'Unavailable'}</span>
                          </div>
                        </div>
                        <div className="admin-item__actions">
                          <button className="btn btn-outline btn-sm" onClick={()=>setEditingCake(cake)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={()=>delCake(cake.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Recipes ── */}
        {tab==='recipes' && (
          <div>
            {(showNewPost||editingPost) ? (
              <PostEditor post={editingPost} onSave={refreshPosts} onCancel={()=>{setShowNewPost(false);setEditingPost(null)}} />
            ) : (
              <>
                <div className="tab-header">
                  <h2>Recipes & Blog Posts</h2>
                  <button className="btn btn-sage" onClick={()=>setShowNewPost(true)}>+ Add New Post</button>
                </div>
                {posts.length===0 ? <p className="empty-msg">No posts yet.</p> : (
                  <div className="admin-list">
                    {posts.map(post=>(
                      <div key={post.id} className="admin-item">
                        <div className="admin-item__img">{post.image_url?<img src={post.image_url} alt={post.title}/>:<div className="img-placeholder">📖</div>}</div>
                        <div className="admin-item__info">
                          <strong>{post.title}</strong>
                          <span>{new Date(post.date).toLocaleDateString()}</span>
                          <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:'0.2rem'}}>{post.excerpt?.slice(0,80)}{post.excerpt?.length>80?'…':''}</p>
                        </div>
                        <div className="admin-item__actions">
                          <button className="btn btn-outline btn-sm" onClick={()=>setEditingPost(post)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={()=>delPost(post.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Calendar ── */}
        {tab==='calendar' && <CalendarEditor />}

        {/* ── Pages ── */}
        {tab==='pages' && <PageEditor />}

      </main>
    </div>
  )
}
