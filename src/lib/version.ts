/**
 * Deployment version — injected at build time via Vite `define` (__APP_VERSION__),
 * sourced from Vercel env with git/dev fallbacks. See PWA_AUTO_UPDATE_ARCHITECTURE.md §3.
 *
 * Surfaced in Apple Menu → About This Mac ("About JeffOS").
 */
export type AppVersion = {
  deploymentId: string
  gitSha: string
  buildId: string
  releaseTimestamp: string
}

export const APP_VERSION: AppVersion =
  typeof __APP_VERSION__ !== "undefined"
    ? __APP_VERSION__
    : { deploymentId: "local", gitSha: "unknown", buildId: "dev", releaseTimestamp: new Date(0).toISOString() }

/** Short, human display version, e.g. "1.0 (a1b2c3d)". */
export function displayVersion(): string {
  return `1.0 (${APP_VERSION.buildId})`
}

/** Short git SHA (7). */
export function shortSha(): string {
  return APP_VERSION.gitSha === "unknown" ? "unknown" : APP_VERSION.gitSha.slice(0, 7)
}

/** Build timestamp as a readable local string. */
export function buildTimestamp(): string {
  const t = APP_VERSION.releaseTimestamp
  try {
    return new Date(t).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    })
  } catch {
    return t
  }
}
