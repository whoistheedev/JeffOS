import type { AppMenus } from "../../types"
import { finderMenus } from "./finderMenus"
import { terminalMenus } from "./terminalMenus"

export const appsMenus: Record<string, AppMenus> = {
  finder: finderMenus,
  terminal: terminalMenus,

  wallpapers: {
    File: [{ label: "New Wallpaper", shortcut: "⌘N" }],
    Edit: [{ label: "Delete", shortcut: "⌘⌫" }],
    View: [{ label: "Grid View" }, { label: "List View" }],
    Help: [{ label: "Wallpaper Help" }],
  },

  resume: {
    File: [{ label: "Export as PDF", shortcut: "⌘E" }],
    Edit: [{ label: "Copy Text", shortcut: "⌘C" }],
    Help: [{ label: "Resume Help" }],
  },

  games: {
    File: [{ label: "New Game", shortcut: "⌘N" }],
    Edit: [{ label: "Pause", shortcut: "␣" }],
    View: [{ label: "High Scores" }],
    Help: [{ label: "Games Help" }],
  },

  guestbook: {
    File: [{ label: "New Entry", shortcut: "⌘N" }],
    Edit: [{ label: "Copy Entry", shortcut: "⌘C" }],
    View: [{ label: "All Entries" }],
    Help: [{ label: "Guestbook Help" }],
  },

  piano: {
    File: [{ label: "New Session", shortcut: "⌘N" }],
    Edit: [{ label: "Undo Note", shortcut: "⌘Z" }],
    Controls: [
      { label: "Play", shortcut: "␣" },
      { label: "Stop" },
    ],
    Help: [{ label: "Piano Help" }],
  },

  explorer: {
    File: [
      { label: "New Window", shortcut: "⌘N" },
      { label: "New Tab", shortcut: "⌘T" },
      { type: "separator" },
      { label: "Close Window", shortcut: "⌘W" },
    ],
    Edit: [
      { label: "Cut", shortcut: "⌘X" },
      { label: "Copy", shortcut: "⌘C" },
      { label: "Paste", shortcut: "⌘V" },
    ],
    View: [{ label: "Show Bookmarks" }, { label: "Hide Toolbar" }],
    Help: [{ label: "Explorer Help" }],
  },

  recruiter: {
    File: [{ label: "New Candidate", shortcut: "⌘N" }],
    Edit: [{ label: "Copy Candidate", shortcut: "⌘C" }],
    View: [{ label: "All Candidates" }],
    Help: [{ label: "Recruiter Help" }],
  },

  controlpanel: {
    File: [{ label: "New Preference", shortcut: "⌘N" }],
    Edit: [{ label: "Reset to Defaults" }],
    View: [{ label: "Icons" }, { label: "List" }],
    Help: [{ label: "Control Panel Help" }],
  },

  ipod: {
    Controls: [
      { label: "Play/Pause", shortcut: "␣" },
      { label: "Next Track", shortcut: "⌘→" },
      { label: "Previous Track", shortcut: "⌘←" },
    ],
    View: [{ label: "Now Playing" }, { label: "Library" }],
    Help: [{ label: "iPod Help" }],
  },

  calendar: {
    File: [{ label: "New Event", shortcut: "⌘N" }],
    Edit: [{ label: "Delete Event", shortcut: "⌘⌫" }],
    View: [{ label: "Day" }, { label: "Week" }, { label: "Month" }],
    Help: [{ label: "Calendar Help" }],
  },

  bmcoffee: {
    File: [{ label: "New Donation", shortcut: "⌘N" }],
    Edit: [{ label: "Copy Link", shortcut: "⌘C" }],
    View: [{ label: "Recent Supporters" }],
    Help: [{ label: "Buy Me a Coffee Help" }],
  },

  "about-this-mac": {
    File: [{ label: "Close Window", shortcut: "⌘W" }],
    Help: [{ label: "About This Mac Help" }],
  },
}
