import { describe, expect, it } from "vitest"
import { CAPABILITIES, CONTACT, FEATURED_WORK, PRIMARY_CTA, RESUME_REQUEST_HREF, SYSTEM_INFO, workBySlug } from "../content"

describe("recruiter content", () => {
  it("backs every capability with a real case study", () => {
    for (const c of CAPABILITIES) expect(workBySlug(c.evidence), c.title).toBeDefined()
  })

  it("has exactly one flagship and unique slugs", () => {
    expect(FEATURED_WORK.filter((w) => w.flagship)).toHaveLength(1)
    expect(new Set(FEATURED_WORK.map((w) => w.slug)).size).toBe(FEATURED_WORK.length)
  })

  it("contact actions use the configured address only", () => {
    expect(PRIMARY_CTA.href.startsWith(`mailto:${CONTACT.email}`)).toBe(true)
    expect(RESUME_REQUEST_HREF.startsWith(`mailto:${CONTACT.email}`)).toBe(true)
  })

  it("gives every System Information row a plain-English summary and specs", () => {
    for (const row of SYSTEM_INFO) {
      expect(row.summary.length, row.category).toBeGreaterThan(20)
      expect(row.specs.length, row.category).toBeGreaterThan(0)
    }
  })
})
