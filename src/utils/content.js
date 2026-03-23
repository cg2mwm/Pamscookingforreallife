import matter from 'gray-matter'
import homepageRaw from '../../content/settings/homepage.json'
import paymentsRaw from '../../content/settings/payments.json'
import availabilityRaw from '../../content/settings/availability.json'

// NOTE: { as: 'raw' } is the correct Vite 4/5 syntax for text file imports
const cakeModules = import.meta.glob('../../content/cakes/*.md', { as: 'raw', eager: true })
const blogModules = import.meta.glob('../../content/blog/*.md', { as: 'raw', eager: true })

function parseMarkdown(modules) {
  return Object.entries(modules).map(([filePath, raw]) => {
    try {
      const { data, content } = matter(raw)
      const filename = filePath.split('/').pop()
      const slug = filename.replace('.md', '')
      return { ...data, slug, body: content }
    } catch (e) {
      console.error('Failed to parse markdown:', filePath, e)
      return null
    }
  }).filter(Boolean)
}

export const cakes = parseMarkdown(cakeModules)
  .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))

export const blogPosts = parseMarkdown(blogModules)
  .sort((a, b) => new Date(b.date) - new Date(a.date))

export const homepage = homepageRaw
export const payments = paymentsRaw
export const availability = availabilityRaw

export function getPaymentLink(cakePrice, depositPercent) {
  const amount = ((cakePrice * (depositPercent || 30)) / 100).toFixed(2)
  const method = payments?.method || 'Custom'
  const paymentId = payments?.paymentId || ''

  if (method === 'PayPal') {
    const id = paymentId.includes('@') ? paymentId.replace('@', '') : paymentId
    return {
      url: `https://paypal.me/${id}/${amount}`,
      label: `Pay $${amount} Deposit via PayPal`,
    }
  } else if (method === 'Venmo') {
    return {
      url: `https://venmo.com/${paymentId}?txn=charge&amount=${amount}&note=Cake+Deposit`,
      label: `Pay $${amount} Deposit via Venmo`,
    }
  } else if (method === 'CashApp') {
    const handle = paymentId.startsWith('$') ? paymentId : `$${paymentId}`
    return {
      url: `https://cash.app/${handle}/${amount}`,
      label: `Pay $${amount} Deposit via Cash App`,
    }
  } else {
    return {
      url: null,
      label: `Pay $${amount} Deposit`,
      instructions: payments?.customInstructions || `Send $${amount} via ${method} to ${paymentId}`,
    }
  }
}
