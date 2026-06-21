// src/apps/controlpanel/panes/AboutPane.tsx
import { useStore } from "../../../store";

export default function AboutPane() {
  const themeEra = useStore((s) => s.prefs.themeEra);
  const anonId = useStore((s) => s.anonId); // ✅ root-level, not in prefs

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">About This Mac</h3>
      <p><strong>Mac Portfolio OS</strong></p>
      <p>Version 10.4 (Tiger-inspired)</p>
      <p><strong>Theme Era:</strong> {themeEra}</p>
      <p><strong>Visitor ID:</strong> {anonId}</p>
    </div>
  );
}
