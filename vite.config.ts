// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'

/* -------------------------------------------------------------------------- */
/* 🏷  Deployment version — injected at build time (see PWA_AUTO_UPDATE_       */
/*     ARCHITECTURE.md §3). Sourced from Vercel env with git/dev fallbacks.   */
/* -------------------------------------------------------------------------- */
function gitSha(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

const APP_VERSION = {
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID || 'local',
  gitSha: gitSha(),
  buildId: (process.env.VERCEL_GIT_COMMIT_SHA || gitSha()).slice(0, 7),
  releaseTimestamp: new Date().toISOString(),
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
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
      // autoUpdate: the new SW activates automatically (skipWaiting + clientsClaim
      // below) so clients never stay stranded on an old build. The app still
      // shows a brief toast + does ONE guarded soft reload on controllerchange
      // (see components/PWAUpdatePrompt.tsx + PWA_AUTO_UPDATE_ARCHITECTURE.md).
      registerType: 'autoUpdate',
      // We register the SW ourselves via registerSW() in PWAUpdatePrompt so we
      // can drive the update loop (interval + focus) and the controllerchange
      // reload; disable the auto-injected script to avoid a double registration.
      injectRegister: false,
      includeAssets: ['**/*'], // ✅ includes everything in /public (icons/, sound/, etc.)
      manifest: {
        name: 'JeffOS',
        short_name: 'JeffOS',
        description: 'A sleek web-based OS experience built by Jeffrey James Idodo.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        // `any` so the installed PWA can rotate freely — landscape is the natural
        // orientation for gaming (the emulator). A portrait lock blocked it.
        orientation: 'any',
        icons: [
          // NOTE: these live at the public/ ROOT (not /icons/). The old paths
          // pointed at a non-existent /icons/ folder, so the icons 404'd and the
          // browser refused to offer "Install" (a valid icon is required).
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          // A maskable icon makes Android install/adaptive-icon work cleanly.
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // Precache hashed, immutable build assets (JS/CSS/fonts/icons/sounds).
        // NOTE: 'html' is intentionally OMITTED — index.html must NOT be a
        // precached app-shell, or a stale shell pins old chunk hashes (the root
        // cause; see PWA_DEPLOYMENT_STALENESS_AUDIT.md). HTML is network-first.
        globPatterns: ['**/*.{js,css,ico,png,svg,mp3,woff2}'],
        // Disable the SPA navigation fallback to a precached index.html. Without
        // this, vite-plugin-pwa registers NavigationRoute → precached shell,
        // which shadows the NetworkFirst HTML rule and serves stale shells.
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        // autoUpdate lifecycle: the new SW takes over immediately so no client
        // is stranded on an old build.
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          // 🌐 HTML / navigations — ALWAYS network-first; cache only as an
          // offline fallback, never as the canonical version.
          {
            urlPattern: ({ request }) => request.mode === 'navigate' || request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'jeffos-html',
              networkTimeoutSeconds: 3, // fall back to cache only if the network is slow/offline
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 }, // 1 day fallback
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // 🖼 Supabase Storage — wallpapers, ROMs/game assets, thumbs. Aggressive.
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-assets',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // 🖼 Render-endpoint (resized wallpapers/thumbs) — aggressive too.
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/render\/image\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-render',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // 🎵 Local images / audio / fonts — aggressive, bounded.
          {
            urlPattern: ({ request }) =>
              ['image', 'audio', 'font'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'jeffos-assets',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
            },
          },
        ],
      },
    }),
  ],
})
