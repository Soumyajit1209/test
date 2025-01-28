"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, User } from "lucide-react"

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-black text-white p-4 flex flex-col">
      <div className="text-2xl font-bold mb-8">azmth</div>
      <nav className="space-y-4 py-5">
        <Link href="/" className={`flex items-center space-x-2 p-2 rounded-md ${pathname === "/" ? "bg-blue-500 text-white" : "text-blue-400 hover:text-blue-300"}`}>
          <Home />
          <span>Home</span>
        </Link>
        <Link href="/personal-assistance" className={`flex items-center space-x-2 p-2 rounded-md ${pathname === "/personal-assistance" ? "bg-blue-500 text-white" : "text-blue-400 hover:text-blue-300"}`}>
          <User />
          <span>Personal Assistance</span>
        </Link>
      </nav>
    </div>
  )
}
