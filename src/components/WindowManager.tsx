// src/components/WindowManager.tsx
import React from "react";
import { useStore } from "../store";
import Window from "./Window";

export default function WindowManager() {
  // Get all open windows from store
  const windows = useStore((state) => state.windows);
  const windowIds = Object.keys(windows);

  if (windowIds.length === 0) return null;

  return (
    <>
      {windowIds.map((id) => (
        <Window key={id} id={id} />
      ))}
    </>
  );
}
