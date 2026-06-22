/**
 * updateBus — a tiny "busy" registry so the PWA auto-update soft-reload can be
 * DEFERRED while a sensitive task is in flight (a game session, a guestbook
 * submission, etc.), then applied when the app is idle again.
 *
 * Usage:
 *   const release = beginBusy("guestbook-submit")
 *   try { ...await submit()... } finally { release() }
 *
 * The PWA update handler checks `isBusy()` before reloading; if busy, it retries
 * on the next idle tick / visibility regain. See PWA_AUTO_UPDATE_ARCHITECTURE.md §5.
 */
const busy = new Set<string>()
const listeners = new Set<() => void>()

export function beginBusy(reason: string): () => void {
  busy.add(reason)
  return () => {
    busy.delete(reason)
    if (busy.size === 0) listeners.forEach((l) => l())
  }
}

export function isBusy(): boolean {
  // Also treat an actively-focused game iframe as "busy" (don't yank a game).
  if (typeof document !== "undefined") {
    const active = document.activeElement
    if (active && active.tagName === "IFRAME") return true
  }
  return busy.size > 0
}

/** Fires when the app transitions from busy → idle (all tasks released). */
export function onIdle(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
