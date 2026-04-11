import { useState, useEffect } from 'react'
import './InstallPage.css'

export default function InstallPage() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)
  const [tab, setTab] = useState('android') // 'android' | 'iphone'

  useEffect(() => {
    const handler = e => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true)

    // Auto-detect device
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('mac')) {
      setTab('iphone')
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setInstallPrompt(null)
  }

  if (installed) return (
    <div>
      <div className="page-header">
        <div class="container">
          <h1>App Installed! 🎉</h1>
          <p>You're all set — look for Pam's Cakes on your home screen!</p>
        </div>
      </div>
      <div className="install-page container">
        <div className="install-success-card">
          <div className="install-success-icon">🎂</div>
          <h2>You're good to go!</h2>
          <p>The app is installed on your device. Find <strong>Pam's Cakes</strong> on your home screen and tap it to open.</p>
          <a href="/" className="btn btn-sage" style={{marginTop:'1.5rem',display:'inline-block'}}>Open the App →</a>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>Get the App</h1>
          <p>Add Pam's Cooking for Real Life to your phone — browse cakes, place orders, and pay all in one tap.</p>
        </div>
      </div>

      <div className="install-page container">

        {/* One-tap install for Android */}
        {installPrompt && (
          <div className="install-easy-card">
            <div className="install-easy-icon">🚀</div>
            <div>
              <strong>You can install the app right now!</strong>
              <p style={{margin:'0.3rem 0 0',fontSize:'0.9rem',color:'var(--text-muted)'}}>One tap and it'll be on your home screen like any other app.</p>
            </div>
            <button className="btn btn-sage" onClick={handleInstall} style={{flexShrink:0}}>
              Install App
            </button>
          </div>
        )}

        {/* What you get */}
        <div className="install-features">
          <div className="install-feature">
            <span className="install-feature__icon">🎂</span>
            <div>
              <strong>Full cake catalog</strong>
              <span>Browse all cakes with photos, prices, and allergen info</span>
            </div>
          </div>
          <div className="install-feature">
            <span className="install-feature__icon">📅</span>
            <div>
              <strong>Order & pay securely</strong>
              <span>Pick your date, pay your deposit through PayPal, done</span>
            </div>
          </div>
          <div className="install-feature">
            <span className="install-feature__icon">📚</span>
            <div>
              <strong>Cookbooks & recipes</strong>
              <span>Shop books and browse recipes from Pam's kitchen</span>
            </div>
          </div>
          <div className="install-feature">
            <span className="install-feature__icon">🔄</span>
            <div>
              <strong>Always up to date</strong>
              <span>New cakes, prices, and dates update automatically</span>
            </div>
          </div>
        </div>

        {/* Manual instructions */}
        <h2 style={{marginBottom:'1rem',fontFamily:'var(--font-display)',fontSize:'1.8rem',color:'var(--sage-dark)'}}>How to install</h2>

        <div className="install-tabs">
          <button className={`install-tab ${tab==='android'?'active':''}`} onClick={() => setTab('android')}>
            🤖 Android
          </button>
          <button className={`install-tab ${tab==='iphone'?'active':''}`} onClick={() => setTab('iphone')}>
            🍎 iPhone
          </button>
        </div>

        {tab === 'android' && (
          <div className="install-steps-card">
            <div className="install-step">
              <div className="install-step-num">1</div>
              <div className="install-step-content">
                Open <strong>Chrome</strong> on your Android phone and go to<br/>
                <strong style={{color:'var(--sage)',fontFamily:'monospace',fontSize:'0.9rem'}}>pamscookingforreallife.netlify.app</strong>
              </div>
            </div>
            <div className="install-step">
              <div className="install-step-num">2</div>
              <div className="install-step-content">Tap the <strong>three dots ⋮</strong> in the top right corner of Chrome</div>
            </div>
            <div className="install-step">
              <div className="install-step-num">3</div>
              <div className="install-step-content">Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></div>
            </div>
            <div className="install-step">
              <div className="install-step-num">4</div>
              <div className="install-step-content">Tap <strong>Add</strong> to confirm — the app icon appears on your home screen!</div>
            </div>
            <div className="install-step">
              <div className="install-step-num">5</div>
              <div className="install-step-content">Find <strong>Pam's Cakes</strong> on your home screen and tap it to open. It'll look and feel just like a real app!</div>
            </div>
          </div>
        )}

        {tab === 'iphone' && (
          <div className="install-steps-card">
            <div className="install-step">
              <div className="install-step-num">1</div>
              <div className="install-step-content">
                Open <strong>Safari</strong> on your iPhone (must be Safari — Chrome won't work for this on iPhone) and go to<br/>
                <strong style={{color:'var(--sage)',fontFamily:'monospace',fontSize:'0.9rem'}}>pamscookingforreallife.netlify.app</strong>
              </div>
            </div>
            <div className="install-step">
              <div className="install-step-num">2</div>
              <div className="install-step-content">Tap the <strong>Share button</strong> at the bottom of the screen — it looks like a box with an arrow pointing up ⬆️</div>
            </div>
            <div className="install-step">
              <div className="install-step-num">3</div>
              <div className="install-step-content">Scroll down the share menu and tap <strong>"Add to Home Screen"</strong></div>
            </div>
            <div className="install-step">
              <div className="install-step-num">4</div>
              <div className="install-step-content">The name will say "Pam's Cakes" — tap <strong>Add</strong> in the top right corner</div>
            </div>
            <div className="install-step">
              <div className="install-step-num">5</div>
              <div className="install-step-content">Go to your home screen — the <strong>Pam's Cakes</strong> icon is there! Tap it to open in full screen mode.</div>
            </div>
          </div>
        )}

        <div className="install-note">
          <strong>💡 No App Store needed!</strong> This installs directly from the website — no account, no downloads, no storage space used. It updates automatically whenever Pam adds new cakes or changes anything.
        </div>

      </div>
    </div>
  )
}
