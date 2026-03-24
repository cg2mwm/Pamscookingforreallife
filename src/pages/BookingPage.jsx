import { useState, useEffect } from 'react'
import { getAvailability, getSetting } from '../supabase'
import './BookingPage.css'

function buildCalendar(year, month, availMap) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks = []
  let day = 1 - firstDay
  for (let w = 0; w < 6; w++) {
    const week = []
    for (let d = 0; d < 7; d++, day++) {
      if (day < 1 || day > daysInMonth) { week.push(null); continue }
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
      week.push({ day, dateStr, avail: availMap[dateStr] || null })
    }
    if (week.some(d => d !== null)) weeks.push(week)
  }
  return weeks
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function BookingPage() {
  const [availability, setAvailability] = useState([])
  const [pg, setPg] = useState({})
  const [selected, setSelected] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', phone:'', notes:'' })
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  useEffect(() => {
    getAvailability().then(setAvailability)
    getSetting('page_booking').then(d => setPg(d || {}))
  }, [])

  const availMap = {}
  availability.forEach(a => { availMap[a.date] = a })
  const weeks = buildCalendar(calYear, calMonth, availMap)

  const prevMonth = () => { if (calMonth===0){setCalYear(y=>y-1);setCalMonth(11)}else setCalMonth(m=>m-1) }
  const nextMonth = () => { if (calMonth===11){setCalYear(y=>y+1);setCalMonth(0)}else setCalMonth(m=>m+1) }

  const handleSubmit = async e => {
    e.preventDefault()
    const body = new URLSearchParams({ 'form-name':'booking', ...form, date:selected?.dateStr||'', slot:selectedSlot||'' })
    try { await fetch('/', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body: body.toString() }) } catch {}
    setSubmitted(true)
  }

  const fmt = d => new Date(d+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})

  // Sidebar bullet points
  const sidebarItems = (pg.sidebar_text || '30-minute phone or video call\nDiscuss your cake design and flavors\nPlan your timeline and delivery\nPricing and deposit details').split('\n').filter(Boolean)

  if (submitted) return (
    <div>
      <div className="page-header"><div className="container"><h1>Request Sent! 🎂</h1></div></div>
      <section className="section"><div className="container" style={{textAlign:'center',maxWidth:520}}>
        <p style={{fontSize:'5rem',marginBottom:'1rem'}}>🎉</p>
        <h2 style={{marginBottom:'1rem'}}>Thank you, {form.name}!</h2>
        <p>We received your request for <strong>{selected && fmt(selected.dateStr)}</strong> at <strong>{selectedSlot}</strong>.</p>
        <p style={{marginTop:'0.5rem'}}>We'll be in touch at <strong>{form.email}</strong> within 24 hours.</p>
      </div></section>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>{pg.heading || 'Book a Consultation'}</h1>
          <p>{pg.subtext || 'A free 30-minute call to design your perfect cake.'}</p>
        </div>
      </div>
      <section className="section">
        <div className="container booking-layout">
          <div className="booking-main">
            <div className="cal-card">
              <div className="cal-header">
                <button className="cal-nav" onClick={prevMonth}>‹</button>
                <h3 className="cal-title">{MONTHS[calMonth]} {calYear}</h3>
                <button className="cal-nav" onClick={nextMonth}>›</button>
              </div>
              <div className="cal-grid">
                {DAYS.map(d => <div key={d} className="cal-dayname">{d}</div>)}
                {weeks.map((week, wi) =>
                  week.map((cell, di) => {
                    if (!cell) return <div key={`e-${wi}-${di}`} className="cal-cell cal-cell--empty" />
                    const isPast = new Date(cell.dateStr) < new Date(today.toDateString())
                    const isAvail = !!cell.avail && !cell.avail.booked && !isPast
                    const isBooked = cell.avail?.booked
                    const isSelected = selected?.dateStr === cell.dateStr
                    return (
                      <button key={cell.dateStr}
                        className={`cal-cell ${isAvail?'cal-cell--avail':''} ${isBooked?'cal-cell--booked':''} ${isPast?'cal-cell--past':''} ${isSelected?'cal-cell--selected':''}`}
                        onClick={() => { if(isAvail){ setSelected(cell); setSelectedSlot(null) } }}
                        disabled={!isAvail}
                      >
                        <span className="cal-cell__num">{cell.day}</span>
                        {isAvail && <span className="cal-cell__dot" />}
                        {isBooked && <span className="cal-cell__x">✕</span>}
                      </button>
                    )
                  })
                )}
              </div>
              <div className="cal-legend">
                <span><span className="legend-dot legend-avail"/>Available</span>
                <span><span className="legend-dot legend-booked"/>Booked</span>
                <span><span className="legend-dot legend-selected"/>Selected</span>
              </div>
            </div>

            {selected && (
              <div className="booking-step">
                <h4>Available times on {fmt(selected.dateStr)}</h4>
                <div className="slots">
                  {selected.avail.slots.map(slot => (
                    <button key={slot} className={`slot-btn ${selectedSlot===slot?'active':''}`} onClick={()=>setSelectedSlot(slot)}>{slot}</button>
                  ))}
                </div>
              </div>
            )}

            {selected && selectedSlot && (
              <div className="booking-step">
                <h4>Your Details</h4>
                <form onSubmit={handleSubmit} data-netlify="true" name="booking" className="booking-form">
                  <input type="hidden" name="form-name" value="booking" />
                  <input type="hidden" name="date" value={selected?.dateStr} />
                  <input type="hidden" name="slot" value={selectedSlot} />
                  <div className="form-row">
                    <div className="form-field"><label>Full Name *</label><input name="name" type="text" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Jane Smith" /></div>
                    <div className="form-field"><label>Email *</label><input name="email" type="email" required value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="jane@email.com" /></div>
                  </div>
                  <div className="form-field"><label>Phone (optional)</label><input name="phone" type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></div>
                  <div className="form-field"><label>Tell me about your event</label><textarea name="notes" rows={4} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Date of event, type of cake, number of guests…" /></div>
                  <button type="submit" className="btn btn-sage btn-full">Send Booking Request →</button>
                </form>
              </div>
            )}
          </div>

          <aside className="booking-sidebar">
            <div className="booking-info-card">
              <h4>What to Expect</h4>
              <ul>
                {sidebarItems.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
