import DesktopShell from "../DesktopShell"

/**
 * 📲 TabletShell — FOUNDATION SCAFFOLD (not the full tablet redesign).
 *
 * Phase 3 delivers only the shell architecture. The full tablet UX from
 * MOBILE_STRATEGY.md §7 (sidebar rail as primary nav, single focused surface,
 * snap-to-half split for browse+preview apps) lands in Phase 4.
 *
 * Until then, the tablet form factor intentionally renders the full DesktopShell.
 * On a large touch screen (768–1023px) the windowing experience remains usable,
 * so delegating here preserves 100% of functionality and zero regressions while
 * the dedicated rail/split layout is built out. This delegation is the single
 * line to replace when the real TabletShell ships.
 */
export default function TabletShell() {
  return <DesktopShell />
}
