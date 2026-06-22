// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        /**
         * ⚡ Vendor chunk optimization.
         *
         * IMPORTANT: React MUST share a chunk with every library that consumes
         * it at module-evaluation time (react-rnd, @dnd-kit, @radix-ui,
         * framer-motion). Splitting them into separate chunks broke the
         * initialization order in the production build — a React-consuming vendor
         * chunk could evaluate before vendor-react finished, throwing
         * "Cannot set properties of undefined (setting 'Children')" (white
         * screen). So all React + React-UI libs go in ONE `vendor-react` chunk.
         *
         * Supabase has no React dependency at eval time, so it stays separate for
         * independent caching. App code is still code-split via React.lazy() in
         * the app registry (heavy apps stay out of the initial bundle).
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@supabase')) return 'vendor-supabase'
          if (
            /[\\/]node_modules[\\/](react|react-dom|scheduler|react-rnd|@dnd-kit|@radix-ui|framer-motion|use-sync-external-store)[\\/]/.test(
              id,
            )
          )
            return 'vendor-react'
          // everything else: let Rollup decide (default vendor splitting)
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['**/*'], // ✅ includes everything in /public (icons/, sound/, etc.)
      manifest: {
        name: 'JeffOS',
        short_name: 'JeffOS',
        description: 'A sleek web-based OS experience built by Jeffrey James Idodo.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icons/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,woff2}'],
        cleanupOutdatedCaches: true,
        // Take over immediately so a client that cached a broken build (e.g.
        // the earlier vendor-chunk crash) gets the fixed bundle on next load
        // instead of being served the stale, broken precache.
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          // ✅ Cache wallpapers, icons, sounds, etc. from Supabase Storage
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-assets',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 days
            },
          },
          // ✅ Cache local assets (images, audio, fonts)
          {
            urlPattern: ({ request }) =>
              ['image', 'audio', 'font'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'jeffos-assets',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
            },
          },
          // ✅ Cache HTML pages for offline reload
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'jeffos-pages',
            },
          },
        ],
      },
    }),
  ],
})
