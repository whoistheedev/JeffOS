import StatusBar from "../../components/StatusBar"
import Desktop from "../../components/Desktop"
import Dock from "../../components/Dock"
import WindowManager from "../../components/WindowManager"
import SocialsWidget from "../../components/SocialsWidget"
import { VisitorsWidget } from "../../components/VisitorsWidget"
import { KeyboardHelp } from "../../components/KeyboardHelp"

/**
 * 🖥 DesktopShell — the full vintage Mac OS X desktop experience.
 *
 * This is the current desktop layout extracted verbatim from App.tsx so the
 * existing experience is byte-for-byte preserved. The ResponsiveShellRouter
 * renders this for desktop form factors and defaults to it when detection is
 * ambiguous. App-level effects (theme/holiday/wallpaper) remain in App.tsx.
 */
export default function DesktopShell() {
  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-transparent">
      <StatusBar />
      <Desktop />
      <WindowManager />
      <Dock />

      {/* 🌍 Widgets visible on tablets and desktops only */}
      <div
        className="
          hidden sm:flex
          absolute bottom-4 left-0 w-full
          justify-between items-center
          px-6
          pointer-events-none
        "
      >
        <div className="pointer-events-auto">
          <VisitorsWidget />
        </div>
        <div className="pointer-events-auto">
          <SocialsWidget />
        </div>
      </div>

      <KeyboardHelp />
    </div>
  )
}
