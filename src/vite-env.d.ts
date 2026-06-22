/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** Build-time deployment version, injected by Vite `define` (see vite.config.ts). */
declare const __APP_VERSION__: {
  deploymentId: string
  gitSha: string
  buildId: string
  releaseTimestamp: string
}
