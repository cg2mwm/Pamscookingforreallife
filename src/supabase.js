import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL  || ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
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
  if (cake.id) { const { id, ...rest } = cake; return supabase.from('cakes').update(rest).eq('id', id) }
  return supabase.from('cakes').insert(cake)
}
export async function deleteCake(id) { return supabase.from('cakes').delete().eq('id', id) }

// ── Books ──────────────────────────────────────────
export async function getBooks() {
  const { data } = await supabase.from('books').select('*').order('featured', { ascending: false })
  return data || []
}
export async function saveBook(book) {
  if (book.id) { const { id, ...rest } = book; return supabase.from('books').update(rest).eq('id', id) }
  return supabase.from('books').insert(book)
}
export async function deleteBook(id) { return supabase.from('books').delete().eq('id', id) }

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
  if (post.id) { const { id, ...rest } = post; return supabase.from('blog_posts').update(rest).eq('id', id) }
  return supabase.from('blog_posts').insert(post)
}
export async function deletePost(id) { return supabase.from('blog_posts').delete().eq('id', id) }

// ── Settings ───────────────────────────────────────
export async function getSetting(key) {
  const { data } = await supabase.from('settings').select('value').eq('key', key).single()
  return data?.value || null
}
export async function setSetting(key, value) {
  return supabase.from('settings').upsert({ key, value })
}

// ── Availability ───────────────────────────────────
// type = 'pickup' | 'consultation'
export async function getAvailability(type) {
  let q = supabase.from('availability').select('*').order('date')
  if (type) q = q.eq('type', type)
  const { data } = await q
  return data || []
}
export async function saveAvailability(row) {
  return supabase.from('availability').upsert(row, { onConflict: 'date' })
}
export async function deleteAvailability(id) {
  return supabase.from('availability').delete().eq('id', id)
}
// Called immediately when a customer picks a pickup date — marks it booked right away
export async function bookPickupDate(date) {
  return supabase.from('availability').update({ booked: true }).eq('date', date).eq('type', 'pickup')
}

// ── Orders ─────────────────────────────────────────
export async function getOrders() {
  const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
  return data || []
}
export async function placeOrder(order) {
  const { data, error } = await supabase.from('orders').insert(order).select().single()
  if (error) throw error
  return data
}
export async function updateOrderStatus(id, status) {
  return supabase.from('orders').update({ status }).eq('id', id)
}
export async function deleteOrder(id) { return supabase.from('orders').delete().eq('id', id) }

// ── Contact Requests ───────────────────────────────
export async function getContactRequests() {
  const { data } = await supabase.from('contact_requests').select('*').order('created_at', { ascending: false })
  return data || []
}
export async function saveContactRequest(req) {
  return supabase.from('contact_requests').insert(req)
}
export async function updateContactStatus(id, status) {
  return supabase.from('contact_requests').update({ status }).eq('id', id)
}
export async function deleteContactRequest(id) {
  return supabase.from('contact_requests').delete().eq('id', id)
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

// ── Payment link ───────────────────────────────────
export function buildPaymentLink(payment, amount) {
  if (!payment) return null
  const { method, payment_id } = payment
  const amt = Number(amount).toFixed(2)
  if (method === 'PayPal') {
    const id = payment_id?.includes('@') ? payment_id.replace('@','') : payment_id
    return `https://paypal.me/${id}/${amt}`
  }
  if (method === 'Venmo')   return `https://venmo.com/${payment_id}?txn=charge&amount=${amt}&note=Cake+Deposit`
  if (method === 'CashApp') return `https://cash.app/${payment_id?.startsWith('$') ? payment_id : '$'+payment_id}/${amt}`
  return null
}

// ── Photos ─────────────────────────────────────────
export async function getPhotos() {
  const { data } = await supabase.from('photos').select('*').order('sort_order').order('created_at', { ascending: false })
  return data || []
}
export async function savePhoto(photo) {
  if (photo.id) { const { id, ...rest } = photo; return supabase.from('photos').update(rest).eq('id', id) }
  return supabase.from('photos').insert(photo)
}
export async function deletePhoto(id) { return supabase.from('photos').delete().eq('id', id) }

// ── Photo Galleries ────────────────────────────────
export async function getGalleries() {
  const { data } = await supabase.from('photo_galleries').select('*').order('created_at', { ascending: false })
  return data || []
}
export async function getGallery(id) {
  const { data } = await supabase.from('photo_galleries').select('*').eq('id', id).single()
  return data
}
export async function saveGallery(gallery) {
  if (gallery.id) { const { id, ...rest } = gallery; return supabase.from('photo_galleries').update(rest).eq('id', id) }
  const { data, error } = await supabase.from('photo_galleries').insert(gallery).select().single()
  if (error) throw error
  return data
}
export async function deleteGallery(id) { return supabase.from('photo_galleries').delete().eq('id', id) }

// ── Gallery Photos ─────────────────────────────────
export async function getGalleryPhotos(galleryId) {
  const { data } = await supabase.from('gallery_photos').select('*').eq('gallery_id', galleryId).order('step_number')
  return data || []
}
export async function saveGalleryPhoto(photo) {
  if (photo.id) { const { id, ...rest } = photo; return supabase.from('gallery_photos').update(rest).eq('id', id) }
  return supabase.from('gallery_photos').insert(photo)
}
export async function deleteGalleryPhoto(id) { return supabase.from('gallery_photos').delete().eq('id', id) }
