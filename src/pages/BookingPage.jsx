import { useState } from 'react'
import { availability, homepage } from '../utils/content'
import './BookingPage.css'

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })

  const available = availability.dates.filter(d => !d.booked && d.slots.length > 0)

  const handleDateSelect = (dateObj) => {
    setSelectedDate(dateObj)
    setSelectedSlot(null)
  }

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const body = new URLSearchParams({
      'form-name': 'booking',
      ...form,
      date: selectedDate?.date || '',
      slot: selectedSlot || '',
    })
    try {
      await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() })
      setSubmitted(true)
    } catch {
      setSubmitted(true) // Show success even if fetch fails in dev
    }
  }

  if (submitted) {
    return (
      <div>
        <div className="page-header">
          <div className="container">
            <h1>Booking Request Sent!</h1>
          </div>
        </div>
        <section className="section">
          <div className="container booking-success">
            <div className="booking-success__icon">🎂</div>
            <h2>Thank you, {form.name}!</h2>
            <p>
              We've received your consultation request for <strong>{selectedDate && formatDate(selectedDate.date)}</strong> at <strong>{selectedSlot}</strong>.
            </p>
            <p>
              We'll be in touch at <strong>{form.email}</strong> within 24 hours to confirm your booking.
            </p>
            {homepage.email && (
              <p style={{ marginTop: '0.5rem' }}>
                Questions? Email us at <a href={`mailto:${homepage.email}`} style={{ color: 'var(--rose)' }}>{homepage.email}</a>
              </p>
            )}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>Book a Consultation</h1>
          <p>A free 30-minute call to discuss your cake vision and timeline.</p>
        </div>
      </div>

      <section className="section">
        <div className="container booking-layout">

          {/* Step 1: Pick Date */}
          <div className="booking-steps">
            <div className="booking-step">
              <div className="booking-step__header">
                <span className="booking-step__num">1</span>
                <h3>Choose a Date</h3>
              </div>
              {available.length === 0 ? (
                <p className="booking-none">No dates currently available. Please check back soon or email us directly.</p>
              ) : (
                <div className="date-list">
                  {available.map(dateObj => (
                    <button
                      key={dateObj.date}
                      className={`date-btn ${selectedDate?.date === dateObj.date ? 'active' : ''}`}
                      onClick={() => handleDateSelect(dateObj)}
                    >
                      <span className="date-btn__date">{formatDate(dateObj.date)}</span>
                      <span className="date-btn__count">{dateObj.slots.length} slot{dateObj.slots.length !== 1 ? 's' : ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Pick Time */}
            {selectedDate && (
              <div className="booking-step">
                <div className="booking-step__header">
                  <span className="booking-step__num">2</span>
                  <h3>Choose a Time</h3>
                </div>
                <div className="slot-list">
                  {selectedDate.slots.map(slot => (
                    <button
                      key={slot}
                      className={`slot-btn ${selectedSlot === slot ? 'active' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Contact Info */}
            {selectedDate && selectedSlot && (
              <div className="booking-step">
                <div className="booking-step__header">
                  <span className="booking-step__num">3</span>
                  <h3>Your Details</h3>
                </div>

                <form
                  onSubmit={handleSubmit}
                  data-netlify="true"
                  name="booking"
                  className="booking-form"
                >
                  <input type="hidden" name="form-name" value="booking" />
                  <input type="hidden" name="date" value={selectedDate?.date} />
                  <input type="hidden" name="slot" value={selectedSlot} />

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="name">Full Name *</label>
                      <input id="name" name="name" type="text" required value={form.name} onChange={handleChange} placeholder="Jane Smith" />
                    </div>
                    <div className="form-field">
                      <label htmlFor="email">Email *</label>
                      <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="jane@email.com" />
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="phone">Phone (optional)</label>
                    <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="(336) 555-0100" />
                  </div>

                  <div className="form-field">
                    <label htmlFor="notes">Tell me about your event</label>
                    <textarea id="notes" name="notes" rows={4} value={form.notes} onChange={handleChange} placeholder="Date of event, type of cake, number of guests, any ideas or inspiration…" />
                  </div>

                  <button type="submit" className="btn btn-rose btn-full">
                    Send Booking Request →
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar info */}
          <aside className="booking-sidebar">
            <div className="booking-info-card">
              <h4>What to Expect</h4>
              <ul>
                <li>📞 30-minute phone or video call</li>
                <li>🎂 We'll discuss your cake design, flavors, and size</li>
                <li>📅 Timeline and delivery planning</li>
                <li>💰 Pricing and deposit details</li>
              </ul>
            </div>
            {homepage.email && (
              <div className="booking-info-card">
                <h4>Prefer to Email?</h4>
                <p>Reach us directly at:</p>
                <a href={`mailto:${homepage.email}`} className="booking-email-link">{homepage.email}</a>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  )
}
