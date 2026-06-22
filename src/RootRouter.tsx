import { lazy, Suspense, useEffect, useState } from "react"
import { Briefcase } from "lucide-react"
import RecruiterMode from "./recruiter/RecruiterMode"
import ErrorBoundary from "./components/ErrorBoundary"
import BootLoader from "./components/BootLoader"
import LaunchVeil from "./components/LaunchVeil"
import { commandBus } from "./lib/commandBus"

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
  // True only for a fresh in-session launch (a tap on "Launch JeffOS"), so the
  // transitional veil plays on entry but NOT on a hard refresh that restored
  // `launched` from localStorage.
  const [justLaunched, setJustLaunched] = useState(false)

  const launch = () => {
    try {
      localStorage.setItem(LAUNCH_KEY, "true")
    } catch {
      /* ignore storage failures */
    }
    setJustLaunched(true)
    // Best-effort: kick off the JeffOS wallpaper load while the boot screen
    // plays. Never awaited, so a slow/hung fetch can't block the launch.
    //
    // This uses a dynamic import purely to DEFER `store/prefs` evaluation to
    // click time — it is NOT a code-split (store/prefs is statically imported
    // across the app, so Vite keeps it in the main chunk; the build warns about
    // exactly this, which is expected/intentional). Deferring avoids a TDZ
    // "createPrefsSlice before initialization" crash from the store<->prefs
    // import cycle if it were imported at this early-evaluated module's top.
    void import("./store/prefs")
      .then((m) => m.loadGlobalDefaultWallpaper())
      .catch(() => {
        /* best-effort */
      })
    setLaunched(true)
  }

  const exitToRecruiter = () => {
    try {
      localStorage.removeItem(LAUNCH_KEY)
    } catch {
      /* ignore */
    }
    setLaunched(false)
  }

  // JeffOS is a fixed-viewport desktop that must clip body scroll; Recruiter
  // Mode is a normal scrolling document. Toggle the lock class accordingly.
  useEffect(() => {
    document.documentElement.classList.toggle("jeffos-active", launched)
    return () => document.documentElement.classList.remove("jeffos-active")
  }, [launched])

  // Exit to Recruiter Mode is triggered from the JeffOS Apple menu (authentic
  // location) via the command bus — no floating modern pill on the desktop.
  useEffect(() => {
    const handler = () => exitToRecruiter()
    commandBus.on("recruiter.exit", handler)
    return () => commandBus.off("recruiter.exit", handler)
  }, [])

  if (!launched) {
    return <RecruiterMode onLaunchJeffOS={launch} />
  }

  return (
    <ErrorBoundary label="JeffOS" fallback={(reset) => (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">JeffOS hit a snag.</p>
        <div className="flex gap-2">
          <button onClick={reset} className="rounded-md bg-foreground px-4 py-2 text-sm text-background">Try again</button>
          <button onClick={exitToRecruiter} className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm"><Briefcase size={14} aria-hidden /> Recruiter Mode</button>
        </div>
      </div>
    )}>
      {/* Tiger boot screen plays here — on the JeffOS opt-in only, NOT on the
          Recruiter Mode front door (which must paint instantly). */}
      <BootLoader>
        <div className="relative h-screen w-screen overflow-hidden">
          {/* No "Loading JeffOS…" text — the LaunchVeil already covers the
              entry beat, and the chunk loads fast; a bare transparent fallback
              avoids a flash of loading copy. */}
          <Suspense fallback={<div className="h-screen w-screen" />}>
            <JeffOS />
          </Suspense>
          {/* Smooth the Recruiter→JeffOS aesthetic cut on a fresh launch (the
              first-visit Tiger boot screen sits above this when it plays). */}
          {justLaunched && <LaunchVeil />}
          {/* Exit lives in the Apple menu ( → Exit to Recruiter Mode); no
              floating desktop pill (authenticity — see TIGER_AUTHENTICITY_REVIEW). */}
        </div>
      </BootLoader>
    </ErrorBoundary>
  )
}
