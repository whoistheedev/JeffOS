import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RecruiterProfile } from "../profile/RecruiterProfile"
import { CONTACT, EXPERIENCE, FEATURED_WORK, PRIMARY_CTA, SKILLS, workBySlug } from "../content"

function renderPage(onLaunchJeffOS = vi.fn()) {
  render(<RecruiterProfile variant="page" onLaunchJeffOS={onLaunchJeffOS} isDark={false} toggleTheme={vi.fn()} />)
  return { onLaunchJeffOS }
}

describe("Recruiter front door", () => {
  it("answers who / what / contact in the hero", () => {
    renderPage()
    const h1 = screen.getByRole("heading", { level: 1 })
    expect(h1).toHaveTextContent("Jeffrey James Idodo")
    expect(h1).toHaveTextContent("healthcare revenue cycles")

    const ctas = screen.getAllByRole("link", { name: PRIMARY_CTA.label })
    expect(ctas.length).toBeGreaterThan(0)
    for (const a of ctas) expect(a).toHaveAttribute("href", PRIMARY_CTA.href)
  })

  it("never labels the email action as scheduling", () => {
    renderPage()
    expect(screen.queryByText(/schedule/i)).not.toBeInTheDocument()
  })

  it("launches JeffOS from the front door", async () => {
    const user = userEvent.setup()
    const { onLaunchJeffOS } = renderPage()
    await user.click(screen.getAllByRole("button", { name: /Launch JeffOS/ })[0])
    expect(onLaunchJeffOS).toHaveBeenCalledTimes(1)
  })

  it("puts career facts and the résumé route in the hero", () => {
    renderPage()
    const info = screen.getByRole("complementary", { name: "Career at a glance" })
    for (const e of EXPERIENCE) expect(within(info).getByText(e.period)).toBeInTheDocument()
    expect(within(info).getByRole("link", { name: /Request résumé/ })).toHaveAttribute("href", expect.stringMatching(/^mailto:/))
  })

  it("shows every case on the page, outcome included, with no tabs", () => {
    renderPage()
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument()
    for (const w of FEATURED_WORK) {
      expect(screen.getByRole("heading", { level: 3, name: w.name })).toBeInTheDocument()
      expect(screen.getByText(w.outcome)).toBeInTheDocument()
    }
  })

  it("links each case to its prerendered case study", () => {
    renderPage()
    const links = screen.getAllByRole("link", { name: /Read the case study/ })
    expect(links).toHaveLength(FEATURED_WORK.length)
    links.forEach((a, i) => expect(a).toHaveAttribute("href", `/projects/${FEATURED_WORK[i].slug}/`))
  })

  it("skill evidence jumps to the backing case", async () => {
    const user = userEvent.setup()
    renderPage()
    const security = SKILLS.find((k) => k.title === "Security")!
    const work = workBySlug(security.evidence)!
    await user.click(screen.getByRole("button", { name: new RegExp(`Evidence:\\s*${work.name}`) }))
    await waitFor(() => expect(screen.getByRole("heading", { level: 3, name: work.name })).toHaveFocus())
  })

  it("opens Quick Look, closes on Escape without leaking it, and restores focus", async () => {
    const user = userEvent.setup()
    renderPage()
    const outerEscape = vi.fn()
    window.addEventListener("keydown", outerEscape)

    const trigger = screen.getAllByRole("button", { name: /Quick Look/ })[0]
    await user.click(trigger)
    const dialog = screen.getByRole("dialog", { name: "Quick Look — The Essentials" })
    expect(within(dialog).getByText(CONTACT.email)).toBeInTheDocument()
    expect(within(dialog).getByRole("link", { name: /Request résumé/ })).toHaveAttribute("href", expect.stringMatching(/^mailto:/))

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    // Radix restores focus on the next tick after unmount.
    await waitFor(() => expect(trigger).toHaveFocus())
    // A JeffOS window would close on this key — it must not see it.
    expect(outerEscape).not.toHaveBeenCalledWith(expect.objectContaining({ key: "Escape" }))
    window.removeEventListener("keydown", outerEscape)
  })

  it("announces the copy-email result", async () => {
    const user = userEvent.setup()
    renderPage()
    const contact = screen.getByRole("region", { name: /engineering challenge/ })
    await user.click(within(contact).getByRole("button", { name: /Copy Address/ }))
    expect(await within(contact).findByText(/Email address copied/)).toBeInTheDocument()
    await expect(navigator.clipboard.readText()).resolves.toBe(CONTACT.email)
  })
})

describe("Hire Me window", () => {
  it("omits front-door chrome and keeps the visitor inside JeffOS", () => {
    render(<RecruiterProfile variant="window" />)
    expect(screen.queryByRole("button", { name: /Launch JeffOS/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("main")).not.toBeInTheDocument()
    for (const a of screen.getAllByRole("link", { name: /Read the case study/ })) expect(a).toHaveAttribute("target", "_blank")
  })
})
