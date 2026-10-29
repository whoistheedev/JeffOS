import { defineConfig } from "vitest/config"

// Separate from vite.config.ts on purpose: unit tests don't need the PWA,
// Tailwind or chunking plugins — just a DOM and the TS/JSX transform.
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify({ deploymentId: "test", gitSha: "test", buildId: "test", releaseTimestamp: "" }),
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    // Importing the store constructs the Supabase client. Fixed dummy values
    // keep tests independent of a local .env and away from the live project.
    env: {
      VITE_SUPABASE_URL: "http://127.0.0.1:54321",
      VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: "test-publishable-key",
    },
  },
})
