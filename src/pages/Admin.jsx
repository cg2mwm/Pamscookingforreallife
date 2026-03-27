import { useState, useEffect } from 'react'
import { supabase, getCakes, saveCake, deleteCake, getBooks, saveBook, deleteBook,
  getPosts, savePost, deletePost, getSetting, setSetting,
  getAvailability, saveAvailability, deleteAvailability,
  getOrders, updateOrderStatus, deleteOrder,
  getContactRequests, updateContactStatus, deleteContactRequest,
  getGalleries, saveGallery, deleteGallery,
  getGalleryPhotos, saveGalleryPhoto, deleteGalleryPhoto,
  updateSortOrder,
  uploadImage } from '../supabase'
import { applyTheme, loadFont } from '../components/ApplyTheme'
import './Admin.css'


// ─── Sortable List (drag to reorder) ─────────────────────────
function SortableList({ items, onReorder, renderItem }) {
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const handleDragStart = (e, index) => {
    setDragging(index)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(index)
  }
  const handleDrop = (e, index) => {
    e.preventDefault()
    if (dragging === null || dragging === index) { setDragging(null); setDragOver(null); return }
    const reordered = [...items]
    const [moved] = reordered.splice(dragging, 1)
    reordered.splice(index, 0, moved)
    onReorder(reordered)
    setDragging(null)
    setDragOver(null)
  }
  const handleDragEnd = () => { setDragging(null); setDragOver(null) }

  return (
    <div className="sortable-list">
      {items.map((item, i) => (
        <div
          key={item.id}
          className={`sortable-item ${dragging === i ? 'dragging' : ''} ${dragOver === i ? 'drag-over' : ''}`}
          draggable
          onDragStart={e => handleDragStart(e, i)}
          onDragOver={e => handleDragOver(e, i)}
          onDrop={e => handleDrop(e, i)}
          onDragEnd={handleDragEnd}
        >
          <div className="drag-handle" title="Drag to reorder">⠿</div>
          {renderItem(item)}
        </div>
      ))}
    </div>
  )
}

// ─── Custom Category Input ────────────────────────────────────
function CategoryInput({ value, onChange, options }) {
  const [custom, setCustom] = useState(false)
  const isCustom = value && !options.includes(value)

  return (
    <div className="form-field">
      <label>Category</label>
      {(!custom && !isCustom) ? (
        <div style={{display:'flex',gap:'0.5rem'}}>
          <select value={value} onChange={e => { if (e.target.value === '__custom__') setCustom(true); else onChange(e.target.value) }} style={{flex:1}}>
            <option value="">Select…</option>
            {options.map(o => <option key={o}>{o}</option>)}
            <option value="__custom__">+ Type a custom category…</option>
          </select>
        </div>
      ) : (
        <div style={{display:'flex',gap:'0.5rem'}}>
          <input value={value} onChange={e => onChange(e.target.value)} placeholder="Type your category…" style={{flex:1}} autoFocus />
          <button className="btn btn-outline btn-sm" onClick={() => { onChange(''); setCustom(false) }}>← Back</button>
        </div>
      )}
    </div>
  )
}

// ─── Login ───────────────────────────────────────────────────
function LoginScreen() {
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [err,   setErr]   = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async e => {
    e.preventDefault(); setErr(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) { setErr('Wrong email or password.'); setLoading(false) }
  }
  return (
    <div className="login-screen">
      <div className="login-box">
        <img src="/images/biz-card.jpg" alt="Pam's" className="login-logo" />
        <h2>Kitchen Door</h2>
        <p>Private access only</p>
        <form onSubmit={submit} className="login-form">
          <div className="form-field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
          <div className="form-field"><label>Password</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} required /></div>
          {err && <p className="login-err">{err}</p>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading?'Signing in…':'Sign In'}</button>
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
        <label className="btn btn-outline btn-sm" style={{opacity:uploading?0.6:1,cursor:'pointer'}}>
          {uploading ? 'Uploading…' : value ? 'Replace Image' : 'Upload Image'}
          <input type="file" accept="image/*" onChange={handle} style={{display:'none'}} disabled={uploading} />
        </label>
        {value && <button className="btn btn-sm" style={{color:'var(--red)'}} onClick={()=>onChange('')}>Remove</button>}
      </div>
      {value && <input className="url-input" type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder="or paste image URL" />}
    </div>
  )
}

// ─── Cake Editor ─────────────────────────────────────────────
function CakeEditor({ cake, onSave, onCancel }) {
  const [f, setF] = useState(cake || {title:'',price:'',deposit_percent:30,description:'',category:'',servings:'',available:true,featured:false,image_url:'',allergens:[],body:''})
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setF(x=>({...x,[k]:v}))
  const save = async () => {
    if (!f.title||!f.price) return alert('Title and price required.')
    setSaving(true); await saveCake({...f,price:parseFloat(f.price)}); setSaving(false); onSave()
  }
  return (
    <div className="editor-panel">
      <div className="editor-header">
        <h3>{cake?.id?'Edit Cake':'New Cake'}</h3>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-sage btn-sm" onClick={save} disabled={saving}>{saving?'Saving…':'Save Cake'}</button>
        </div>
      </div>
      <div className="editor-body">
        <div className="form-row-2">
          <div className="form-field"><label>Cake Name *</label><input value={f.title} onChange={e=>set('title',e.target.value)} /></div>
          <CategoryInput value={f.category} onChange={v=>set('category',v)} options={['Wedding','Birthday','Anniversary','Custom','Seasonal']} />
        </div>
        <div className="form-row-2">
          <div className="form-field"><label>Price ($) *</label><input type="number" value={f.price} onChange={e=>set('price',e.target.value)} /></div>
          <div className="form-field"><label>Deposit %</label><input type="number" value={f.deposit_percent} onChange={e=>set('deposit_percent',e.target.value)} /></div>
        </div>
        <div className="form-field"><label>Short Description</label><textarea rows={3} value={f.description} onChange={e=>set('description',e.target.value)} /></div>
        <div className="form-field"><label>Serves</label><input value={f.servings} onChange={e=>set('servings',e.target.value)} placeholder="20-25 people" /></div>
        <ImgUpload label="Main Image" value={f.image_url} onChange={v=>set('image_url',v)} />
        <div className="form-field">
          <label>Allergens (comma separated)</label>
          <input
            value={Array.isArray(f.allergens) ? f.allergens.join(', ') : (f.allergens || '')}
            onChange={e => set('allergens', e.target.value)}
            onBlur={e => set('allergens', e.target.value.split(',').map(s=>s.trim()).filter(Boolean))}
            placeholder="Dairy, Gluten, Eggs"
          />
          <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>Type them separated by commas, e.g. Dairy, Gluten, Eggs</span>
        </div>
        <div className="form-field"><label>Full Details</label><textarea rows={6} value={f.body} onChange={e=>set('body',e.target.value)} /></div>
        <div className="toggle-row">
          <label className="toggle"><input type="checkbox" checked={f.available} onChange={e=>set('available',e.target.checked)} /><span>Available for orders</span></label>
          <label className="toggle"><input type="checkbox" checked={f.featured} onChange={e=>set('featured',e.target.checked)} /><span>Featured on homepage</span></label>
        </div>
      </div>
    </div>
  )
}

// ─── Book Editor ─────────────────────────────────────────────
function BookEditor({ book, onSave, onCancel }) {
  const [f, setF] = useState(book || {title:'',price:'',description:'',category:'Cookbook',image_url:'',buy_link:'',available:true,featured:false})
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setF(x=>({...x,[k]:v}))
  const save = async () => {
    if (!f.title||!f.price) return alert('Title and price required.')
    setSaving(true); await saveBook({...f,price:parseFloat(f.price)}); setSaving(false); onSave()
  }
  return (
    <div className="editor-panel">
      <div className="editor-header">
        <h3>{book?.id?'Edit Book':'New Book'}</h3>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-sage btn-sm" onClick={save} disabled={saving}>{saving?'Saving…':'Save Book'}</button>
        </div>
      </div>
      <div className="editor-body">
        <div className="form-row-2">
          <div className="form-field"><label>Title *</label><input value={f.title} onChange={e=>set('title',e.target.value)} /></div>
          <div className="form-field"><label>Category</label>
            <select value={f.category} onChange={e=>set('category',e.target.value)}>
              {['Cookbook','Recipe Book','Other'].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-field"><label>Price ($) *</label><input type="number" value={f.price} onChange={e=>set('price',e.target.value)} /></div>
        <div className="form-field"><label>Description</label><textarea rows={3} value={f.description} onChange={e=>set('description',e.target.value)} /></div>
        <ImgUpload label="Book Cover Image" value={f.image_url} onChange={v=>set('image_url',v)} />
        <div className="form-field"><label>Buy Link (Amazon, Etsy, etc.)</label><input value={f.buy_link} onChange={e=>set('buy_link',e.target.value)} placeholder="https://amazon.com/…" /></div>
        <div className="toggle-row">
          <label className="toggle"><input type="checkbox" checked={f.available} onChange={e=>set('available',e.target.checked)} /><span>Available</span></label>
          <label className="toggle"><input type="checkbox" checked={f.featured} onChange={e=>set('featured',e.target.checked)} /><span>Featured</span></label>
        </div>
      </div>
    </div>
  )
}

// ─── Post Editor ─────────────────────────────────────────────
function PostEditor({ post, onSave, onCancel }) {
  const [f, setF] = useState(post || {title:'',date:new Date().toISOString().split('T')[0],excerpt:'',image_url:'',external_video_url:'',tags:[],body:''})
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setF(x=>({...x,[k]:v}))
  const save = async () => {
    if (!f.title) return alert('Title required.')
    setSaving(true)
    await savePost({...f, tags: typeof f.tags==='string'?f.tags.split(',').map(s=>s.trim()):f.tags})
    setSaving(false); onSave()
  }
  return (
    <div className="editor-panel">
      <div className="editor-header">
        <h3>{post?.id?'Edit Post':'New Post'}</h3>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-sage btn-sm" onClick={save} disabled={saving}>{saving?'Saving…':'Save Post'}</button>
        </div>
      </div>
      <div className="editor-body">
        <div className="form-row-2">
          <div className="form-field"><label>Title *</label><input value={f.title} onChange={e=>set('title',e.target.value)} /></div>
          <div className="form-field"><label>Date</label><input type="date" value={f.date?.split('T')[0]} onChange={e=>set('date',e.target.value)} /></div>
        </div>
        <div className="form-field"><label>Excerpt</label><textarea rows={2} value={f.excerpt} onChange={e=>set('excerpt',e.target.value)} /></div>
        <ImgUpload label="Hero Image" value={f.image_url} onChange={v=>set('image_url',v)} />
        <div className="form-field"><label>YouTube/Vimeo URL</label><input value={f.external_video_url} onChange={e=>set('external_video_url',e.target.value)} placeholder="https://youtube.com/…" /></div>
        <div className="form-field"><label>Tags (comma separated)</label><input value={Array.isArray(f.tags)?f.tags.join(', '):f.tags} onChange={e=>set('tags',e.target.value)} /></div>
        <div className="form-field"><label>Full Content</label><textarea rows={10} value={f.body} onChange={e=>set('body',e.target.value)} /></div>
      </div>
    </div>
  )
}


// ─── Calendar Editor ──────────────────────────────────────────
const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December']
const CAL_DAYS     = ['Su','Mo','Tu','We','Th','Fr','Sa']
const HOURS        = ['6','7','8','9','10','11','12','1','2','3','4','5','6','7','8','9']
const MINUTES      = ['00','15','30','45']
const AMPM         = ['AM','PM']

function CalPicker({ onSelect }) {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const cells = []
  for (let i=0;i<firstDay;i++) cells.push(null)
  for (let d=1;d<=daysInMonth;d++) {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push({ d, ds, isPast: new Date(ds) <= new Date(today.toDateString()) })
  }
  const prev = () => { if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }
  const next = () => { if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }
  return (
    <div className="cal-picker">
      <div className="cal-picker__nav">
        <button onClick={prev} className="btn btn-outline btn-sm">‹</button>
        <span>{MONTHS_FULL[month]} {year}</span>
        <button onClick={next} className="btn btn-outline btn-sm">›</button>
      </div>
      <div className="cal-picker__grid">
        {CAL_DAYS.map(d=><div key={d} className="cp-dayname">{d}</div>)}
        {cells.map((cell,i)=>{
          if (!cell) return <div key={`e${i}`} className="cp-cell cp-cell--empty" />
          return (
            <button key={cell.ds} disabled={cell.isPast}
              className={`cp-cell ${cell.isPast?'cp-cell--past':'cp-cell--active'}`}
              onClick={()=>onSelect(cell.ds)}
            >{cell.d}</button>
          )
        })}
      </div>
    </div>
  )
}

function TimeDropdown({ onChange }) {
  const [h, setH]   = useState('10')
  const [m, setM]   = useState('00')
  const [ap, setAp] = useState('AM')
  useEffect(() => { onChange(`${h}:${m} ${ap}`) }, [h, m, ap])
  return (
    <div className="time-dropdown">
      <select value={h}  onChange={e=>setH(e.target.value)}>  {HOURS.map((hr,i)=><option key={i} value={hr}>{hr}</option>)}</select>
      <span>:</span>
      <select value={m}  onChange={e=>setM(e.target.value)}>  {MINUTES.map(mn=><option key={mn} value={mn}>{mn}</option>)}</select>
      <select value={ap} onChange={e=>setAp(e.target.value)}> {AMPM.map(a=><option key={a}>{a}</option>)}</select>
    </div>
  )
}

function CalendarEditor() {
  const [avail, setAvail]         = useState([])
  const [showPicker, setShowPicker] = useState(false)
  const [pendingDate, setPendingDate] = useState(null)
  const [pendingSlots, setPendingSlots] = useState([])
  const [currentTime, setCurrentTime]   = useState('10:00 AM')
  const [addType, setAddType]     = useState('pickup') // 'pickup' | 'consultation'
  const [viewType, setViewType]   = useState('all')
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const load = () => getAvailability().then(setAvail)
  useEffect(()=>{ load() },[])

  const availMap = {}
  avail.forEach(a=>{ availMap[a.date]=a })

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const cells = []
  for (let i=0;i<firstDay;i++) cells.push(null)
  for (let d=1;d<=daysInMonth;d++) {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push({ d, ds, row: availMap[ds]||null })
  }

  const fmtDate = d => new Date(d+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})

  const handlePickDate = ds => { setPendingDate(ds); setPendingSlots([]); setShowPicker(false) }
  const addTimeSlot    = () => { if(!pendingSlots.includes(currentTime)) setPendingSlots(s=>[...s,currentTime]) }
  const removeSlot     = s  => setPendingSlots(ss=>ss.filter(x=>x!==s))

  const saveDate = async () => {
    if (!pendingDate) return alert('Pick a date first.')
    await saveAvailability({ date:pendingDate, slots:pendingSlots, booked:false, type:addType })
    setPendingDate(null); setPendingSlots([]); load()
  }

  const toggleBooked = async row => { await saveAvailability({...row, booked:!row.booked}); load() }
  const removeDate   = async id  => { if (!confirm('Remove this date?')) return; await deleteAvailability(id); load() }

  // Filter displayed dates by viewType
  const displayCells = cells.map(cell => {
    if (!cell) return cell
    if (viewType === 'all') return cell
    if (!cell.row) return { ...cell, row: null }
    if (cell.row.type !== viewType) return { ...cell, row: null }
    return cell
  })

  return (
    <div>
      <h3 className="tab-title">Manage Availability</h3>

      {/* Type legend */}
      <div className="cal-type-legend">
        <div className="cal-type-item">
          <span className="cal-type-dot pickup" />
          <strong>🎂 Pickup Dates</strong> — for cake orders (customers pick from this list when ordering a cake)
        </div>
        <div className="cal-type-item">
          <span className="cal-type-dot consult" />
          <strong>📅 Consultation Dates</strong> — for booking a consult (shown on the booking/consult page)
        </div>
      </div>

      {/* View filter */}
      <div className="filter-row" style={{marginBottom:'1rem'}}>
        <span style={{fontSize:'0.82rem',color:'var(--text-muted)',alignSelf:'center'}}>Show:</span>
        {[{v:'all',l:'All Dates'},{v:'pickup',l:'🎂 Pickup Only'},{v:'consultation',l:'📅 Consultations Only'}].map(o=>(
          <button key={o.v} className={`filter-btn ${viewType===o.v?'active':''}`} onClick={()=>setViewType(o.v)}>{o.l}</button>
        ))}
      </div>

      {/* Month nav */}
      <div className="admin-cal-nav">
        <button className="btn btn-outline btn-sm" onClick={()=>{if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1)}}>‹ Prev</button>
        <span className="admin-cal-month">{MONTHS_FULL[month]} {year}</span>
        <button className="btn btn-outline btn-sm" onClick={()=>{if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1)}}>Next ›</button>
      </div>

      {/* Calendar grid */}
      <div className="admin-cal-grid">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d} className="admin-cal-dayname">{d}</div>)}
        {displayCells.map((cell,i)=>{
          if (!cell) return <div key={`e${i}`} className="admin-cal-cell admin-cal-cell--empty" />
          const {d, ds, row} = cell
          const typeClass = row ? (row.type==='pickup' ? 'admin-cal-cell--pickup' : 'admin-cal-cell--consult') : ''
          return (
            <div key={ds} className={`admin-cal-cell ${typeClass} ${row?(row.booked?'admin-cal-cell--booked':'admin-cal-cell--avail'):''}`}>
              <span className="admin-cal-num">{d}</span>
              {row && (
                <div className="admin-cal-info">
                  <span className={`admin-cal-type-tag ${row.type}`}>{row.type==='pickup'?'🎂':'📅'}</span>
                  {row.booked
                    ? <span className="admin-cal-tag booked">Booked</span>
                    : <span className="admin-cal-tag avail">{row.slots?.length||0}s</span>
                  }
                  <div className="admin-cal-actions">
                    <button title={row.booked?'Open':'Book'} onClick={()=>toggleBooked(row)}>{row.booked?'↩':'✕'}</button>
                    <button title="Remove" onClick={()=>removeDate(row.id)} style={{color:'var(--red)'}}>🗑</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Date Panel */}
      <div className="add-date-form">
        <h4>Add a Date</h4>

        {/* Type selector */}
        <div className="form-field">
          <label>What type of date is this?</label>
          <div className="type-selector">
            <button className={`type-btn ${addType==='pickup'?'active':''}`} onClick={()=>setAddType('pickup')}>
              🎂 Cake Pickup Date
              <span>Customers pick this when ordering a cake</span>
            </button>
            <button className={`type-btn ${addType==='consultation'?'active':''}`} onClick={()=>setAddType('consultation')}>
              📅 Consultation Date
              <span>Shown on the booking / consult page</span>
            </button>
          </div>
        </div>

        {/* Date picker */}
        <div className="form-field">
          <label>Pick a Date</label>
          <div style={{display:'flex',gap:'0.75rem',alignItems:'center',flexWrap:'wrap'}}>
            <button className="btn btn-outline" onClick={()=>setShowPicker(p=>!p)}>
              {pendingDate ? `📅 ${fmtDate(pendingDate)}` : '📅 Choose Date'}
            </button>
            {pendingDate && <button className="btn btn-sm" style={{color:'var(--red)'}} onClick={()=>setPendingDate(null)}>Clear</button>}
          </div>
          {showPicker && (
            <div className="cal-picker-wrap">
              <CalPicker onSelect={handlePickDate} />
            </div>
          )}
        </div>

        {/* Time slots */}
        {pendingDate && (
          <>
            <div className="form-field">
              <label>Add Time Slots (optional)</label>
              <div style={{display:'flex',gap:'0.75rem',alignItems:'center',flexWrap:'wrap'}}>
                <TimeDropdown onChange={setCurrentTime} />
                <button className="btn btn-outline btn-sm" onClick={addTimeSlot}>+ Add Slot</button>
              </div>
              {pendingSlots.length > 0 && (
                <div className="pending-slots">
                  {pendingSlots.map(s=>(
                    <span key={s} className="pending-slot">{s}<button onClick={()=>removeSlot(s)}>×</button></span>
                  ))}
                </div>
              )}
            </div>
            <button className="btn btn-sage" onClick={saveDate}>
              Save {addType==='pickup'?'🎂 Pickup':'📅 Consultation'} Date: {fmtDate(pendingDate)}
              {pendingSlots.length>0?` · ${pendingSlots.length} slot${pendingSlots.length!==1?'s':''}` : ''}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Orders Dashboard ─────────────────────────────────────────
function OrdersDashboard() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

  const load = () => getOrders().then(d=>{ setOrders(d); setLoading(false) })
  useEffect(()=>{ load() },[])

  const STATUS = {
    pending_payment: { bg:'#fff8e6', color:'#b7770a', label:'Awaiting Payment' },
    paid:            { bg:'#e8f5e9', color:'#2e7d32', label:'Deposit Paid' },
    confirmed:       { bg:'#e3f2fd', color:'#1565c0', label:'Confirmed' },
    completed:       { bg:'#f3e5f5', color:'#6a1b9a', label:'Completed' },
    cancelled:       { bg:'#ffebee', color:'#c62828', label:'Cancelled' },
  }

  const filtered = filter==='all' ? orders : orders.filter(o=>o.status===filter)
  const fmtDate  = d => new Date(d+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})
  const fmtTime  = d => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})

  return (
    <div>
      <h3 className="tab-title">Orders</h3>
      <div className="order-summary-cards">
        {[{label:'All',key:'all',icon:'📋'},{label:'Awaiting Payment',key:'pending_payment',icon:'⏳'},{label:'Deposit Paid',key:'paid',icon:'✅'},{label:'Confirmed',key:'confirmed',icon:'📅'}].map(c=>(
          <button key={c.key} className={`summary-card ${filter===c.key?'active':''}`} onClick={()=>setFilter(c.key)}>
            <span className="summary-card__icon">{c.icon}</span>
            <span className="summary-card__count">{c.key==='all'?orders.length:orders.filter(o=>o.status===c.key).length}</span>
            <span className="summary-card__label">{c.label}</span>
          </button>
        ))}
      </div>
      {loading ? <p className="loading">Loading…</p>
        : filtered.length===0 ? <p className="empty-msg">No orders here yet.</p>
        : (
          <div className="orders-list">
            {filtered.map(order=>{
              const s = STATUS[order.status]||{bg:'#f5f5f5',color:'#666',label:order.status}
              return (
                <div key={order.id} className="order-card">
                  <div className="order-card__img">{order.cake_image?<img src={order.cake_image} alt="" />:<div className="img-placeholder">🎂</div>}</div>
                  <div className="order-card__info">
                    <div className="order-card__top">
                      <strong>{order.customer_name}</strong>
                      <span className="order-status-badge" style={{background:s.bg,color:s.color}}>{s.label}</span>
                    </div>
                    <div className="order-card__cake">🎂 {order.cake_title}</div>
                    <div className="order-card__details">
                      <span>📅 Pickup: <strong>{fmtDate(order.pickup_date)}</strong></span>
                      <span>💰 Deposit: <strong>${Number(order.deposit_amount).toFixed(2)}</strong></span>
                      <span>✉️ {order.customer_email}</span>
                      {order.customer_phone&&<span>📞 {order.customer_phone}</span>}
                    </div>
                    {order.notes&&<div className="order-card__notes">💬 {order.notes}</div>}
                    <div className="order-card__meta">Ordered {fmtTime(order.created_at)}</div>
                  </div>
                  <div className="order-card__actions">
                    <select value={order.status} onChange={e=>{ updateOrderStatus(order.id,e.target.value).then(load) }} className="status-select" style={{borderColor:s.color,color:s.color}}>
                      <option value="pending_payment">Awaiting Payment</option>
                      <option value="paid">Deposit Paid</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button className="btn btn-danger btn-sm" onClick={()=>{ if(confirm('Delete order?')) deleteOrder(order.id).then(load) }}>Delete</button>
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

// ─── Contacts Dashboard ───────────────────────────────────────
function ContactsDashboard() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')

  const load = () => getContactRequests().then(d=>{ setContacts(d); setLoading(false) })
  useEffect(()=>{ load() },[])

  const STATUS_COLORS = {
    new:         { bg:'#e3f2fd', color:'#1565c0', label:'New' },
    in_progress: { bg:'#fff8e6', color:'#b7770a', label:'In Progress' },
    done:        { bg:'#e8f5e9', color:'#2e7d32', label:'Done' },
  }

  const filtered   = filter==='all' ? contacts : contacts.filter(c=>c.status===filter)
  const fmtDate    = d => d ? new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'
  const fmtTime    = d => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})
  const newCount   = contacts.filter(c=>c.status==='new').length

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'0.5rem',flexWrap:'wrap'}}>
        <h3 className="tab-title" style={{marginBottom:0}}>Messages & Booking Requests</h3>
        {newCount > 0 && <span className="new-badge">{newCount} new</span>}
      </div>

      <div className="filter-row">
        {['all','new','in_progress','done'].map(f=>(
          <button key={f} className={`filter-btn ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>
            {f==='all'?'All':STATUS_COLORS[f]?.label||f}
            {f==='new'&&newCount>0&&<span className="filter-count">{newCount}</span>}
          </button>
        ))}
      </div>

      {loading ? <p className="loading">Loading…</p>
        : filtered.length===0 ? <p className="empty-msg">No messages here.</p>
        : (
          <div className="contacts-list">
            {filtered.map(c=>{
              const s = STATUS_COLORS[c.status]||{bg:'#f5f5f5',color:'#666',label:c.status}
              return (
                <div key={c.id} className={`contact-card ${c.status==='new'?'contact-card--new':''}`}>
                  <div className="contact-card__info">
                    <div className="contact-card__top">
                      <strong>{c.name}</strong>
                      <span className="order-status-badge" style={{background:s.bg,color:s.color}}>{s.label}</span>
                    </div>
                    <div className="contact-card__details">
                      <span>✉️ <a href={`mailto:${c.email}`}>{c.email}</a></span>
                      {c.phone&&<span>📞 <a href={`tel:${c.phone}`}>{c.phone}</a></span>}
                      {c.request_date&&<span>📅 Requested: {fmtDate(c.request_date)}{c.request_slot?` at ${c.request_slot}`:''}</span>}
                    </div>
                    {c.message&&<div className="contact-card__message">"{c.message}"</div>}
                    <div className="order-card__meta">Received {fmtTime(c.created_at)}</div>
                  </div>
                  <div className="order-card__actions">
                    <select value={c.status} onChange={e=>{ updateContactStatus(c.id,e.target.value).then(load) }} className="status-select" style={{borderColor:s.color,color:s.color}}>
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                    <a href={`mailto:${c.email}`} className="btn btn-outline btn-sm">Reply →</a>
                    <button className="btn btn-danger btn-sm" onClick={()=>{ if(confirm('Delete?')) deleteContactRequest(c.id).then(load) }}>Delete</button>
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

// ─── Page + Theme Editor ──────────────────────────────────────
const FONT_OPTIONS = [
  'Dancing Script','Playfair Display','Lora','Cormorant Garamond',
  'Pacifico','Satisfy','Great Vibes','Abril Fatface',
  'Lato','Nunito','Poppins','Merriweather'
]
const PAGES_LIST = [
  {key:'page_home',    label:'🏠 Home'},
  {key:'page_cakes',   label:'🎂 Cakes'},
  {key:'page_books',   label:'📚 Books'},
  {key:'page_recipes', label:'📖 Recipes'},
  {key:'page_booking', label:'📅 Booking'},
  {key:'page_photos',  label:'📸 Photos'},
]

function PageEditor() {
  const [activePage, setActivePage] = useState('page_home')
  const [content, setContent] = useState({})
  const [site, setSite]       = useState(null)
  const [payments, setPayments] = useState(null)
  const [theme, setTheme]     = useState(null)
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(false)

  useEffect(()=>{
    PAGES_LIST.forEach(p=>getSetting(p.key).then(v=>setContent(c=>({...c,[p.key]:v||{}}))))
    getSetting('homepage').then(d=>setSite(d||{bakeryName:"Pam's Cooking for Real Life",tagline:'',aboutStory:'',phone:'',email:'',instagram:'',location:'Elon, NC'}))
    getSetting('payments').then(d=>setPayments(d||{method:'PayPal',payment_id:'',custom_instructions:''}))
    getSetting('theme').then(d=>setTheme(d||{color_primary:'#2D5233',color_secondary:'#6B9E70',color_accent:'#4A7A50',color_bg:'#FDFAF4',color_bg_dark:'#F0EBE0',color_text:'#2A3D2E',color_nav:'#2D5233',font_heading:'Dancing Script',font_body:'Lato',button_radius:'100px',card_radius:'6px'}))
  },[])

  const setC = (k,v) => setContent(c=>({...c,[activePage]:{...c[activePage],[k]:v}}))
  const setS = (k,v) => setSite(s=>({...s,[k]:v}))
  const setP = (k,v) => setPayments(p=>({...p,[k]:v}))
  const setT = (k,v) => { setTheme(t=>({...t,[k]:v})); applyTheme({...theme,[k]:v}); if(k==='font_heading'||k==='font_body') loadFont(v) }

  const save = async () => {
    setSaving(true)
    await setSetting(activePage, content[activePage]||{})
    if (site)     await setSetting('homepage', site)
    if (payments) await setSetting('payments', payments)
    if (theme)    await setSetting('theme', theme)
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),3000)
  }

  const pg = content[activePage] || {}
  if (!site||!payments||!theme) return <p className="loading">Loading…</p>

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
        <h3 className="tab-title" style={{marginBottom:0}}>Edit Pages & Settings</h3>
        <button className="btn btn-sage" onClick={save} disabled={saving}>{saving?'Saving…':saved?'✓ Saved!':'Save All Changes'}</button>
      </div>

      <div className="page-tabs">
        {PAGES_LIST.map(p=>(
          <button key={p.key} className={`page-tab ${activePage===p.key?'active':''}`} onClick={()=>setActivePage(p.key)}>{p.label}</button>
        ))}
      </div>

      {/* ── HOME ── */}
      {activePage==='page_home' && (
        <div className="settings-section">
          <h4>🖼 Hero Section</h4>
          <div className="form-field"><label>Site / Bakery Name</label><input value={site.bakeryName||''} onChange={e=>setS('bakeryName',e.target.value)} /></div>
          <div className="form-field"><label>Hero Tagline</label><input value={site.tagline||''} onChange={e=>setS('tagline',e.target.value)} /></div>
          <ImgUpload label="Hero Background Photo" value={pg.hero_image||''} onChange={v=>setC('hero_image',v)} />
          <h4>🎂 Featured Cakes Section</h4>
          <div className="form-field"><label>Section Heading</label><input value={pg.featured_heading||''} onChange={e=>setC('featured_heading',e.target.value)} placeholder="Featured Cakes" /></div>
          <div className="form-field"><label>Section Subtext</label><input value={pg.featured_subtext||''} onChange={e=>setC('featured_subtext',e.target.value)} /></div>
          <h4>📖 About / Story Section</h4>
          <div className="form-field"><label>About Heading</label><input value={pg.about_heading||''} onChange={e=>setC('about_heading',e.target.value)} placeholder="Real food. Real love." /></div>
          <ImgUpload label="About Section Photo" value={pg.about_image||''} onChange={v=>setC('about_image',v)} />
          <div className="form-field"><label>Your Story (blank line = new paragraph)</label><textarea rows={7} value={site.aboutStory||''} onChange={e=>setS('aboutStory',e.target.value)} /></div>
          <h4>📣 Bottom Call-to-Action</h4>
          <div className="form-field"><label>CTA Heading</label><input value={pg.cta_heading||''} onChange={e=>setC('cta_heading',e.target.value)} placeholder="Ready for your dream cake?" /></div>
          <div className="form-field"><label>CTA Subtext</label><input value={pg.cta_subtext||''} onChange={e=>setC('cta_subtext',e.target.value)} /></div>
          <h4>📞 Contact Info</h4>
          <div className="form-row-2">
            <div className="form-field"><label>Phone</label><input value={site.phone||''} onChange={e=>setS('phone',e.target.value)} /></div>
            <div className="form-field"><label>Email</label><input value={site.email||''} onChange={e=>setS('email',e.target.value)} /></div>
          </div>
          <div className="form-row-2">
            <div className="form-field"><label>Location</label><input value={site.location||''} onChange={e=>setS('location',e.target.value)} placeholder="Elon, NC" /></div>
            <div className="form-field"><label>Instagram (no @)</label><input value={site.instagram||''} onChange={e=>setS('instagram',e.target.value)} /></div>
          </div>
        </div>
      )}

      {/* ── CAKES ── */}
      {activePage==='page_cakes' && (
        <div className="settings-section">
          <h4>Page Header</h4>
          <div className="form-field"><label>Heading</label><input value={pg.heading||''} onChange={e=>setC('heading',e.target.value)} placeholder="Cake Catalog" /></div>
          <div className="form-field"><label>Subtext</label><input value={pg.subtext||''} onChange={e=>setC('subtext',e.target.value)} /></div>
          <p className="settings-hint">💡 Add/edit/remove individual cakes in the 🎂 Cakes tab.</p>
        </div>
      )}

      {/* ── BOOKS ── */}
      {activePage==='page_books' && (
        <div className="settings-section">
          <h4>Page Header</h4>
          <div className="form-field"><label>Heading</label><input value={pg.heading||''} onChange={e=>setC('heading',e.target.value)} placeholder="Books & Cookbooks" /></div>
          <div className="form-field"><label>Subtext</label><input value={pg.subtext||''} onChange={e=>setC('subtext',e.target.value)} /></div>
          <div className="form-field"><label>Intro Paragraph (optional)</label><textarea rows={4} value={pg.intro||''} onChange={e=>setC('intro',e.target.value)} placeholder="A little intro about your books…" /></div>
          <p className="settings-hint">💡 Add/edit/remove individual books in the 📚 Books tab.</p>
        </div>
      )}

      {/* ── RECIPES ── */}
      {activePage==='page_recipes' && (
        <div className="settings-section">
          <h4>Page Header</h4>
          <div className="form-field"><label>Heading</label><input value={pg.heading||''} onChange={e=>setC('heading',e.target.value)} placeholder="Recipes & Tips" /></div>
          <div className="form-field"><label>Subtext</label><input value={pg.subtext||''} onChange={e=>setC('subtext',e.target.value)} /></div>
          <p className="settings-hint">💡 Add/edit/remove individual recipes in the 📖 Recipes tab.</p>
        </div>
      )}

      {/* ── BOOKING ── */}
      {activePage==='page_booking' && (
        <div className="settings-section">
          <h4>Page Header</h4>
          <div className="form-field"><label>Heading</label><input value={pg.heading||''} onChange={e=>setC('heading',e.target.value)} placeholder="Book a Consultation" /></div>
          <div className="form-field"><label>Subtext</label><input value={pg.subtext||''} onChange={e=>setC('subtext',e.target.value)} /></div>
          <div className="form-field"><label>Sidebar Bullet Points (one per line)</label><textarea rows={6} value={pg.sidebar_text||''} onChange={e=>setC('sidebar_text',e.target.value)} /></div>
          <h4>Get in Touch Section</h4>
          <div className="form-field"><label>Section Heading</label><input value={pg.contact_heading||''} onChange={e=>setC('contact_heading',e.target.value)} placeholder="Have a question? Let's talk." /></div>
          <div className="form-field"><label>Section Subtext</label><textarea rows={3} value={pg.contact_subtext||''} onChange={e=>setC('contact_subtext',e.target.value)} /></div>
          <p className="settings-hint">💡 Phone, email, and location come from the 🏠 Home page contact settings.</p>
        </div>
      )}

      {/* ── THEME ── */}
      <div className="settings-section" style={{marginTop:'1.5rem'}}>
        <h4>🎨 Colors & Fonts — Changes Preview Live!</h4>
        <p style={{fontSize:'0.85rem',color:'var(--text-muted)',marginBottom:'1.25rem'}}>Click a color swatch to open the color picker. Font changes show immediately.</p>
        <div className="form-row-2">
          <div className="form-field"><label>Primary Color (navbar, buttons, headings)</label>
            <div className="color-row"><input type="color" value={theme.color_primary} onChange={e=>setT('color_primary',e.target.value)} className="color-swatch" /><input value={theme.color_primary} onChange={e=>setT('color_primary',e.target.value)} className="url-input" /></div>
          </div>
          <div className="form-field"><label>Secondary Color (dots, accents)</label>
            <div className="color-row"><input type="color" value={theme.color_secondary} onChange={e=>setT('color_secondary',e.target.value)} className="color-swatch" /><input value={theme.color_secondary} onChange={e=>setT('color_secondary',e.target.value)} className="url-input" /></div>
          </div>
        </div>
        <div className="form-row-2">
          <div className="form-field"><label>Background Color</label>
            <div className="color-row"><input type="color" value={theme.color_bg} onChange={e=>setT('color_bg',e.target.value)} className="color-swatch" /><input value={theme.color_bg} onChange={e=>setT('color_bg',e.target.value)} className="url-input" /></div>
          </div>
          <div className="form-field"><label>Text Color</label>
            <div className="color-row"><input type="color" value={theme.color_text} onChange={e=>setT('color_text',e.target.value)} className="color-swatch" /><input value={theme.color_text} onChange={e=>setT('color_text',e.target.value)} className="url-input" /></div>
          </div>
        </div>
        <div className="form-row-2">
          <div className="form-field"><label>Heading / Display Font</label>
            <select value={theme.font_heading} onChange={e=>setT('font_heading',e.target.value)}>
              {FONT_OPTIONS.map(f=><option key={f} value={f}>{f}</option>)}
            </select>
            <span style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:'0.3rem',display:'block'}}>Preview: <span style={{fontFamily:`'${theme.font_heading}', cursive`,fontSize:'1.3rem'}}>{site.bakeryName||"Pam's Cooking"}</span></span>
          </div>
          <div className="form-field"><label>Body / Paragraph Font</label>
            <select value={theme.font_body} onChange={e=>setT('font_body',e.target.value)}>
              {['Lato','Nunito','Poppins','Merriweather','Lora','Playfair Display'].map(f=><option key={f} value={f}>{f}</option>)}
            </select>
            <span style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:'0.3rem',display:'block'}}>Preview: <span style={{fontFamily:`'${theme.font_body}', sans-serif`}}>The quick brown fox…</span></span>
          </div>
        </div>
        <div className="form-row-2">
          <div className="form-field"><label>Button Shape</label>
            <select value={theme.button_radius} onChange={e=>setT('button_radius',e.target.value)}>
              <option value="100px">Pill / Rounded</option>
              <option value="8px">Slightly Rounded</option>
              <option value="0px">Square</option>
            </select>
          </div>
          <div className="form-field"><label>Card Shape</label>
            <select value={theme.card_radius} onChange={e=>setT('card_radius',e.target.value)}>
              <option value="6px">Slightly Rounded</option>
              <option value="12px">Very Rounded</option>
              <option value="0px">Square</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── PAYMENTS NOTE ── */}
      <div className="settings-section" style={{marginTop:'1.5rem'}}>
        <h4>💳 PayPal Payment Settings</h4>
        <div className="paypal-setup-steps">
          <div className="paypal-step">
            <span className="paypal-step__num">1</span>
            <div>Go to <strong>Netlify → Site configuration → Environment variables</strong></div>
          </div>
          <div className="paypal-step">
            <span className="paypal-step__num">2</span>
            <div>Add these three variables:
              <div style={{marginTop:'0.5rem',fontFamily:'monospace',fontSize:'0.8rem',background:'var(--sage-ghost)',padding:'0.75rem',borderRadius:'var(--radius)',display:'flex',flexDirection:'column',gap:'0.3rem'}}>
                <span><strong>VITE_PAYPAL_CLIENT_ID</strong> = your live Client ID</span>
                <span><strong>PAYPAL_CLIENT_SECRET</strong> = your live Secret key</span>
                <span><strong>PAYPAL_ENV</strong> = live</span>
              </div>
            </div>
          </div>
          <div className="paypal-step">
            <span className="paypal-step__num">3</span>
            <div>Trigger a redeploy in Netlify — payments will work instantly</div>
          </div>
        </div>
        <p style={{fontSize:'0.82rem',color:'var(--text-muted)'}}>Get your keys from <strong>developer.paypal.com</strong> → Apps & Credentials → your app → switch to Live mode.</p>
      </div>
    </div>
  )
}


// ─── Photos Admin ─────────────────────────────────────────────
function PhotosAdmin() {
  const [galleries, setGalleries] = useState([])
  const [editGallery, setEditGallery] = useState(null) // null = list, obj = editing
  const [loading, setLoading] = useState(true)

  const load = () => getGalleries().then(d => { setGalleries(d); setLoading(false) })
  useEffect(() => { load() }, [])

  if (editGallery !== null) {
    return <GalleryEditor gallery={editGallery === 'new' ? null : editGallery} onSave={() => { load(); setEditGallery(null) }} onCancel={() => setEditGallery(null)} />
  }

  return (
    <div>
      <div className="tab-header">
        <h2>Photos</h2>
        <button className="btn btn-sage" onClick={() => setEditGallery('new')}>+ Add New Gallery</button>
      </div>
      <p style={{color:'var(--text-muted)',fontSize:'0.9rem',marginBottom:'1.5rem'}}>Each gallery shows the step-by-step process of making a cake, with photos and captions at each stage.</p>
      {loading ? <p className="loading">Loading…</p>
        : galleries.length === 0 ? <p className="empty-msg">No galleries yet. Add your first cake process!</p>
        : (
          <>
            <p className="sort-hint">⠿ Drag to reorder galleries</p>
            <SortableList
              items={galleries}
              onReorder={reordered => { setGalleries(reordered); updateSortOrder('photo_galleries', reordered) }}
              renderItem={g => (
                <div className="admin-item">
                  <div className="admin-item__img">
                    {g.cover_image ? <img src={g.cover_image} alt={g.title} /> : <div className="img-placeholder">📸</div>}
                  </div>
                  <div className="admin-item__info">
                    <strong>{g.title}</strong>
                    <span>{g.category}</span>
                    {g.description && <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:'0.2rem'}}>{g.description?.slice(0,80)}{g.description?.length>80?'…':''}</p>}
                  </div>
                  <div className="admin-item__actions">
                    <button className="btn btn-outline btn-sm" onClick={() => setEditGallery(g)}>Edit & Photos</button>
                    <button className="btn btn-danger btn-sm" onClick={() => { if(confirm('Delete this gallery and all its photos?')) deleteGallery(g.id).then(load) }}>Delete</button>
                  </div>
                </div>
              )}
            />
          </>
        )
      }
    </div>
  )
}

function GalleryEditor({ gallery, onSave, onCancel }) {
  const [form, setForm] = useState(gallery || { title:'', description:'', cover_image:'', category:'Cake Process' })
  const [photos, setPhotos] = useState([])
  const [saving, setSaving] = useState(false)
  const [galleryId, setGalleryId] = useState(gallery?.id || null)
  const [uploading, setUploading] = useState(false)
  const [newCaption, setNewCaption] = useState('')
  const [newStep, setNewStep] = useState(0)

  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  useEffect(() => {
    if (galleryId) getGalleryPhotos(galleryId).then(setPhotos)
  }, [galleryId])

  const saveDetails = async () => {
    if (!form.title) return alert('Title is required.')
    setSaving(true)
    if (galleryId) {
      const { id, ...rest } = { ...form, id: galleryId }
      await supabase.from('photo_galleries').update(rest).eq('id', galleryId)
    } else {
      const result = await saveGallery(form)
      if (result?.id) setGalleryId(result.id)
    }
    setSaving(false)
  }

  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0]; if (!file) return
    if (!galleryId) {
      // Save gallery first if not saved yet
      if (!form.title) return alert('Please enter a title and save the gallery details first.')
      setSaving(true)
      const result = await saveGallery(form)
      if (result?.id) {
        setGalleryId(result.id)
        setSaving(false)
        // continue with upload using result.id
        setUploading(true)
        try {
          const url = await uploadImage(file)
          await saveGalleryPhoto({ gallery_id: result.id, image_url: url, caption: newCaption, step_number: newStep || photos.length + 1 })
          getGalleryPhotos(result.id).then(setPhotos)
          setNewCaption(''); setNewStep(0)
        } catch(err) { alert('Upload failed: ' + err.message) }
        setUploading(false)
        return
      }
      setSaving(false)
      return
    }
    setUploading(true)
    try {
      const url = await uploadImage(file)
      await saveGalleryPhoto({ gallery_id: galleryId, image_url: url, caption: newCaption, step_number: newStep || photos.length + 1 })
      getGalleryPhotos(galleryId).then(setPhotos)
      setNewCaption(''); setNewStep(0)
    } catch(err) { alert('Upload failed: ' + err.message) }
    setUploading(false)
  }

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    try { set('cover_image', await uploadImage(file)) }
    catch(err) { alert('Upload failed: ' + err.message) }
    setUploading(false)
  }

  const removePhoto = async (id) => {
    if (!confirm('Remove this photo?')) return
    await deleteGalleryPhoto(id)
    getGalleryPhotos(galleryId).then(setPhotos)
  }

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <h3>{gallery ? 'Edit Gallery' : 'New Gallery'}</h3>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>← Back</button>
          <button className="btn btn-sage btn-sm" onClick={async () => { await saveDetails(); onSave() }} disabled={saving}>{saving?'Saving…':'Save & Close'}</button>
        </div>
      </div>
      <div className="editor-body">

        {/* Gallery details */}
        <div className="settings-section">
          <h4>Gallery Details</h4>
          <div className="form-row-2">
            <div className="form-field"><label>Gallery Title *</label><input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Strawberry Shortcake — How It's Made" /></div>
            <div className="form-field"><label>Category</label>
              <CategoryInput value={form.category} onChange={v=>set('category',v)} options={['Cake Process','Wedding','Birthday','Custom','Behind the Scenes','Decoration']} />
            </div>
          </div>
          <div className="form-field"><label>Description (optional)</label><textarea rows={2} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="A behind-the-scenes look at how this beauty comes together…" /></div>
          <div className="form-field">
            <label>Cover Image (shown on the gallery listing)</label>
            <div className="img-upload-row">
              {form.cover_image && <img src={form.cover_image} alt="" className="img-thumb" />}
              <label className="btn btn-outline btn-sm" style={{cursor:'pointer'}}>
                {form.cover_image ? 'Replace Cover' : 'Upload Cover'}
                <input type="file" accept="image/*" onChange={handleCoverUpload} style={{display:'none'}} />
              </label>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={saveDetails} disabled={saving}>{saving?'Saving…':'Save Details'}</button>
        </div>

        {/* Add photos */}
        <div className="settings-section">
          <h4>Add a Photo</h4>
          <p style={{fontSize:'0.85rem',color:'var(--text-muted)',marginBottom:'1rem'}}>Add photos one at a time. Each photo can have a step number and a caption describing what's happening in that step.</p>
          <div className="form-row-2">
            <div className="form-field"><label>Step Number (optional)</label><input type="number" value={newStep || ''} onChange={e=>setNewStep(parseInt(e.target.value)||0)} placeholder="e.g. 1, 2, 3…" /></div>
            <div className="form-field"><label>Caption / Description</label><input value={newCaption} onChange={e=>setNewCaption(e.target.value)} placeholder="Mixing the batter until just combined…" /></div>
          </div>
          <label className={`btn btn-sage ${uploading?'disabled':''}`} style={{cursor:'pointer',alignSelf:'flex-start'}}>
            {uploading ? 'Uploading…' : '📷 Upload Photo'}
            <input type="file" accept="image/*" onChange={handleUploadPhoto} style={{display:'none'}} disabled={uploading} />
          </label>
          {!galleryId && <p style={{fontSize:'0.78rem',color:'var(--text-muted)',marginTop:'0.5rem'}}>Save the gallery details above first, then you can add photos.</p>}
        </div>

        {/* Existing photos */}
        {photos.length > 0 && (
          <div className="settings-section">
            <h4>Photos in this Gallery ({photos.length})</h4>
            <div className="gallery-photo-list">
              {photos.map((photo, i) => (
                <div key={photo.id} className="gallery-photo-item">
                  <img src={photo.image_url} alt={photo.caption || `Step ${i+1}`} />
                  <div className="gallery-photo-item__info">
                    <strong>Step {photo.step_number || i+1}</strong>
                    <p>{photo.caption || <em style={{color:'#bbb'}}>No caption</em>}</p>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => removePhoto(photo.id)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Admin Shell ─────────────────────────────────────────
export default function Admin() {
  const [user, setUser] = useState(undefined)
  const [tab, setTab]   = useState('orders')
  const [cakes, setCakes]   = useState([])
  const [books, setBooks]   = useState([])
  const [posts, setPosts]   = useState([])
  const [editCake, setEditCake] = useState(null)
  const [editBook, setEditBook] = useState(null)
  const [editPost, setEditPost] = useState(null)
  const [newCake, setNewCake]   = useState(false)
  const [newBook, setNewBook]   = useState(false)
  const [newPost, setNewPost]   = useState(false)

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setUser(data.session?.user||null))
    supabase.auth.onAuthStateChange((_,s)=>setUser(s?.user||null))
  },[])

  useEffect(()=>{
    if (!user) return
    getCakes().then(setCakes)
    getBooks().then(setBooks)
    getPosts().then(setPosts)
  },[user])

  if (user===undefined) return <div className="loading">Loading…</div>
  if (!user)            return <LoginScreen />

  const refreshCakes = () => { getCakes().then(setCakes); setEditCake(null); setNewCake(false) }
  const refreshBooks = () => { getBooks().then(setBooks); setEditBook(null); setNewBook(false) }
  const refreshPosts = () => { getPosts().then(setPosts); setEditPost(null); setNewPost(false) }

  const TABS = [
    {id:'orders',   label:'📋 Orders'},
    {id:'messages', label:'💌 Messages'},
    {id:'cakes',    label:'🎂 Cakes'},
    {id:'books',    label:'📚 Books'},
    {id:'recipes',  label:'📖 Recipes'},
    {id:'calendar', label:'📅 Calendar'},
    {id:'pages',    label:'✏️ Edit Site'},
    {id:'photos',   label:'📸 Photos'},
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
            <button className="btn btn-sm" style={{color:'rgba(253,250,244,0.6)'}} onClick={()=>supabase.auth.signOut()}>Sign Out</button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {tab==='orders'   && <OrdersDashboard />}
        {tab==='messages' && <ContactsDashboard />}
        {tab==='calendar' && <CalendarEditor />}
        {tab==='pages'    && <PageEditor />}
        {tab==='photos'   && <PhotosAdmin />}

        {tab==='cakes' && (
          (newCake||editCake)
            ? <CakeEditor cake={editCake} onSave={refreshCakes} onCancel={()=>{setNewCake(false);setEditCake(null)}} />
            : <>
                <div className="tab-header"><h2>Cakes</h2><button className="btn btn-sage" onClick={()=>setNewCake(true)}>+ Add New Cake</button></div>
                {cakes.length===0 ? <p className="empty-msg">No cakes yet.</p> : (
                  <>
                    <p className="sort-hint">⠿ Drag the handle to reorder</p>
                    <SortableList
                      items={cakes}
                      onReorder={r=>{ setCakes(r); updateSortOrder('cakes',r) }}
                      renderItem={c=>(
                        <div className="admin-item">
                          <div className="admin-item__img">{c.image_url?<img src={c.image_url} alt=""/>:<div className="img-placeholder">🎂</div>}</div>
                          <div className="admin-item__info">
                            <strong>{c.title}</strong>
                            <span>${Number(c.price).toLocaleString()} · {c.category}</span>
                            <div style={{display:'flex',gap:'0.4rem',marginTop:'0.3rem',flexWrap:'wrap'}}>
                              {c.featured&&<span className="badge badge-brown">Featured</span>}
                              <span className="badge" style={c.available?{background:'var(--sage-pale)',color:'var(--sage-dark)'}:{background:'#fee',color:'#c0392b'}}>{c.available?'Available':'Unavailable'}</span>
                            </div>
                          </div>
                          <div className="admin-item__actions">
                            <button className="btn btn-outline btn-sm" onClick={()=>setEditCake(c)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={()=>{ if(confirm('Delete?')) deleteCake(c.id).then(()=>getCakes().then(setCakes)) }}>Delete</button>
                          </div>
                        </div>
                      )}
                    />
                  </>
                )}
              </>
        )}

        {tab==='books' && (
          (newBook||editBook)
            ? <BookEditor book={editBook} onSave={refreshBooks} onCancel={()=>{setNewBook(false);setEditBook(null)}} />
            : <>
                <div className="tab-header"><h2>Books & Cookbooks</h2><button className="btn btn-sage" onClick={()=>setNewBook(true)}>+ Add New Book</button></div>
                {books.length===0 ? <p className="empty-msg">No books yet.</p> : (
                  <>
                    <p className="sort-hint">⠿ Drag the handle to reorder</p>
                    <SortableList
                      items={books}
                      onReorder={r=>{ setBooks(r); updateSortOrder('books',r) }}
                      renderItem={b=>(
                        <div className="admin-item">
                          <div className="admin-item__img">{b.image_url?<img src={b.image_url} alt=""/>:<div className="img-placeholder">📚</div>}</div>
                          <div className="admin-item__info">
                            <strong>{b.title}</strong>
                            <span>${Number(b.price).toFixed(2)} · {b.category}</span>
                          </div>
                          <div className="admin-item__actions">
                            <button className="btn btn-outline btn-sm" onClick={()=>setEditBook(b)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={()=>{ if(confirm('Delete?')) deleteBook(b.id).then(()=>getBooks().then(setBooks)) }}>Delete</button>
                          </div>
                        </div>
                      )}
                    />
                  </>
                )}
              </>
        )}

        {tab==='recipes' && (
          (newPost||editPost)
            ? <PostEditor post={editPost} onSave={refreshPosts} onCancel={()=>{setNewPost(false);setEditPost(null)}} />
            : <>
                <div className="tab-header"><h2>Recipes & Blog</h2><button className="btn btn-sage" onClick={()=>setNewPost(true)}>+ Add New Post</button></div>
                {posts.length===0 ? <p className="empty-msg">No posts yet.</p> : (
                  <>
                    <p className="sort-hint">⠿ Drag the handle to reorder</p>
                    <SortableList
                      items={posts}
                      onReorder={r=>{ setPosts(r); updateSortOrder('blog_posts',r) }}
                      renderItem={p=>(
                        <div className="admin-item">
                          <div className="admin-item__img">{p.image_url?<img src={p.image_url} alt=""/>:<div className="img-placeholder">📖</div>}</div>
                          <div className="admin-item__info">
                            <strong>{p.title}</strong>
                            <span>{new Date(p.date).toLocaleDateString()}</span>
                            <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:'0.2rem'}}>{p.excerpt?.slice(0,80)}{p.excerpt?.length>80?'…':''}</p>
                          </div>
                          <div className="admin-item__actions">
                            <button className="btn btn-outline btn-sm" onClick={()=>setEditPost(p)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={()=>{ if(confirm('Delete?')) deletePost(p.id).then(()=>getPosts().then(setPosts)) }}>Delete</button>
                          </div>
                        </div>
                      )}
                    />
                  </>
                )}
              </>
        )}
      </main>
    </div>
  )
}
