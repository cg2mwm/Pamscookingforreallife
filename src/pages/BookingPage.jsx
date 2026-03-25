import { useState, useEffect } from 'react'
import { getAvailability, getSetting, saveContactRequest } from '../supabase'
import './BookingPage.css'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function buildCalendar(year, month, availMap) {
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push({ d, ds, row: availMap[ds] || null })
  }
  return cells
}

export default function BookingPage() {
  const [avail, setAvail]   = useState([])
  const [pg, setPg]         = useState({})
  const [site, setSite]     = useState({})
  const [selected, setSelected]     = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [booked, setBooked]   = useState(false)
  const [contacted, setContacted] = useState(false)
  const [form, setForm]   = useState({ name:'', email:'', phone:'', notes:'' })
  const [cform, setCform] = useState({ name:'', email:'', phone:'', message:'' })
  const [sending, setSending] = useState(false)
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  useEffect(() => {
    getAvailability('consultation').then(setAvail)
    getSetting('page_booking').then(d => setPg(d || {}))
    getSetting('homepage').then(d => setSite(d || {}))
  }, [])

  const availMap = {}
  avail.forEach(a => { availMap[a.date] = a })
  const cells = buildCalendar(year, month, availMap)

  const prevMo = () => { if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }
  const nextMo = () => { if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }

  const handleBook = async e => {
    e.preventDefault()
    await saveContactRequest({ name:form.name, email:form.email, phone:form.phone, message:form.notes, request_date:selected?.ds, request_slot:selectedSlot, status:'new' })
    setBooked(true)
  }
  const handleContact = async e => {
    e.preventDefault(); setSending(true)
    await saveContactRequest({ ...cform, status:'new' })
    setSending(false); setContacted(true)
  }

  const fmt = d => new Date(d+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})
  const location   = site.location   || 'Elon, NC'
  const sideItems  = (pg.sidebar_text || '30-minute call\nDiscuss your cake design & flavors\nTimeline & delivery planning\nPricing & deposit details').split('\n').filter(Boolean)
  const ctactHead  = pg.contact_heading  || "Have a question? Let's talk."
  const ctactSub   = pg.contact_subtext  || "Whether you have a question about a cake, want a custom order, or just want to say hello — I'd love to hear from you."

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>{pg.heading || 'Book a Consultation'}</h1>
          <p>{pg.subtext  || 'A free 30-minute call to design your perfect cake.'}</p>
        </div>
      </div>

      {/* ── Booking calendar ── */}
      <section className="section">
        <div className="container booking-layout">
          <div className="booking-main">
            {booked ? (
              <div className="booking-success">
                <div style={{fontSize:'4rem',marginBottom:'1rem'}}>🎉</div>
                <h2>Thanks, {form.name}!</h2>
                <p>Request for <strong>{selected && fmt(selected.ds)}</strong> at <strong>{selectedSlot}</strong> received.</p>
                <p style={{marginTop:'0.5rem',fontSize:'0.9rem',color:'var(--text-muted)'}}>We'll email <strong>{form.email}</strong> within 24 hours.</p>
              </div>
            ) : (
              <>
                <div className="cal-card">
                  <div className="cal-header">
                    <button className="cal-nav" onClick={prevMo}>‹</button>
                    <h3 className="cal-title">{MONTHS[month]} {year}</h3>
                    <button className="cal-nav" onClick={nextMo}>›</button>
                  </div>
                  <div className="cal-grid">
                    {DAYS.map(d => <div key={d} className="cal-dayname">{d}</div>)}
                    {cells.map((cell, i) => {
                      if (!cell) return <div key={`e${i}`} className="cal-cell cal-cell--empty" />
                      const { d, ds, row } = cell
                      const isPast     = new Date(ds) < new Date(today.toDateString())
                      const isAvail    = !!row && !row.booked && !isPast
                      const isBooked   = row?.booked
                      const isSelected = selected?.ds === ds
                      return (
                        <button key={ds}
                          className={`cal-cell ${isAvail?'cal-cell--avail':''} ${isBooked?'cal-cell--booked':''} ${isPast?'cal-cell--past':''} ${isSelected?'cal-cell--selected':''}`}
                          onClick={() => { if(isAvail){ setSelected(cell); setSelectedSlot(null) } }}
                          disabled={!isAvail}
                          title={isBooked?'Already booked':isAvail?'Click to select':''}
                        >
                          <span className="cal-cell__num">{d}</span>
                          {isAvail  && <span className="cal-cell__dot" />}
                          {isBooked && <span className="cal-cell__x">✕</span>}
                        </button>
                      )
                    })}
                  </div>
                  <div className="cal-legend">
                    <span><span className="legend-dot legend-avail" />Available</span>
                    <span><span className="legend-dot legend-booked" />Booked</span>
                    <span><span className="legend-dot legend-selected" />Selected</span>
                  </div>
                </div>

                {selected && (
                  <div className="booking-step">
                    <h4>Times on {fmt(selected.ds)}</h4>
                    <div className="slots">
                      {selected.row.slots.map(s => (
                        <button key={s} className={`slot-btn ${selectedSlot===s?'active':''}`} onClick={()=>setSelectedSlot(s)}>{s}</button>
                      ))}
                    </div>
                  </div>
                )}

                {selected && selectedSlot && (
                  <div className="booking-step">
                    <h4>Your Details</h4>
                    <form onSubmit={handleBook} className="booking-form">
                      <div className="form-row-2">
                        <div className="form-field"><label>Full Name *</label><input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Jane Smith" /></div>
                        <div className="form-field"><label>Email *</label><input type="email" required value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="jane@email.com" /></div>
                      </div>
                      <div className="form-field"><label>Phone</label><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></div>
                      <div className="form-field"><label>Tell me about your event</label><textarea rows={4} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Date of event, type of cake, number of guests…" /></div>
                      <button type="submit" className="btn btn-sage btn-full">Send Booking Request →</button>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>

          <aside className="booking-sidebar">
            <div className="booking-info-card">
              <h4>What to Expect</h4>
              <ul>{sideItems.map((item,i) => <li key={i}>{item}</li>)}</ul>
            </div>
            <div className="booking-info-card">
              <h4>Contact Directly</h4>
              {site.phone && <a href={`tel:${site.phone}`}   className="direct-link">📞 {site.phone}</a>}
              {site.email && <a href={`mailto:${site.email}`} className="direct-link">✉️ {site.email}</a>}
              {site.instagram && <a href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noopener noreferrer" className="direct-link">📸 @{site.instagram}</a>}
              <p className="direct-location">📍 {location}</p>
            </div>
          </aside>
        </div>
      </section>

      {/* ── Get in Touch ── */}
      <section className="section gingham-bg">
        <div className="container get-in-touch">
          <div className="git-text">
            <span className="section-label">Get in Touch</span>
            <h2>{ctactHead}</h2>
            <div className="divider" />
            <p style={{lineHeight:1.8}}>{ctactSub}</p>
            <div className="git-details">
              {site.phone     && <a href={`tel:${site.phone}`}>📞 {site.phone}</a>}
              {site.email     && <a href={`mailto:${site.email}`}>✉️ {site.email}</a>}
              {site.instagram && <a href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noopener noreferrer">📸 @{site.instagram}</a>}
              <span>📍 {location}</span>
            </div>
          </div>

          <div className="git-form-wrap">
            {contacted ? (
              <div className="contact-success">
                <div style={{fontSize:'3.5rem',marginBottom:'0.75rem'}}>💌</div>
                <h3>Message Sent!</h3>
                <p>Thank you! We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleContact} className="contact-form">
                <h3>Send a Message</h3>
                <div className="form-row-2">
                  <div className="form-field"><label>Name *</label><input required value={cform.name} onChange={e=>setCform(f=>({...f,name:e.target.value}))} placeholder="Jane Smith" /></div>
                  <div className="form-field"><label>Email *</label><input type="email" required value={cform.email} onChange={e=>setCform(f=>({...f,email:e.target.value}))} placeholder="jane@email.com" /></div>
                </div>
                <div className="form-field"><label>Phone (optional)</label><input value={cform.phone} onChange={e=>setCform(f=>({...f,phone:e.target.value}))} /></div>
                <div className="form-field"><label>Message *</label><textarea required rows={5} value={cform.message} onChange={e=>setCform(f=>({...f,message:e.target.value}))} placeholder="What can I help you with?" /></div>
                <button type="submit" className="btn btn-sage btn-full" disabled={sending}>{sending?'Sending…':'Send Message →'}</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
