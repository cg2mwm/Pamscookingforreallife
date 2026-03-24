import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL  || ''
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(url, key)

// ── Cakes ──────────────────────────────────────────
export async function getCakes() {
  const { data } = await supabase.from('cakes').select('*').order('featured', { ascending: false })
  return data || []
}
export async function getCake(id) {
  const { data } = await supabase.from('cakes').select('*').eq('id', id).single()
  return data
}
export async function saveCake(cake) {
  if (cake.id) {
    const { id, ...rest } = cake
    return supabase.from('cakes').update(rest).eq('id', id)
  }
  return supabase.from('cakes').insert(cake)
}
export async function deleteCake(id) {
  return supabase.from('cakes').delete().eq('id', id)
}

// ── Blog ───────────────────────────────────────────
export async function getPosts() {
  const { data } = await supabase.from('blog_posts').select('*').order('date', { ascending: false })
  return data || []
}
export async function getPost(id) {
  const { data } = await supabase.from('blog_posts').select('*').eq('id', id).single()
  return data
}
export async function savePost(post) {
  if (post.id) {
    const { id, ...rest } = post
    return supabase.from('blog_posts').update(rest).eq('id', id)
  }
  return supabase.from('blog_posts').insert(post)
}
export async function deletePost(id) {
  return supabase.from('blog_posts').delete().eq('id', id)
}

// ── Settings ───────────────────────────────────────
export async function getSetting(key) {
  const { data } = await supabase.from('settings').select('value').eq('key', key).single()
  return data?.value || null
}
export async function setSetting(key, value) {
  return supabase.from('settings').upsert({ key, value })
}

// ── Availability ───────────────────────────────────
export async function getAvailability() {
  const { data } = await supabase.from('availability').select('*').order('date')
  return data || []
}
export async function saveAvailability(row) {
  return supabase.from('availability').upsert(row, { onConflict: 'date' })
}
export async function deleteAvailability(id) {
  return supabase.from('availability').delete().eq('id', id)
}

// ── Image Upload ───────────────────────────────────
export async function uploadImage(file) {
  const ext  = file.name.split('.').pop()
  const name = `${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('images').upload(name, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('images').getPublicUrl(name)
  return data.publicUrl
}
