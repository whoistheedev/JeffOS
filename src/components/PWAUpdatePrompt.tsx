import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { registerSW } from "virtual:pwa-register"

/**
 * PWAUpdatePrompt — shows a VISIBLE "Update available" toast when a new build
 * is deployed, instead of silently swapping the app.
 *
 * With `registerType: 'prompt'` + `skipWaiting: false`, the new service worker
 * installs and WAITS. `onNeedRefresh` fires; we show a persistent toast with a
 * "Reload" action. Tapping it calls `updateSW(true)` → the waiting SW activates
 * and the page reloads into the new version.
 *
 * Renders nothing; it just wires up the registration + toast.
 */
export default function PWAUpdatePrompt() {
  // Keep a stable updater across re-renders.
  const updateRef = useRef<((reload?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        toast("A new version of JeffOS is available", {
          description: "Reload to get the latest update.",
          duration: Infinity, // stay until the user acts
          action: {
            label: "Reload",
            onClick: () => updateRef.current?.(true),
          },
        })
      },
      onOfflineReady() {
        toast.success("JeffOS is ready to work offline")
      },
    })
    updateRef.current = updateSW
  }, [])

  return null
}
