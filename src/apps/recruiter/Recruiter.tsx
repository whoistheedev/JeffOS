import React, { useEffect, useState } from "react"
import { Button } from "../../components/ui/button"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { supabase } from "../../lib/supabase"

type Project = {
  id: number
  slug: string
  name: string
  description: string
  thumbnail_url: string
  live_url: string
  active: boolean
}

export default function Recruiter() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [resumeUrl, setResumeUrl] = useState("")

  const email = "jeffreyjidodo@gmail.com"

  // Fetch resume PDF & projects dynamically from Supabase
  useEffect(() => {
    const fetchResume = async () => {
      const { data } = supabase
        .storage
        .from("portfolio")
        .getPublicUrl("Jeffrey James Idodo PERN_Full_Stack_Developer.pdf")

      if (data?.publicUrl) {
        setResumeUrl(data.publicUrl)
      } else {
        toast.error("Failed to fetch resume")
      }
    }

    const fetchProjects = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("active", true)
        .order("id", { ascending: true })

      if (error) {
        console.error(error)
        toast.error("Failed to fetch projects")
      } else {
        setProjects(data as Project[])
      }
      setLoading(false)
    }

    fetchResume()
    fetchProjects()
  }, [])

  // ⌘R shortcut for Resume tile
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "r") {
        e.preventDefault()
        document.getElementById("resume-tile")?.scrollIntoView({ behavior: "smooth" })
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
      {/* Resume Tile */}
      <motion.div
        id="resume-tile"
        className="border rounded-md p-4 flex flex-col bg-[#f2f2f2] shadow-md hover:shadow-lg transition-shadow"
        whileHover={{ scale: 1.02 }}
      >
        <h2 className="font-bold mb-2 text-[#1a1a1a]">Resume</h2>
        {resumeUrl ? (
          <iframe
            src={resumeUrl}
            className="flex-1 w-full border rounded-md"
            title="Resume PDF"
          />
        ) : (
          <div className="flex-1 w-full h-40 flex items-center justify-center text-gray-500">
            Loading resume...
          </div>
        )}
      </motion.div>

      {/* Dynamic Projects (including Mac Portfolio) */}
      {loading ? (
        <motion.div className="col-span-full flex items-center justify-center p-6 bg-[#f9f9f9] rounded-md shadow-md">
          Loading projects...
        </motion.div>
      ) : projects.length === 0 ? (
        <motion.div className="col-span-full flex items-center justify-center p-6 bg-[#f9f9f9] rounded-md shadow-md">
          No projects found.
        </motion.div>
      ) : (
        projects.map((p) => (
          <motion.div
            key={p.id}
            className={`border rounded-md p-2 flex flex-col bg-[#f9f9f9] shadow hover:shadow-lg cursor-pointer ${
              p.slug === "mac-portfolio" ? "border-blue-500" : ""
            }`}
            whileHover={{ scale: 1.02 }}
            onClick={() => window.open(p.live_url, "_blank")}
          >
            <h2 className="font-semibold mb-1 text-[#1a1a1a]">
              {p.name} {p.slug === "mac-portfolio" && "⭐"}
            </h2>
            <div className="flex-1 mb-2">
              {p.thumbnail_url ? (
                <img
                  src={p.thumbnail_url}
                  alt={`${p.name} thumbnail`}
                  className="w-full h-40 object-cover rounded-md"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-40 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                  Live preview
                </div>
              )}
            </div>
            <p className="text-sm text-gray-700">{p.description}</p>
          </motion.div>
        ))
      )}

      {/* One-pager (same as resume) */}
      <motion.div
        className="border rounded-md p-4 flex flex-col items-center justify-center bg-[#f2f2f2] shadow-md hover:shadow-lg transition-shadow"
        whileHover={{ scale: 1.02 }}
      >
        <h2 className="font-bold mb-2 text-[#1a1a1a]">One-pager</h2>
        <Button
          onClick={() => {
            if (resumeUrl) window.open(resumeUrl, "_blank")
            toast("Downloading one-pager...")
          }}
        >
          Download One-pager
        </Button>
      </motion.div>

      {/* Contact */}
      <motion.div
        className="border rounded-md p-4 flex flex-col items-center justify-center bg-[#f2f2f2] shadow-md hover:shadow-lg transition-shadow"
        whileHover={{ scale: 1.02 }}
      >
        <h2 className="font-bold mb-2 text-[#1a1a1a]">Contact</h2>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(email)
            toast.success("Email copied to clipboard")
          }}
        >
          Copy Email
        </Button>
      </motion.div>
    </div>
  )
}
