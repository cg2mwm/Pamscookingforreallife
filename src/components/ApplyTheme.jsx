import { useEffect } from 'react'
import { getSetting } from '../supabase'

// Loads saved colors/fonts from Supabase and applies them to CSS variables
export default function ApplyTheme() {
  useEffect(() => {
    getSetting('page_home').then(pg => {
      if (!pg) return
      if (pg.color_primary)   document.documentElement.style.setProperty('--sage-dark',  pg.color_primary)
      if (pg.color_secondary) document.documentElement.style.setProperty('--sage',        pg.color_secondary)
      if (pg.color_bg)        document.documentElement.style.setProperty('--cream',       pg.color_bg)
      if (pg.font_heading)    document.documentElement.style.setProperty('--font-display', `'${pg.font_heading}', cursive`)
    })
  }, [])
  return null
}
