import { ChevronRight, Github, Linkedin, Mail, FileText } from "lucide-react"
import { LaunchJeffOSButton } from "../components/LaunchJeffOSButton"
import {
  CAPABILITIES,
  CONTACT,
  EDUCATION,
  EXPERIENCE,
  PRIMARY_CTA,
  RESUME_REQUEST_HREF,
  SYSTEM_INFO,
  workBySlug,
} from "../content"
import { buttonClass, CopyEmailButton, LiveDot, MacPanel, Monogram } from "./primitives"

/* ------------------------------ What I Can Own ---------------------------- */
/**
 * Numbered Swiss list, not five identical cards. Each capability links to the
 * case study that backs it — the evidence button selects that project in the
 * explorer above.
 */
export function Capabilities({ onEvidence }: { onEvidence: (slug: string) => void }) {
  return (
    <ol className="border-b border-border">
      {CAPABILITIES.map((c, i) => {
        const work = workBySlug(c.evidence)
        return (
          <li
            key={c.title}
            className="group grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 gap-y-2 border-t border-border py-6 @3xl:grid-cols-[5rem_minmax(0,15rem)_minmax(0,1fr)_auto] @3xl:items-baseline @3xl:gap-x-6"
          >
            <span
              aria-hidden
              className="rx-mono row-span-3 text-[28px] font-medium leading-none text-foreground/20 transition-colors duration-200 group-hover:text-[var(--color-hire)] @3xl:row-span-1 @3xl:text-[40px]"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="text-[17px] font-semibold leading-6 tracking-[-0.01em]">{c.title}</h3>
            <p className="text-[15px] leading-6 text-muted-foreground">{c.detail}</p>
            {work && (
              <button
                type="button"
                onClick={() => onEvidence(work.slug)}
                className="inline-flex min-h-11 items-center gap-1 justify-self-start rounded-md text-[13px] font-medium text-[var(--color-hire)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-hire)] @3xl:justify-self-end"
              >
                <span className="text-muted-foreground">Evidence:</span> {work.name}
                <ChevronRight size={14} aria-hidden />
              </button>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/* ---------------------------- System Information -------------------------- */
/**
 * Tiger System Profiler for the engineer. Plain-English summary per category
 * (for recruiters); the technical specs sit behind a native <details>
 * disclosure (for engineering managers) — progressive disclosure with zero JS.
 */
export function SystemInformation({ name }: { name: string }) {
  return (
    <MacPanel title={`System Profiler — ${name}`} bodyClassName="text-[14px]">
      <p className="rx-mono border-b border-border bg-muted/50 px-5 py-2.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        Engineer Overview
      </p>
      {SYSTEM_INFO.map((row, i) => (
        <details key={row.category} open={i === 0} className="group border-b border-border last:border-b-0">
          <summary className="grid min-h-11 cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-hire)] @2xl:grid-cols-[11rem_minmax(0,1fr)_auto] [&::-webkit-details-marker]:hidden">
            <span className="text-[13px] font-semibold">{row.category}</span>
            <span className="col-start-1 row-start-2 text-[15px] leading-6 text-foreground/85 @2xl:col-start-2 @2xl:row-start-1">
              {row.summary}
            </span>
            <span className="rx-mono col-start-2 row-start-1 inline-flex items-center gap-1 pt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground @2xl:col-start-3">
              Specs
              <ChevronRight size={13} aria-hidden className="transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none" />
            </span>
          </summary>
          <dl className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] gap-x-4 gap-y-2 px-5 pb-5 @2xl:ml-[11rem] @2xl:pl-9">
            {row.specs.map((s) => (
              <div key={s.label} className="contents">
                <dt className="text-[12px] font-medium leading-5 text-muted-foreground">{s.label}</dt>
                <dd className="rx-mono text-[12.5px] leading-5">{s.value}</dd>
              </div>
            ))}
          </dl>
        </details>
      ))}
    </MacPanel>
  )
}

/* -------------------------------- Career Log ------------------------------ */
export function CareerLog() {
  return (
    <div>
      <ol className="border-b border-border">
        {EXPERIENCE.map((e) => (
          <li key={e.period} className="grid gap-x-6 gap-y-2 border-t border-border py-6 @2xl:grid-cols-[11rem_minmax(0,1fr)]">
            <p className="rx-mono flex h-6 items-center gap-2 self-start text-[12px] text-muted-foreground">
              {e.current && <LiveDot />}
              {e.period}
            </p>
            <div>
              <h3 className="text-[17px] font-semibold leading-6 tracking-[-0.01em]">
                {e.role}
                <span className="font-normal text-muted-foreground"> · {e.org}</span>
              </h3>
              <ul className="mt-2 space-y-1.5 text-[14px] leading-[1.55] text-foreground/80">
                {e.bullets.map((b) => (
                  <li key={b} className="relative pl-4 before:absolute before:left-0 before:top-[0.7em] before:h-px before:w-2 before:bg-foreground/30">
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-8 grid gap-x-6 @2xl:grid-cols-[11rem_minmax(0,1fr)]">
        <h3 className="rx-mono text-[11px] uppercase leading-6 tracking-[0.12em] text-muted-foreground">Education</h3>
        <ul className="space-y-1.5 text-[14px] leading-6">
          {EDUCATION.map((ed) => (
            <li key={ed.credential} className="flex flex-wrap justify-between gap-x-4">
              <span>
                <span className="font-medium">{ed.credential}</span> — {ed.org}
              </span>
              <span className="rx-mono text-[12px] text-muted-foreground">{ed.period}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ------------------------------ JeffOS callout ---------------------------- */
/** Front door only — inside JeffOS the visitor is already in the OS. */
export function JeffOSCallout({ onLaunchJeffOS }: { onLaunchJeffOS: () => void }) {
  return (
    <div className="grid gap-6 rounded-[14px] border border-border p-6 @3xl:grid-cols-[minmax(0,1fr)_20rem] @3xl:items-center @3xl:p-8">
      <div>
        <p className="rx-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">The Developer Behind the OS</p>
        <p className="mt-3 max-w-[48ch] text-[20px] font-medium leading-snug tracking-[-0.015em]">
          You’re reading Recruiter Mode. The rest of this site is a Mac OS X Tiger recreation I engineered from scratch.
        </p>
        <p className="mt-2 max-w-[60ch] text-[14px] leading-6 text-muted-foreground">
          Windowing, Dock, Spotlight, Exposé, realtime and a security-audited Supabase backend — the same rigor I bring to healthcare systems.
        </p>
      </div>
      <LaunchJeffOSButton onClick={onLaunchJeffOS} variant="full" />
    </div>
  )
}

/* ---------------------------- Establish Connection ------------------------ */
/**
 * The closing beat (Peak-End): a Tiger "Connect to Server" dialog re-cast as
 * the contact panel. Only real, configured contact details.
 */
export function ConnectionPanel({ name, initials, headingId }: { name: string; initials: string; headingId: string }) {
  const link =
    "inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-[14px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-hire)]"
  return (
    <MacPanel as="section" labelledBy={headingId} title={`Connect to ${name}`} bodyClassName="p-6 @3xl:p-10">
      <div className="grid gap-8 @3xl:grid-cols-[auto_minmax(0,1fr)]">
        <Monogram initials={initials} size={72} />
        <div>
          <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <LiveDot /> Connection ready
          </p>
          <h2
            id={headingId}
            className="mt-3 max-w-[22ch] scroll-mt-24 text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] text-balance focus:outline-none @3xl:text-[40px]"
          >
            Have an interesting engineering challenge? Let’s talk.
          </h2>
          <p className="mt-3 max-w-[56ch] text-[15px] leading-6 text-muted-foreground">
            Email is the fastest route. Résumé available on request.
          </p>
          <p className="rx-mono mt-5 select-all text-[14px]">{CONTACT.email}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href={PRIMARY_CTA.href} className={buttonClass("primary")}>
              <Mail size={17} aria-hidden /> Send an Email
            </a>
            <CopyEmailButton />
          </div>

          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1" aria-label="Profiles and résumé">
            <li>
              <a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer" className={link}>
                <Linkedin size={16} aria-hidden /> LinkedIn<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
            <li>
              <a href={CONTACT.github} target="_blank" rel="noopener noreferrer" className={link}>
                <Github size={16} aria-hidden /> GitHub<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
            <li>
              <a href={RESUME_REQUEST_HREF} className={link}>
                <FileText size={16} aria-hidden /> Request résumé
              </a>
            </li>
          </ul>
        </div>
      </div>
    </MacPanel>
  )
}
