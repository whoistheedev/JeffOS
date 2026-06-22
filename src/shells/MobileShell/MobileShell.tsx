import DesktopShell from "../DesktopShell"

/**
 * 📱 MobileShell — delegates to the touch-tuned DesktopShell.
 *
 * A mobile visitor who taps "Launch JeffOS" has *already* seen the responsive
 * Recruiter Mode landing (identity, AI-RCM positioning, hire CTAs) — they're
 * opting into the OS itself. The previous scaffold showed a second, off-brand
 * landing page here ("Full-Stack Developer") and forced another tap to reach
 * the desktop: a confusing dead-end that also contradicted Recruiter Mode.
 *
 * So mobile now renders the real JeffOS desktop directly, like TabletShell.
 * Touch-tuning lives in the shared components (Window opens near-full-screen and
 * disables dragging on phones — see Window.tsx), so the Aqua chrome, wallpaper,
 * Lucida Grande, dock and system sounds all carry across to touch without a
 * separate mobile skin. This delegation is the single line to replace if/when a
 * dedicated mobile redesign (MOBILE_STRATEGY.md §8) is built.
 */
export default function MobileShell() {
  return <DesktopShell />
}
