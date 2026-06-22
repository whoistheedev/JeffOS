/**
 * aquaSkin — shared Mac OS X Tiger "Aqua" chrome, so every app wears the same
 * wet-Aqua / brushed-metal look the rest of JeffOS does (Finder, iTunes, the
 * menu bar). Use these instead of hand-rolling gradients per app, so new
 * surfaces are Tiger-correct by default.
 *
 * See TIGER_AUTHENTICITY_RESCORE.md (94/100) for the reference treatment and
 * UX_AUDIT_JEFFOS_APPS.md for the apps these were introduced to harmonize.
 */
import type { CSSProperties } from "react"

/** Brushed-metal panel: vertical light→dark gradient under a fine pinstripe. */
export const brushedMetal: CSSProperties = {
  backgroundImage: `
    repeating-linear-gradient(
      0deg,
      rgba(255,255,255,0) 0px,
      rgba(255,255,255,0.35) 1px,
      rgba(0,0,0,0.03) 2px,
      rgba(0,0,0,0) 3px
    ),
    linear-gradient(to bottom, #e8e8e8, #c9c9c9)
  `,
}

/** Brushed-metal title/toolbar strip (with a hairline bottom border). */
export const brushedMetalBar: CSSProperties = {
  ...brushedMetal,
  borderBottom: "1px solid #8d8d8d",
  boxShadow: "inset 0 1px rgba(255,255,255,0.7)",
}

/** Glossy white Aqua control (e.g. a graphite/white capsule button). */
export const aquaControl: CSSProperties = {
  background: "linear-gradient(to bottom, #fdfdfd, #d2d2d2)",
  border: "1px solid #9a9a9a",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 1px rgba(0,0,0,0.15)",
}

/** The classic glossy blue "Aqua" primary button (default-action gel). */
export const aquaBlueButton: CSSProperties = {
  background: "linear-gradient(to bottom, #add2ff 0%, #5aa7f0 45%, #2b82d6 46%, #1f6fc4 100%)",
  border: "1px solid #2169b0",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.3)",
  color: "#fff",
  textShadow: "0 1px 1px rgba(0,0,0,0.35)",
}

/** Recessed inset well (e.g. the emulator/display area or a search field). */
export const aquaWell: CSSProperties = {
  background: "linear-gradient(to bottom, #cfcfcf, #e6e6e6)",
  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.25), inset 0 -1px 0 rgba(255,255,255,0.6)",
}

/** Lucida Grande — Tiger's system font. */
export const tigerFont = "'Lucida Grande','Lucida Sans Unicode','Helvetica Neue',Helvetica,Arial,sans-serif"
