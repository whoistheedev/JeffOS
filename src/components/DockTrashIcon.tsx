import { useStore } from "../store"

export default function DockTrashIcon() {
  const trash = useStore((s) => s.trash)
  const icons = useStore((s) => s.desktopIcons)

  const iconUrl =
    trash.length === 0
      ? "/icons/trash.png"
      : "/icons/trash-full.png" // ✅ matches Finder

  const handleOpen = () => {
    const finder = icons.find((i) => i.id === "finder")
    finder?.launch({ path: ["Trash"] }) // ✅ open Finder at Trash
  }

  return (
    <button
      className="w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform"
      onClick={handleOpen}
      aria-label="Trash"
    >
      <img src={iconUrl} alt="Trash" className="w-8 h-8 object-contain" />
    </button>
  )
}
