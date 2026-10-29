import ErrorBoundary from "../components/ErrorBoundary"
import { useRecruiterTheme } from "./useRecruiterTheme"
import { RecruiterProfile } from "./profile/RecruiterProfile"

/**
 * Recruiter Mode — the default front door (JeffOS is the opt-in).
 *
 * Renders the shared recruiter experience (src/recruiter/profile) as a full
 * page. The same component tree powers the JeffOS "Hire Me" window, so the
 * two can never drift. Layout is container-query driven, so one tree covers
 * desktop, tablet and phone without per-form-factor forks.
 */
export default function RecruiterMode({ onLaunchJeffOS }: { onLaunchJeffOS: () => void }) {
  // User-controllable dark mode (defaults to OS preference). Scoped to Recruiter
  // Mode so it never fights JeffOS theming.
  const { isDark, toggle } = useRecruiterTheme()

  return (
    <ErrorBoundary label="Recruiter Mode">
      <RecruiterProfile variant="page" onLaunchJeffOS={onLaunchJeffOS} isDark={isDark} toggleTheme={toggle} />
    </ErrorBoundary>
  )
}
