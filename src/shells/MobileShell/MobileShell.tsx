import { useStore } from "../../store"
import { wallpaperUrl as renderWallpaper } from "../../lib/imageUrl"
import Spotlight from "../../components/Spotlight"
import Dashboard from "../../components/Dashboard"
import MobileStatusBar from "./MobileStatusBar"
import Springboard from "./Springboard"
import MobileAppHost from "./MobileAppHost"

/**
 * 📱 MobileShell — "JeffOS Mobile": the iPhone-OS-era touch shell.
 *
 * The desktop is macOS Tiger; this is the iPhone of that era (iPhone OS 1–3) —
 * same Aqua/Lucida/pinstripe look, but a touch-native interaction model:
 *
 *   - a slim Aqua status bar (NOT the Mac menu bar),
 *   - a Springboard home grid of glossy app icons + a fixed dock,
 *   - apps that open full-screen with a real Home/Done nav bar (MobileAppHost),
 *     instead of draggable windows with 12px mouse traffic lights.
 *
 * It reuses the existing app registry, desktopIcons, launch()/openWindow, Fuse
 * Spotlight index and system sounds — no separate app implementations. The
 * previous shell delegated to <DesktopShell/> (a Tiger desktop shrunk onto a
 * phone); this replaces that with a phone-native home screen.
 *
 * @see UX_AUDIT_RECRUITER_TO_JEFFOS.md §5
 */
export default function MobileShell() {
  const wallpaper = useStore((s) => s.prefs.wallpaper)
  const bg = renderWallpaper(wallpaper?.full)

  // Is a foreground app open? (same rule as MobileAppHost: a non-minimized
  // window on the focus stack). When it is, the Springboard sits behind a
  // full-screen app — hide it from the a11y tree + keyboard traversal so screen
  // readers/Tab don't reach the covered icons. (UX_AUDIT — a11y finding.)
  const windows = useStore((s) => s.windows)
  const focusStack = useStore((s) => s.focusStack)
  const appOpen = [...focusStack].reverse().some((id) => windows[id] && !windows[id].minimized)

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden">
      {/* Wallpaper — full-screen COVER on the home screen, like a real iPhone
          (no flat blue top/bottom bands). A subtle blue translucent overlay sits
          above it so the glossy icon labels stay readable over any wallpaper. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#4a6fab", // fallback while the image loads
          backgroundImage: bg ? `url("${bg}")` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Readability scrim — gentle top-to-bottom darken + a hint of Tiger blue. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(20,40,80,0.28), rgba(20,40,80,0.10) 35%, rgba(20,40,80,0.22))",
        }}
      />

      {/* Foreground UI */}
      <div className="relative flex h-full flex-col">
        <MobileStatusBar title="JeffOS" />
        <div className="relative flex-1">
          {/* When an app is open, the Springboard is covered — make it inert +
              aria-hidden so screen readers / keyboard Tab skip the hidden icons. */}
          <div className="absolute inset-0" inert={appOpen ? true : undefined} aria-hidden={appOpen || undefined}>
            <Springboard />
          </div>
          {/* Full-screen foreground app (null when nothing is open). */}
          <MobileAppHost />
        </div>
      </div>

      {/* Spotlight search (triggered by the dock Search button → spotlight:open)
          and Dashboard (F12 is desktop-only, but mounting it is harmless and
          keeps widget parity). */}
      <Spotlight />
      <Dashboard />
    </div>
  )
}
