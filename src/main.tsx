import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/fredoka/500.css'
import '@fontsource/fredoka/600.css'
import './styles/global.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Service-worker updates (production only — vite dev generates no worker).
// Every build stamps index.html and this registration URL with a unique build
// id, so a deploy is always seen as a fresh update regardless of HTTP caches.
// When the new worker takes over a page that opened on the old one, reload
// once: he gets the latest version on the same visit, with no second visit or
// manual refresh. A fresh visit (no controller yet) is already the newest
// build, so reloading there would be pointless.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const buildId = document.querySelector('meta[name="build-id"]')?.getAttribute('content') ?? '0'
  const hadController = !!navigator.serviceWorker.controller
  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return
    reloaded = true
    window.location.reload()
  })
  navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}sw.js?v=${buildId}`, {
      scope: import.meta.env.BASE_URL,
      updateViaCache: 'none'
    })
    .then((reg) => {
      // Browsers only look for updates on navigation; a session that sits
      // open (a long slideshow, or the PWA parked in the background) should
      // still converge to the latest build while it runs.
      window.setInterval(() => void reg?.update().catch(() => {}), 5 * 60 * 1000)
    })
}
