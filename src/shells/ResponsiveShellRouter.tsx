import { useFormFactor } from "../hooks/useFormFactor"
import DesktopShell from "./DesktopShell"
import TabletShell from "./TabletShell"
import MobileShell from "./MobileShell"

/**
 * 🧭 ResponsiveShellRouter — selects the presentation shell by form factor.
 *
 * @see SYSTEM_ARCHITECTURE.md §2.2 · MOBILE_STRATEGY.md §1
 *
 * Backwards compatibility: `useFormFactor()` defaults to "desktop" during SSR /
 * first paint and whenever detection is ambiguous, so the desktop experience is
 * the safe default. All three shells consume the same AppRegistry + Zustand
 * store; switching shells changes presentation only, never app state.
 *
 * Phase 3 ships DesktopShell (current experience, verbatim) plus Tablet/Mobile
 * scaffolds. The full mobile/tablet redesigns land in Phase 4.
 */
export default function ResponsiveShellRouter() {
  const formFactor = useFormFactor()

  switch (formFactor) {
    case "mobile":
      return <MobileShell />
    case "tablet":
      return <TabletShell />
    case "desktop":
    default:
      return <DesktopShell />
  }
}
