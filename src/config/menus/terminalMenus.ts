import type { AppMenus } from "../../types"

export const terminalMenus: AppMenus = {
  Shell: [
    { label: "New Tab", shortcut: "⌘T" },
    { label: "New Window", shortcut: "⌘N" },
    { type: "separator" },
    { label: "Close Tab", shortcut: "⌘W" },
  ],
  Edit: [
    { label: "Copy", shortcut: "⌘C" },
    { label: "Paste", shortcut: "⌘V" },
  ],
  View: [{ label: "Show Toolbar" }, { label: "Hide Toolbar" }],
  Help: [{ label: "Terminal Help" }],
}
