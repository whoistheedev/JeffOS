import { describe, expect, it } from "vitest"
import { CONTACT, FEATURED_WORK, PRIMARY_CTA, PROOF, RESUME_REQUEST_HREF, SKILLS, workBySlug } from "../content"

describe("recruiter content", () => {
  it("backs every skill with a real case study, a plain-English summary and specs", () => {
    for (const k of SKILLS) {
      expect(workBySlug(k.evidence), k.title).toBeDefined()
      expect(k.summary.length, k.title).toBeGreaterThan(20)
      expect(k.specs.length, k.title).toBeGreaterThan(0)
    }
  })

  it("gives every case an outcome and a flow diagram", () => {
    for (const w of FEATURED_WORK) {
      expect(w.outcome.length, w.slug).toBeGreaterThan(20)
      expect(w.flow.length, w.slug).toBeGreaterThan(2)
    }
  })

  it("keeps the proof strip to three short facts", () => {
    expect(PROOF).toHaveLength(3)
    for (const f of PROOF) expect(f.value.length, f.label).toBeLessThanOrEqual(4)
  })

  it("has exactly one flagship and unique slugs", () => {
    expect(FEATURED_WORK.filter((w) => w.flagship)).toHaveLength(1)
    expect(new Set(FEATURED_WORK.map((w) => w.slug)).size).toBe(FEATURED_WORK.length)
  })

  it("contact actions use the configured address only", () => {
    expect(PRIMARY_CTA.href.startsWith(`mailto:${CONTACT.email}`)).toBe(true)
    expect(RESUME_REQUEST_HREF.startsWith(`mailto:${CONTACT.email}`)).toBe(true)
  })
})
