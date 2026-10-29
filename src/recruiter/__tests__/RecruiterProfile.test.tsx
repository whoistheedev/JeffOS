import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RecruiterProfile } from "../profile/RecruiterProfile"
import { CAPABILITIES, CONTACT, FEATURED_WORK, PRIMARY_CTA, workBySlug } from "../content"

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

    const ctas = screen.getAllByRole("link", { name: /Let’s Work Together/ })
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

  it("shows the flagship case file by default and switches with the keyboard", async () => {
    const user = userEvent.setup()
    renderPage()
    const list = screen.getByRole("tablist", { name: "Projects" })
    const tabs = within(list).getAllByRole("tab")
    expect(tabs).toHaveLength(FEATURED_WORK.length)
    expect(tabs[0]).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("heading", { level: 3, name: FEATURED_WORK[0].name })).toBeInTheDocument()

    tabs[0].focus()
    await user.keyboard("{ArrowDown}")
    expect(tabs[1]).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("heading", { level: 3, name: FEATURED_WORK[1].name })).toBeInTheDocument()
  })

  it("links each case file to its prerendered case study", () => {
    renderPage()
    const panel = screen.getByRole("tabpanel")
    expect(within(panel).getByRole("link", { name: /Read the case study/ })).toHaveAttribute("href", `/projects/${FEATURED_WORK[0].slug}/`)
  })

  it("capability evidence selects the backing project", async () => {
    const user = userEvent.setup()
    renderPage()
    const security = CAPABILITIES.find((c) => c.title === "Security Engineering")!
    const work = workBySlug(security.evidence)!
    await user.click(screen.getByRole("button", { name: new RegExp(`Evidence:\\s*${work.name}`) }))
    expect(screen.getByRole("tab", { name: new RegExp(work.name) })).toHaveAttribute("aria-selected", "true")
  })

  it("opens Quick Look, closes on Escape without leaking it, and restores focus", async () => {
    const user = userEvent.setup()
    renderPage()
    const outerEscape = vi.fn()
    window.addEventListener("keydown", outerEscape)

    const trigger = screen.getByRole("button", { name: /Open Quick Look/ })
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
    expect(screen.getByRole("link", { name: /Read the case study/ })).toHaveAttribute("target", "_blank")
  })
})
