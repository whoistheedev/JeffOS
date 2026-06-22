import { useEffect } from "react"
import { toast } from "sonner"
import { registerSW } from "virtual:pwa-register"
import { isBusy, onIdle } from "../lib/updateBus"

/**
 * PWAUpdatePrompt — production auto-update handler (see PWA_AUTO_UPDATE_ARCHITECTURE.md).
 *
 * autoUpdate strategy: the new SW activates automatically (skipWaiting +
 * clientsClaim in vite.config). This component:
 *   1. registers the SW with `immediate: true`,
 *   2. polls `registration.update()` on an interval + on focus/visibility/online
 *      so long-lived tabs detect new deployments without a manual refresh,
 *   3. on `controllerchange` (the new SW took control), shows a brief toast and
 *      does ONE guarded soft reload — deferred while the app is "busy" (a game
 *      session / guestbook submit) and guarded against infinite loops.
 *
 * Renders nothing.
 */

// Module-level flag — a reload fires AT MOST once per page life (no loop).
let reloading = false

export default function PWAUpdatePrompt() {
  useEffect(() => {
    // controllerchange = a new SW has taken control of this page → reload to the
    // new build. Guarded so it happens once and never while busy.
    const onControllerChange = () => {
      const doReload = () => {
        if (reloading) return
        reloading = true
        toast("Updated to the latest version", { duration: 1200 })
        // brief beat so the toast is visible, then a soft reload.
        window.setTimeout(() => window.location.reload(), 1200)
      }
      if (isBusy()) {
        // Defer until the app is idle (game/guestbook finished), then reload.
        const off = onIdle(() => { off(); doReload() })
        // Safety net: also retry when the tab regains focus.
        const onVis = () => { if (!isBusy()) { document.removeEventListener("visibilitychange", onVis); off(); doReload() } }
        document.addEventListener("visibilitychange", onVis)
      } else {
        doReload()
      }
    }
    navigator.serviceWorker?.addEventListener?.("controllerchange", onControllerChange)

    const updateSW = registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return
        // Proactively check for a new deployment: every 60s, and whenever the
        // tab regains focus or the device comes back online. Cheap (a HEAD-ish
        // revalidation of sw.js, which is no-cache at the edge).
        const check = () => { registration.update().catch(() => {}) }
        const interval = window.setInterval(check, 60_000)
        const onFocus = () => check()
        const onOnline = () => check()
        const onVisible = () => { if (document.visibilityState === "visible") check() }
        window.addEventListener("focus", onFocus)
        window.addEventListener("online", onOnline)
        document.addEventListener("visibilitychange", onVisible)
        // (cleanup omitted intentionally — this lives for the app's lifetime)
        void interval
      },
      onOfflineReady() {
        toast.success("JeffOS is ready to work offline")
      },
    })
    // autoUpdate: registerSW also auto-applies; keep a ref so TS doesn't flag it.
    void updateSW

    return () => {
      navigator.serviceWorker?.removeEventListener?.("controllerchange", onControllerChange)
    }
  }, [])

  return null
}
