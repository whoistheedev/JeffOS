export type MenuItemEntry =
  | {
      label: string
      shortcut?: string
      disabled?: boolean
      type?: undefined
    }
  | {
      type: "separator"
      label?: undefined
      shortcut?: undefined
      disabled?: undefined
    }

export type AppMenus = Record<string, MenuItemEntry[]>
