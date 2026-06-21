import { useState } from "react"
import { Download, Share2, Printer } from "lucide-react"
import { IDENTITY } from "../content"

/**
 * Shell-agnostic résumé experience (Phase 6 / §7).
 * Inline PDF + Download + Share (Web Share API w/ copy fallback) + Print.
 * Falls back to a download link if the embed is blocked.
 */
export function ResumeViewer() {
  // Served from /public (PWA-precached) — see IDENTITY.resumeUrl.
  const url = IDENTITY.resumeUrl
  const [embedFailed, setEmbedFailed] = useState(false)

  const share = async () => {
    const absolute = new URL(url, window.location.origin).href
    try {
      if (navigator.share) {
        await navigator.share({ title: `${IDENTITY.name} — Résumé`, url: absolute })
      } else {
        await navigator.clipboard.writeText(absolute)
      }
    } catch {
      /* user cancelled share — no-op */
    }
  }

  return (
    <section aria-label="Résumé" className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <a
          href={url}
          download
          className="inline-flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm text-background"
          style={{ minHeight: "var(--touch-target-min)" }}
        >
          <Download size={16} aria-hidden /> Download
        </a>
        <button
          onClick={share}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
          style={{ minHeight: "var(--touch-target-min)" }}
        >
          <Share2 size={16} aria-hidden /> Share
        </button>
        <button
          onClick={() => window.open(url, "_blank")?.print()}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
          style={{ minHeight: "var(--touch-target-min)" }}
        >
          <Printer size={16} aria-hidden /> Print
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-muted">
        {!embedFailed ? (
          <object
            data={url}
            type="application/pdf"
            aria-label={`${IDENTITY.name} résumé (PDF)`}
            className="h-full w-full"
            onError={() => setEmbedFailed(true)}
          >
            {/* fallback if the browser can't embed PDFs */}
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
              <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
                Open the résumé PDF
              </a>
            </div>
          </object>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
            <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
              Open the résumé PDF
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

export default ResumeViewer
