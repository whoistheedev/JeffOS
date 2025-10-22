// src/components/KeyboardHelp.tsx
import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog"

export function KeyboardHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?") {
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent role="dialog" aria-label="Keyboard Shortcuts">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <ul role="list" className="space-y-1 text-sm">
          <li><kbd>⌘W</kbd> Close window</li>
          <li><kbd>⌘M</kbd> Minimize window</li>
          <li><kbd>⌘`</kbd> Cycle windows</li>
          <li><kbd>⌘1/2/3</kbd> Finder view modes</li>
          <li><kbd>⌘R</kbd> Resume (Recruiter Mode)</li>
          <li><kbd>L</kbd> Toggle leaderboard</li>
          <li><kbd>?</kbd> Show this help</li>
        </ul>
      </DialogContent>
    </Dialog>
  )
}
