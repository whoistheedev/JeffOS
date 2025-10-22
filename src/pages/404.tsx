export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
      <img src="/icons/sad-mac.png" alt="Sad Mac" className="w-24 h-24 mb-4" />
      <h1 className="text-2xl font-bold">404 — Not Found</h1>
      <p className="text-gray-400">This page crashed like System 7.</p>
    </div>
  )
}
