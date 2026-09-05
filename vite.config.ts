import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const BASE = '/animal-sounds/'

/** Unique id per build, injected into index.html as <meta name="build-id">.
    main.tsx appends it to the sw.js URL so every deploy is a fresh,
    uncacheable service-worker update, and parent settings can display it. */
function buildStamp(): Plugin {
  const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  return {
    name: 'build-stamp',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { name: 'build-id', content: stamp },
          injectTo: 'head'
        }
      ]
    }
  }
}

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    buildStamp(),
    VitePWA({
      registerType: 'autoUpdate',
      // main.tsx registers the worker itself with the build id appended.
      injectRegister: null,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Animal Sounds',
        short_name: 'Animals',
        description: 'A fullscreen slideshow of animal photos, names and sounds for little learners.',
        lang: 'en',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'any',
        background_color: '#FBF3E4',
        theme_color: '#FBF3E4',
        icons: [
          { src: `${BASE}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${BASE}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
          { src: `${BASE}icons/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Precache every photo, sound and font so the app is fully offline
        // after the first visit.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,mp3,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true
      }
    })
  ]
})
