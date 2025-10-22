import React from "react"
import type { AppIcon } from "../store/apps"

type AppIconRendererProps = {
  icon: AppIcon
  size?: "desktop" | "list" | "dock" | "column" // ✅ added column
}

export function AppIconRenderer({
  icon,
  size = "desktop",
}: AppIconRendererProps) {
  let wrapperClass = ""
  let iconClass = ""

  switch (size) {
    case "desktop":
      wrapperClass = "w-12 h-12 flex items-center justify-center"
      iconClass = "w-full h-full object-contain"
      break
    case "list":
      wrapperClass = "w-5 h-5 flex items-center justify-center"
      iconClass = "w-5 h-5 object-contain"
      break
    case "column":
      wrapperClass = "w-5 h-5 flex items-center justify-center"
      iconClass = "w-5 h-5 object-contain"
      break
    case "dock":
      wrapperClass = "w-full h-full flex items-center justify-center"
      iconClass = "w-full h-full object-contain"
      break
  }

  return (
    <div className={wrapperClass}>
      {icon.iconComponent ? (
        // ✅ forward both size and className
        React.createElement(icon.iconComponent, {
          size,
          className: iconClass,
        })
      ) : (
        <img src={icon.iconUrl} alt={icon.title} className={iconClass} />
      )}
    </div>
  )
}
