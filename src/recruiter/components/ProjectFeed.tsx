import { useEffect, useState } from "react"
import { ExternalLink } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { FEATURED_PROJECTS } from "../content"

type ProjectRow = {
  id: number
  slug: string | null
  name: string
  description: string | null
  thumbnail_url: string | null
  live_url: string | null
}

/**
 * Project showcase (§5). Reads live `projects` (active = true) and enriches
 * each with the case-study narrative from content.FEATURED_PROJECTS (matched
 * by slug) since the `projects` table doesn't carry problem/solution/outcome
 * yet (a later migration adds those columns).
 */
export function ProjectFeed() {
  const [rows, setRows] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("projects")
      .select("id, slug, name, description, thumbnail_url, live_url")
      .eq("active", true)
      .order("id", { ascending: true })
      .then(({ data }) => {
        setRows((data as ProjectRow[]) ?? [])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No projects to show yet.</p>
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rows.map((p) => {
        const study = p.slug ? FEATURED_PROJECTS.find((f) => f.slug === p.slug) : undefined
        return (
          <article key={p.id} className="flex flex-col overflow-hidden rounded-lg border border-border">
            {p.thumbnail_url && (
              <img
                src={p.thumbnail_url}
                alt=""
                loading="lazy"
                className="h-32 w-full object-cover"
              />
            )}
            <div className="flex flex-1 flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{p.name}</h3>
                {p.live_url && (
                  <a
                    href={p.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${p.name}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink size={16} aria-hidden />
                  </a>
                )}
              </div>
              {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}

              {/* Case-study detail (from content; CONFIRM accuracy) */}
              {study && (
                <dl className="mt-1 space-y-1 text-xs text-muted-foreground">
                  <div><dt className="inline font-medium text-foreground">Problem: </dt><dd className="inline">{study.problem}</dd></div>
                  <div><dt className="inline font-medium text-foreground">Solution: </dt><dd className="inline">{study.solution}</dd></div>
                  <div><dt className="inline font-medium text-foreground">Outcome: </dt><dd className="inline">{study.outcome}</dd></div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {study.tech.map((t) => (
                      <span key={t} className="rounded bg-muted px-1.5 py-0.5">{t}</span>
                    ))}
                  </div>
                </dl>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default ProjectFeed
