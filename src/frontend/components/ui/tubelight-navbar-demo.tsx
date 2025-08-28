import React, { useState } from "react"
import NavBar from "@/components/ui/tubelight-navbar"
import { Button } from '@/components/ui/button'

export function NavBarDemo() {
  const navItems = [
    { name: "Dashboard", url: "/dashboard", icon: "Home" },
    { name: "Traffic Monitor", url: "/traffic", icon: "Activity" },
    { name: "AI Classification", url: "/classify", icon: "Cpu" },
    { name: "Suggestions", url: "/suggestions", icon: "Lightbulb" },
    { name: "Model Status", url: "/model", icon: "FileText" },
    { name: "Investigations", url: "/investigations", icon: "Search" },
  ]

  const [mounted, setMounted] = useState(true)

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="space-x-2">
        <Button onClick={() => setMounted((m) => !m)} className="px-3 py-1 rounded bg-primary text-primary-foreground">
          {mounted ? "Unmount nav" : "Mount nav"}
        </Button>
      </div>

      {mounted && <NavBar items={navItems} />}
    </div>
  )
}

export default NavBarDemo
