import { Suspense, type ComponentType } from "react"
import { ChevronLeft } from "lucide-react"
import { useStore } from "../../store"
import type { AppId } from "../../store/apps"
import { AppRegistry } from "../../apps/registry/registry"
import { playSystemSound } from "../../store/sounds"

/**
 * MobileAppHost — full-screen host for the currently-focused app on a phone.
 *
 * iPhone-OS model: one app fills the screen with a top nav bar (a real
 * ‹ Home / Done control + the app title), instead of a draggable desktop Window
 * with 12px mouse traffic lights. It reads the top of the store's focusStack and
 * renders that app's registered component — so launching from the Springboard
 * (which calls the existing icon.launch() → openWindow) just works.
 *
 * Returns null when no app is open, so the Springboard shows through.
 */
export default function MobileAppHost() {
  const windows = useStore((s) => s.windows)
  const focusStack = useStore((s) => s.focusStack)
  const closeWindow = useStore((s) => s.closeWindow)

  // Topmost non-minimized window is the "foreground app".
  const topId = [...focusStack].reverse().find((id) => windows[id] && !windows[id].minimized)
  const win = topId ? windows[topId] : null
  if (!win) return null

  const appKey = win.appKey as AppId
  const meta = AppRegistry[appKey as keyof typeof AppRegistry]
  const AppComponent = meta?.component as ComponentType<any> | undefined
  const title = meta?.title ?? appKey

  const close = () => {
    playSystemSound("close")
    closeWindow(win.id)
  }

  return (
    <div className="absolute inset-0 z-[200] flex flex-col bg-white">
      {/* iPhone-OS nav bar: Aqua, glossy, with a real Home/Done control. */}
      <div
        className="flex h-11 items-center px-2"
        style={{
          backgroundImage: "linear-gradient(to bottom, #c4ccd6, #94a0b0)",
          borderBottom: "1px solid rgba(0,0,0,0.4)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
          paddingTop: "var(--space-safe-top, 0px)",
        }}
      >
        <button
          onClick={close}
          className="flex items-center gap-0.5 rounded-md px-2 py-1 text-[15px] font-medium text-white active:opacity-70"
          style={{ textShadow: "0 1px 1px rgba(0,0,0,0.4)" }}
        >
          <ChevronLeft size={20} aria-hidden /> Home
        </button>
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[16px] font-semibold text-white"
          style={{ textShadow: "0 1px 1px rgba(0,0,0,0.45)" }}
        >
          {title}
        </div>
      </div>

      {/* App content fills the rest. expandToFit apps stretch; others scroll. */}
      <div className="relative flex-1 overflow-auto">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center" role="status" aria-label="Loading">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500 motion-reduce:animate-none" aria-hidden />
            </div>
          }
        >
          {AppComponent ? (
            <div className="h-full w-full">
              <AppComponent />
            </div>
          ) : (
            <div className="p-4 text-sm text-gray-600">No app found</div>
          )}
        </Suspense>
      </div>
    </div>
  )
}
