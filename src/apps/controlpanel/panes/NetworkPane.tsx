import React from "react"

export default function NetworkPane() {
  // Graceful fallback if API not available
  const connection = (navigator as any).connection || null

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Status</h3>
      <p>{navigator.onLine ? "Online ✅" : "Offline ❌"}</p>

      {connection ? (
        <>
          <p>Type: {connection.effectiveType || "Unknown"}</p>
          {connection.downlink && <p>Downlink: {connection.downlink} Mbps</p>}
          {connection.rtt && <p>Latency: {connection.rtt} ms</p>}
          {connection.saveData && <p>⚡ Data Saver Mode</p>}
        </>
      ) : (
        <p className="text-gray-500 text-sm">
          Network Information API not supported in this browser.
        </p>
      )}
    </div>
  )
}
