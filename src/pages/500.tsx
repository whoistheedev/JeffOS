export default function ServerError() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
      <img src="/icons/sad-mac.png" alt="Sad Mac" className="w-24 h-24 mb-4" />
      <h1 className="text-2xl font-bold">500 — Something Broke</h1>
      <p className="text-gray-400">Try restarting your Mac Portfolio OS.</p>
    </div>
  )
}
