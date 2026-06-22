import { useEffect, useMemo, useRef, useState } from "react"
import Fuse from "fuse.js"
import { useStore } from "../store"
import type { AppIcon } from "../store/apps"
import { AppIconRenderer } from "./AppIconRenderer"

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

  return (
    <>
      {/* click-away */}
      <div className="fixed inset-0 z-[6000]" onClick={() => setOpen(false)} />
      {/* Tiger blue results sheet, anchored top-right under the magnifier */}
      <div
        className="fixed right-2 top-7 z-[6001] w-[320px] overflow-hidden rounded-md"
        style={{
          background:
            "linear-gradient(to bottom, rgba(30,52,98,0.96), rgba(18,32,64,0.96))",
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
          color: "#fff",
        }}
        role="dialog"
        aria-label="Spotlight"
      >
        <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
          <span aria-hidden style={{ opacity: 0.85 }}>🔍</span>
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
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/55"
            aria-label="Spotlight search"
          />
        </div>
        <div className="max-h-[320px] overflow-y-auto py-1">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-white/60">No results</p>
          ) : (
            results.map((icon, i) => (
              <button
                key={icon.id}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => launch(icon)}
                className="flex w-full items-center gap-3 px-3 py-1.5 text-left text-sm"
                style={{ background: i === activeIdx ? "rgba(120,160,230,0.55)" : "transparent" }}
              >
                <span className="flex h-5 w-5 items-center justify-center">
                  <AppIconRenderer icon={icon} size="list" />
                </span>
                <span className="truncate">{icon.title}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}
