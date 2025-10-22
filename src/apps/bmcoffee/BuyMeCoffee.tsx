import { useEffect } from "react"

export default function BuyMeCoffeeApp() {
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-300 dark:border-zinc-700 font-semibold text-sm bg-gray-100 dark:bg-zinc-800">
        Buy Me a Coffee
      </div>

      {/* embedded button */}
      <div className="flex-1 flex items-center justify-center">
        <a
          className="bmc-button"
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.buymeacoffee.com/whoistheedev"
        >
          <span>☕ Buy me a coffee</span>
        </a>
      </div>
    </div>
  )
}
