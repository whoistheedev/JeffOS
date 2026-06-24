import { useEffect, useMemo, useRef, useState } from "react"
import Fuse from "fuse.js"
import { useStore } from "../store"
import type { AppIcon } from "../store/apps"
import { AppIconRenderer } from "./AppIconRenderer"
import { tigerFont } from "../lib/aquaSkin"

/**
 * Spotlight (Tiger 10.4) — ⌘Space opens a blue results sheet anchored under the
 * top-right magnifier; fuzzy-search the app list and Enter to launch.
 *
 * Faithful-ish to Tiger's Spotlight: a translucent dark-blue gradient panel
 * dropping from the menu-bar magnifier, a single search field, and a grouped
 * results list with the top hit highlighted. Scoped to JeffOS (mounted in
 * DesktopShell). Toggle via ⌘Space, the menu-bar magnifier, or the
 * `spotlight.toggle` command.
 */
export default function Spotlight() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const icons = useStore((s) => s.desktopIcons)

  // ⌘Space toggle + Esc close. (Browsers don't reserve ⌘Space.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.code === "Space") {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === "Escape") {
        setOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    // Also openable from the menu-bar magnifier via a custom event.
    const openEvt = () => setOpen(true)
    window.addEventListener("spotlight:open", openEvt)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("spotlight:open", openEvt)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setQuery("")
      setActiveIdx(0)
      // focus after the panel paints
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const fuse = useMemo(
    () => new Fuse(icons, { keys: ["title"], threshold: 0.4 }),
    [icons]
  )

  const results: AppIcon[] = useMemo(() => {
    if (!query.trim()) return icons.slice(0, 8)
    return fuse.search(query).map((r) => r.item).slice(0, 8)
  }, [query, fuse, icons])

  const launch = (icon: AppIcon) => {
    icon.launch()
    setOpen(false)
  }

  if (!open) return null

  const topHit = results[0] ?? null
  const rest = results.slice(1)
  const HL = "rgba(95,140,225,0.85)" // Tiger blue selection

  return (
    <>
      {/* click-away */}
      <div className="fixed inset-0 z-[6000]" onClick={() => setOpen(false)} />
      {/* Tiger blue results sheet, anchored top-right under the magnifier */}
      <div
        className="fixed right-2 top-7 z-[6001] w-[340px] overflow-hidden rounded-lg"
        style={{
          background:
            "linear-gradient(to bottom, rgba(34,56,104,0.97), rgba(16,28,58,0.97))",
          border: "1px solid rgba(255,255,255,0.28)",
          boxShadow: "0 18px 44px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.3)",
          color: "#fff",
          fontFamily: tigerFont,
        }}
        role="dialog"
        aria-label="Spotlight"
      >
        {/* Search field — styled like Tiger's menu-bar Spotlight lozenge. */}
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.16)" }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden style={{ opacity: 0.9 }}>
            <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="#fff" strokeWidth="1.6" />
            <line x1="10" y1="10" x2="14" y2="14" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIdx(0)
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)) }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)) }
              else if (e.key === "Enter" && results[activeIdx]) launch(results[activeIdx])
            }}
            placeholder="Spotlight"
            className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-white/55"
            aria-label="Spotlight search"
          />
        </div>

        <div className="max-h-[340px] overflow-y-auto py-1">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-[12px] text-white/60">No results</p>
          ) : (
            <>
              {/* Top Hit — larger icon, its own section (Tiger). */}
              {topHit && (
                <>
                  <SectionHeader first>Top Hit</SectionHeader>
                  <button
                    onMouseEnter={() => setActiveIdx(0)}
                    onClick={() => launch(topHit)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left mx-1 rounded-md"
                    style={{
                      width: "calc(100% - 8px)",
                      background: activeIdx === 0 ? HL : "transparent",
                    }}
                  >
                    <span className="flex h-8 w-8 items-center justify-center shrink-0">
                      <AppIconRenderer icon={topHit} size="dock" />
                    </span>
                    <span className="truncate text-[14px] font-semibold">{topHit.title}</span>
                  </button>
                </>
              )}

              {/* Applications — the remaining matches. */}
              {rest.length > 0 && (
                <>
                  <SectionHeader>Applications</SectionHeader>
                  {rest.map((icon, i) => {
                    const idx = i + 1
                    return (
                      <button
                        key={icon.id}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => launch(icon)}
                        className="flex items-center gap-3 px-3 py-1.5 text-left text-[13px] mx-1 rounded-md"
                        style={{
                          width: "calc(100% - 8px)",
                          background: idx === activeIdx ? HL : "transparent",
                        }}
                      >
                        <span className="flex h-5 w-5 items-center justify-center shrink-0">
                          <AppIconRenderer icon={icon} size="list" />
                        </span>
                        <span className="truncate">{icon.title}</span>
                      </button>
                    )
                  })}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

/** Tiger Spotlight category header: small caps, faint, with a hairline rule. */
function SectionHeader({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return (
    <div
      className="px-3 pt-2 pb-[3px] text-[10px] font-bold uppercase tracking-wide text-white/55"
      style={first ? undefined : { borderTop: "1px solid rgba(255,255,255,0.08)" }}
    >
      {children}
    </div>
  )
}
