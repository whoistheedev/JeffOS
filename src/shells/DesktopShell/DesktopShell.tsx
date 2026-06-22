import StatusBar from "../../components/StatusBar"
import Desktop from "../../components/Desktop"
import Dock from "../../components/Dock"
import WindowManager from "../../components/WindowManager"
import Spotlight from "../../components/Spotlight"
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
      <Spotlight />

      {/* Visitor counter + socials widgets were removed from the JeffOS desktop
          for Tiger authenticity (modern web chrome on the OS surface). They
          live in Recruiter Mode. See TIGER_AUTHENTICITY_REVIEW §7/§9. */}

      <KeyboardHelp />
    </div>
  )
}
