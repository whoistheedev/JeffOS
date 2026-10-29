import { RecruiterProfile } from "../../recruiter/profile/RecruiterProfile"

/**
 * Hire Me — the recruiter experience as a JeffOS window app. Same component
 * tree as the Recruiter Mode front door; it scrolls inside the window and its
 * layout follows the window's width (container queries), not the screen's.
 */
export default function RecruiterApp() {
  return (
    <div className="h-full w-full overflow-y-auto overscroll-contain bg-background">
      <RecruiterProfile variant="window" />
    </div>
  )
}
