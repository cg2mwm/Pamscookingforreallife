import { useEffect } from 'react'
import { getSetting } from '../supabase'

const FONT_URLS = {
  'Dancing Script':     'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&display=swap',
  'Playfair Display':   'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&display=swap',
  'Lora':               'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&display=swap',
  'Cormorant Garamond': 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&display=swap',
  'Pacifico':           'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
  'Satisfy':            'https://fonts.googleapis.com/css2?family=Satisfy&display=swap',
  'Great Vibes':        'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap',
  'Abril Fatface':      'https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap',
  'Lato':               'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap',
  'Nunito':             'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600&display=swap',
  'Poppins':            'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap',
  'Merriweather':       'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap',
}

export function loadFont(name) {
  if (!name || !FONT_URLS[name]) return
  if (document.querySelector(`link[data-font="${name}"]`)) return
  const link = document.createElement('link')
  link.rel  = 'stylesheet'
  link.href = FONT_URLS[name]
  link.setAttribute('data-font', name)
  document.head.appendChild(link)
}

export function applyTheme(t) {
  if (!t) return
  const r = document.documentElement
  if (t.color_primary)   r.style.setProperty('--sage-dark',   t.color_primary)
  if (t.color_secondary) r.style.setProperty('--sage',        t.color_secondary)
  if (t.color_accent)    r.style.setProperty('--sage-mid',    t.color_accent)
  if (t.color_bg)        r.style.setProperty('--cream',       t.color_bg)
  if (t.color_bg_dark)   r.style.setProperty('--cream-dark',  t.color_bg_dark)
  if (t.color_text)      r.style.setProperty('--text',        t.color_text)
  if (t.color_nav)       r.style.setProperty('--sage-dark',   t.color_nav)
  if (t.button_radius)   r.style.setProperty('--btn-radius',  t.button_radius)
  if (t.card_radius)     r.style.setProperty('--radius',      t.card_radius)
  if (t.font_heading) {
    loadFont(t.font_heading)
    r.style.setProperty('--font-display', `'${t.font_heading}', cursive`)
  }
  if (t.font_body) {
    loadFont(t.font_body)
    r.style.setProperty('--font-body', `'${t.font_body}', sans-serif`)
  }
}

export default function ApplyTheme() {
  useEffect(() => { getSetting('theme').then(applyTheme) }, [])
  return null
}
