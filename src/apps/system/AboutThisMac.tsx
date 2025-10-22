import React from "react"

export default function AboutThisMac() {
  return (
    <div className="w-full h-full flex flex-col items-center bg-[#e5e5e5] text-black select-none font-sans">
      {/* Apple Logo */}
      <div className="mt-6">
        <img src="/apple-big.png" alt="Apple Logo" className="w-12 h-12" />
      </div>

      {/* Title */}
      <h1 className="text-lg font-bold mt-2 tracking-tight">Jeff OS X</h1>
      <p className="text-[11px] mt-0.5 text-gray-700">Version 1.0.0</p>

      {/* Specs (inline, authentic Aqua style) */}
      <div className="mt-5 w-[80%] text-[11px]">
        <div className="flex justify-between border-b border-gray-300 py-1">
          <span className="font-semibold">Processor</span>
          <span>Async by Nature</span>
        </div>
        <div className="flex justify-between border-b border-gray-300 py-1">
          <span className="font-semibold">Memory</span>
          <span>Unlimited Tabs in Chrome</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="font-semibold">Startup Disk</span>
          <span>Coffee + Lo-Fi Beats</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto mb-2 text-[10px] text-gray-600 text-center leading-tight">
        TM &copy; 1983–2025 Jeffrey James Idodo <br />
        All Rights Reserved.
      </div>
    </div>
  )
}
