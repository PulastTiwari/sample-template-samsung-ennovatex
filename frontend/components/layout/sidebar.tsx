"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type NavItem = { name: string; href: string; icon?: React.ReactNode }

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Traffic Monitor", href: "/traffic" },
  { name: "AI Classification", href: "/classify" },
  { name: "Suggestions", href: "/suggestions" },
  { name: "Model Status", href: "/model" },
  { name: "Investigations", href: "/investigations" },
]

export function Sidebar(): React.ReactElement {
  const pathname = usePathname() || "/"
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      role="complementary"
      aria-label="Primary sidebar"
      className={cn(
        "flex h-full flex-col bg-sidebar border-r border-sidebar-border transition-all",
        collapsed ? "w-20" : "w-64"
      )}
      aria-expanded={!collapsed}
    >
      <div className="flex items-center justify-between h-16 px-3 border-b border-sidebar-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
          <span className={cn("text-lg font-display font-bold text-sidebar-foreground", collapsed ? "sr-only" : "")}>Sentinel-QoS</span>
          {!collapsed && <span className="text-sm text-sidebar-foreground/60">AI Orchestrator</span>}
        </div>

        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          onClick={() => setCollapsed((v) => !v)}
          className="p-2 rounded-md hover:bg-sidebar-accent/10 text-sidebar-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={cn("w-5 h-5 transform transition-transform", collapsed ? "rotate-180" : "rotate-0")}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9l6 6 6-6" />
          </svg>
        </Button>
      </div>

      <nav role="navigation" aria-label="Main" className="flex-1 px-1 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                    collapsed ? "justify-center" : ""
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <span className={cn("inline-flex items-center justify-center w-6 h-6 text-base", collapsed ? "mx-auto" : "mr-3")} aria-hidden>
                    {item.icon ?? <DefaultIcon />}
                  </span>
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className={cn("p-3 border-t border-sidebar-border text-xs text-sidebar-foreground/60", collapsed ? "text-center" : "") }>
        {!collapsed ? (
          <div>v1.0.0 • Real-time Classification</div>
        ) : (
          <div className="sr-only">v1.0.0</div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar

export function DefaultIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
      <g>
        <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
        <path d="M19.4 15a7.9 7.9 0 0 0 0-6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
