import { Github, Linkedin, Coffee, FileText } from "lucide-react"

export default function SocialsWidget() {
  return (
    <div className="fixed bottom-2 left-2 flex gap-3 bg-black/60 text-white px-3 py-1 rounded-full shadow-lg">
      {/* GitHub */}
      <a
        href="https://github.com/whoistheedev"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
        className="hover:text-gray-300 transition-colors"
      >
        <Github size={16} />
      </a>

      {/* X */}
      <a
        href="https://x.com/whoistheedev"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="X"
        className="hover:text-gray-300 transition-colors"
      >
        <img src="/icons/x.svg" alt="X" className="w-4 h-4" />
      </a>

      {/* LinkedIn */}
      <a
        href="https://www.linkedin.com/in/
jeffrey-james-idodo-4402b6390
"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn"
        className="hover:text-blue-400 transition-colors"
      >
        <Linkedin size={16} />
      </a>

      {/* Resume */}
      <a
        href="/Jeffrey James Idodo PERN_Full_Stack_Developer.pdf"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Resume"
        className="hover:text-emerald-400 transition-colors"
      >
        <FileText size={16} />
      </a>

      {/* Buy Me a Coffee */}
      <a
        href="https://www.buymeacoffee.com/whoistheedev"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Buy Me a Coffee"
        className="hover:text-yellow-300 transition-colors"
      >
        <Coffee size={16} />
      </a>
    </div>
  )
}
