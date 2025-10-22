import type { AppMenus } from "../../types"

export const finderMenus: AppMenus = {
  File: [
    { label: "New Finder Window", shortcut: "⌘N" },
    { label: "New Folder", shortcut: "⇧⌘N" },
    { type: "separator" },
    { label: "Close Window", shortcut: "⌘W" },
  ],
  Edit: [
    { label: "Undo", shortcut: "⌘Z", disabled: true },
    { label: "Redo", shortcut: "⇧⌘Z", disabled: true },
    { type: "separator" },
    { label: "Cut", shortcut: "⌘X" },
    { label: "Copy", shortcut: "⌘C" },
    { label: "Paste", shortcut: "⌘V" },
  ],
  View: [
    { label: "as Icons" },
    { label: "as List" },
    { label: "as Columns" },
  ],
  Go: [
    { label: "Home" },
    { label: "Applications" },
    { label: "Utilities" },
  ],
  Help: [{ label: "Mac Help" }],
}
