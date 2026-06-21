import { useCallback, useEffect, useState } from "react"

/**
 * Recruiter Mode color theme — user-controllable, persisted.
 *
 * Modes: "system" (follow OS), "light", "dark". The resolved theme toggles the
 * `.dark` class on <html> (the OKLCH dark token set in index.css). Scoped to
 * while Recruiter Mode is mounted so it never fights JeffOS theming — the
 * cleanup removes `.dark` on unmount.
 */
export type ThemeMode = "system" | "light" | "dark"
const KEY = "recruiter:theme"

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function useRecruiterTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof localStorage === "undefined") return "system"
    return (localStorage.getItem(KEY) as ThemeMode) || "system"
  })

  // Resolve mode -> apply .dark; re-resolve on OS change when in "system".
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const apply = () => {
      const dark = mode === "dark" || (mode === "system" && mq.matches)
      document.documentElement.classList.toggle("dark", dark)
    }
    apply()
    mq.addEventListener("change", apply)
    return () => {
      mq.removeEventListener("change", apply)
      document.documentElement.classList.remove("dark")
    }
  }, [mode])

  const isDark = mode === "dark" || (mode === "system" && typeof window !== "undefined" && systemPrefersDark())

  /** Toggle flips to the opposite of what's currently shown, as an explicit
   *  light/dark choice (leaves "system" once the user expresses a preference). */
  const toggle = useCallback(() => {
    setMode((prev) => {
      const next: ThemeMode =
        (prev === "dark" || (prev === "system" && systemPrefersDark())) ? "light" : "dark"
      try {
        localStorage.setItem(KEY, next)
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  return { isDark, toggle, mode }
}
