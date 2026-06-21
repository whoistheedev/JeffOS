import { lazy, Suspense, useState } from "react"
import RecruiterMode from "./recruiter/RecruiterMode"
import ErrorBoundary from "./components/ErrorBoundary"

/**
 * RootRouter (Phase 6) — Recruiter Mode is the DEFAULT first paint; JeffOS (the
 * desktop OS) is a deliberate opt-in via "Launch JeffOS". The choice is
 * remembered for the session so a returning engineer who chose the OS isn't
 * re-walled, while new visitors always land on the conversion-first front door.
 *
 * JeffOS is a separate lazy chunk so its windowing engine / heavy apps never
 * load on the Recruiter Mode first paint (protects the perf budget).
 */
const JeffOS = lazy(() => import("./shells/ResponsiveShellRouter"))

const LAUNCH_KEY = "jeffos:launched"

export default function RootRouter() {
  const [launched, setLaunched] = useState<boolean>(
    () => typeof localStorage !== "undefined" && localStorage.getItem(LAUNCH_KEY) === "true"
  )

  const launch = () => {
    try {
      localStorage.setItem(LAUNCH_KEY, "true")
    } catch {
      /* ignore storage failures */
    }
    setLaunched(true)
  }

  const exitToResume = () => {
    try {
      localStorage.removeItem(LAUNCH_KEY)
    } catch {
      /* ignore */
    }
    setLaunched(false)
  }

  if (!launched) {
    return <RecruiterMode onLaunchJeffOS={launch} />
  }

  return (
    <ErrorBoundary label="JeffOS" fallback={(reset) => (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">JeffOS hit a snag.</p>
        <div className="flex gap-2">
          <button onClick={reset} className="rounded-md bg-foreground px-4 py-2 text-sm text-background">Try again</button>
          <button onClick={exitToResume} className="rounded-md border border-border px-4 py-2 text-sm">← Exit to Résumé</button>
        </div>
      </div>
    )}>
      <div className="relative h-screen w-screen overflow-hidden">
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Loading JeffOS…</div>}>
          <JeffOS />
        </Suspense>
        {/* Highest layer (above menus/popovers/toasts) and placed at top-LEFT,
            clear of the JeffOS status bar (top-right) and dock (bottom-center). */}
        <button
          onClick={exitToResume}
          className="fixed left-2 top-7 z-[5000] rounded-full bg-black/75 px-3 py-1 text-xs text-white shadow-lg hover:bg-black/90"
        >
          ← Exit to Résumé
        </button>
      </div>
    </ErrorBoundary>
  )
}
