import React from "react"

export default function ResumeApp() {
  const resumeUrl = "/resume.pdf"

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = resumeUrl
    link.download = "resume.pdf"
    link.click()
  }

  const handlePrint = () => {
    const iframe = document.getElementById("resume-iframe") as HTMLIFrameElement
    iframe?.contentWindow?.print()
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/cv`)
    alert("Link copied to clipboard!")
  }

  return (
    <div className="flex flex-col w-full h-full">
      {/* Toolbar */}
      <div className="flex gap-2 p-2 bg-gray-200 border-b border-gray-300">
        <button
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={handleDownload}
        >
          Download
        </button>
        <button
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          onClick={handlePrint}
        >
          Print
        </button>
        <button
          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
          onClick={handleCopyLink}
        >
          Copy Link
        </button>
      </div>

      {/* PDF Preview */}
      <iframe
        id="resume-iframe"
        src={resumeUrl}
        title="Resume"
        className="flex-1 w-full h-full"
      />
    </div>
  )
}
