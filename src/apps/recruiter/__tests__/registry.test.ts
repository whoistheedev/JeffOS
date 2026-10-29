import { describe, expect, it } from "vitest"
import { AppRegistry } from "../../registry/registry"
import { useStore } from "../../../store"

describe("Hire Me app wiring", () => {
  it("is registered as a resizable window with a roomy default size", () => {
    const meta = AppRegistry.recruiter
    expect(meta?.title).toBe("Hire Me")
    expect(meta?.resizable).toBe(true)
    expect(meta?.defaultSize?.width).toBeGreaterThanOrEqual(900)
  })

  it("appears on the desktop and is pinned to the Dock", () => {
    const icon = useStore.getState().desktopIcons.find((i) => i.id === "recruiter")
    expect(icon?.title).toBe("Hire Me")
    expect(icon?.iconUrl).toBe("/icons/recruiter.png")
    expect(icon?.pinned).toBe(true)
  })
})
