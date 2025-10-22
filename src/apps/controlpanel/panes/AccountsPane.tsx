// src/apps/controlpanel/panes/AccountsPane.tsx
import React from "react";
import { useStore } from "../../../store";

export default function AccountsPane() {
  const anonId = useStore((s) => s.anonId);      // ✅ root-level
  const prefs = useStore((s) => s.prefs);        // ✅ nested prefs

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Visitor Account</h3>
      <p>
        <strong>Anon ID:</strong> {anonId}
      </p>
      <p>
        <strong>Handle:</strong> {prefs.handle || "Not set"}
      </p>
      {prefs.avatar && (
        <img
          src={prefs.avatar}
          alt="Visitor avatar"
          className="w-16 h-16 rounded-full"
        />
      )}
    </div>
  );
}
