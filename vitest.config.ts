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
  },
})
