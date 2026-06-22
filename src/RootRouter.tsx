import { lazy, Suspense, useEffect, useState } from "react"
import { Briefcase } from "lucide-react"
import RecruiterMode from "./recruiter/RecruiterMode"
import ErrorBoundary from "./components/ErrorBoundary"
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

  const launch = () => {
    try {
      localStorage.setItem(LAUNCH_KEY, "true")
    } catch {
      /* ignore storage failures */
    }
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
      <div className="relative h-screen w-screen overflow-hidden">
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Loading JeffOS…</div>}>
          <JeffOS />
        </Suspense>
        {/* Exit lives in the Apple menu ( → Exit to Recruiter Mode); no
            floating desktop pill (authenticity — see TIGER_AUTHENTICITY_REVIEW). */}
      </div>
    </ErrorBoundary>
  )
}
