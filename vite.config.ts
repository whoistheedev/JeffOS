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
         * Group large, stable third-party libraries into named chunks so they
         * cache independently of app code and don't all land in the entry chunk.
         * Grouped conservatively to avoid circular vendor chunks. App code itself
         * is split automatically via React.lazy() in the app registry — heavy
         * apps (Games/EmulatorJS, Synth, Explorer, Terminal, iTunes) therefore
         * become their own on-demand chunks and stay out of the initial bundle.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id))
            return 'vendor-react'
          if (id.includes('framer-motion')) return 'vendor-motion'
          if (id.includes('@supabase')) return 'vendor-supabase'
          if (id.includes('@dnd-kit') || id.includes('react-rnd')) return 'vendor-dnd'
          if (id.includes('@radix-ui')) return 'vendor-radix'
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
