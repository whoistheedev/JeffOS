import { useStore } from "../../store"
import type { AppIcon, AppId } from "../../store/apps"
import { AppIconRenderer } from "../../components/AppIconRenderer"
import { AppRegistry } from "../../apps/registry/registry"
import { playSystemSound } from "../../store/sounds"
import { commandBus } from "../../lib/commandBus"
import { Search, Briefcase } from "lucide-react"

/**
 * Springboard — the iPhone-OS-era home screen (the touch sibling of the Tiger
 * desktop). A paged grid of glossy rounded-rect app icons over the wallpaper,
 * plus a fixed bottom dock. Tapping an icon launches the app full-screen (the
 * MobileAppHost), reusing the existing AppRegistry / desktopIcons / launch().
 *
 * No Mac menu bar, no free-drag desktop, no hover-magnify dock — those are
 * desktop idioms. This is the home screen iPhone OS 1–3 would have shipped with
 * the same Aqua/Lucida look.
 */

/**
 * Short, home-screen-friendly labels for the Springboard. iPhone home screens
 * use terse names; the desktop registry names ("Desktop & Screen Saver",
 * "Buy Me a Coffee") truncate to "Desktop & …" / "Buy Me a C…" on a phone tile,
 * which fails the QA bar. Override the long ones with crisp mobile names.
 */
const MOBILE_NAME: Partial<Record<AppId, string>> = {
  wallpapers: "Wallpaper",
  bmcoffee: "Coffee",
}

/** Tiger-correct display name for an app id (Safari/iTunes/Games…), with fallback. */
function displayName(id: AppId, fallback: string) {
  return MOBILE_NAME[id] ?? AppRegistry[id as keyof typeof AppRegistry]?.title ?? fallback
}

function SpringIcon({ icon, label }: { icon: AppIcon; label: string }) {
  return (
    <button
      onClick={() => {
        playSystemSound("open")
        icon.launch()
      }}
      className="flex flex-col items-center gap-1.5"
      style={{ width: 72 }}
    >
      {/* Glossy rounded-rect tile — the iPhone-OS app-icon chrome. */}
      <span
        className="relative flex items-center justify-center"
        style={{
          width: 57,
          height: 57,
          borderRadius: 13,
          background: "linear-gradient(to bottom, rgba(255,255,255,0.35), rgba(255,255,255,0.05))",
          border: "1px solid rgba(255,255,255,0.4)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        <span style={{ width: 40, height: 40 }} className="flex items-center justify-center">
          <AppIconRenderer icon={icon} size="dock" />
        </span>
        {/* top specular gloss */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 1,
            left: 3,
            right: 3,
            height: "45%",
            borderRadius: "11px 11px 40% 40%",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.55), rgba(255,255,255,0))",
            pointerEvents: "none",
          }}
        />
      </span>
      <span
        className="max-w-full truncate text-[11px] font-medium text-white"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
      >
        {label}
      </span>
    </button>
  )
}

export default function Springboard() {
  const icons = useStore((s) => s.desktopIcons)

  // Dock = a fixed 4: the era convention. Finder, Safari (explorer), Spotlight
  // (a search affordance), and a first-class Recruiter exit (no Apple menu on
  // a phone). Everything else lives on the home grid.
  const findIcon = (id: AppId) => icons.find((i) => i.id === id)
  const finder = findIcon("finder")
  const safari = findIcon("explorer")

  // Home grid = all launchable apps except the two pinned to the dock.
  const gridApps = icons.filter((i) => i.id !== "finder" && i.id !== "explorer")

  return (
    <div className="relative flex h-full flex-col">
      {/* Home grid */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-2">
        <div className="grid grid-cols-4 gap-x-2 gap-y-5 justify-items-center">
          {gridApps.map((icon) => (
            <SpringIcon key={icon.id} icon={icon} label={displayName(icon.id, icon.title)} />
          ))}
        </div>
      </div>

      {/* Page dots (single page for now) */}
      <div className="flex justify-center gap-1.5 pb-2" aria-hidden>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "rgba(255,255,255,0.9)" }} />
      </div>

      {/* Fixed dock — glassy shelf, 4 slots, tap-only (no magnify). */}
      <div
        className="mx-3 mb-[max(0.5rem,var(--space-safe-bottom))] flex items-center justify-around rounded-2xl px-3 py-2"
        style={{
          background: "linear-gradient(to bottom, rgba(255,255,255,0.28), rgba(255,255,255,0.08))",
          border: "1px solid rgba(255,255,255,0.35)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5)",
          backdropFilter: "blur(8px)",
        }}
      >
        {finder && <DockSlot icon={finder} label="Finder" />}
        {safari && <DockSlot icon={safari} label="Safari" />}
        <DockButton
          label="Search"
          onClick={() => {
            playSystemSound("select")
            window.dispatchEvent(new Event("spotlight:open"))
          }}
          glyph={<Search size={26} className="text-white" />}
        />
        <DockButton
          label="Recruiter"
          onClick={() => commandBus.dispatch("recruiter.exit")}
          glyph={<Briefcase size={24} className="text-white" />}
        />
      </div>
    </div>
  )
}

function tileStyle(): React.CSSProperties {
  return {
    width: 50,
    height: 50,
    borderRadius: 12,
    background: "linear-gradient(to bottom, rgba(255,255,255,0.35), rgba(255,255,255,0.05))",
    border: "1px solid rgba(255,255,255,0.4)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
  }
}

function DockSlot({ icon, label }: { icon: AppIcon; label: string }) {
  return (
    <button
      onClick={() => { playSystemSound("open"); icon.launch() }}
      aria-label={label}
      className="flex items-center justify-center"
      style={tileStyle()}
    >
      <span style={{ width: 36, height: 36 }} className="flex items-center justify-center">
        <AppIconRenderer icon={icon} size="dock" />
      </span>
    </button>
  )
}

function DockButton({ label, onClick, glyph }: { label: string; onClick: () => void; glyph: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} className="flex items-center justify-center" style={tileStyle()}>
      {glyph}
    </button>
  )
}
