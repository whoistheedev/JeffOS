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

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden">
      {/* Wallpaper backdrop (navy fallback while it loads — never black). */}
      {/* Blurred cover-fill behind the contained wallpaper (fills the bands). */}
      {bg && (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${bg}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "blur(28px) brightness(0.85)",
            transform: "scale(1.1)",
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: bg ? "transparent" : "#1e2a44",
          backgroundImage: bg ? `url("${bg}")` : undefined,
          // contain → the whole wallpaper is always visible; blurred layer fills bands.
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Foreground UI */}
      <div className="relative flex h-full flex-col">
        <MobileStatusBar title="JeffOS" />
        <div className="relative flex-1">
          <Springboard />
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
