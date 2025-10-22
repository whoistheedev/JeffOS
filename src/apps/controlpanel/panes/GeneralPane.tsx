// src/apps/controlpanel/panes/GeneralPane.tsx
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Switch } from "../../../components/ui/switch";
import { useStore } from "../../../store";

export default function GeneralPane() {
  const themeEra = useStore((s) => s.prefs.themeEra);
  const reduceMotion = useStore((s) => s.prefs.reduceMotion);

  // ✅ actions are on the root slice
  const setThemeEra = useStore((s) => s.setThemeEra);
  const setReduceMotion = useStore((s) => s.setReduceMotion);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Appearance</h3>

      <Tabs value={themeEra} onValueChange={(v) => setThemeEra(v as any)}>
        <TabsList>
          <TabsTrigger value="system7">System 7</TabsTrigger>
          <TabsTrigger value="mac9">Mac 9</TabsTrigger>
          <TabsTrigger value="aqua">Aqua</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-between">
        <span>Reduce Motion</span>
        <Switch
          checked={reduceMotion}
          onCheckedChange={(val: boolean) => setReduceMotion(val)}
        />
      </div>
    </div>
  );
}
