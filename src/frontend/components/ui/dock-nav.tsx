"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import * as Icons from "lucide-react"
import { Button } from '@/components/ui/button'
import { cn } from "@/lib/utils"
// LLM health indicator removed from dock
import { Dock, DockItem, DockIcon, DockLabel } from '@/components/ui/dock'
import { useReducedMotion } from 'framer-motion'

interface NavItem {
  name: string
  url: string
  icon?: string // icon name
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function DockNav({ items, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0]?.name ?? "")
  const [isMobile, setIsMobile] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const [expandedMobile, setExpandedMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Small-screen condensed pill -> mirror NavBar behavior
  const isVerySmall = typeof window !== 'undefined' ? window.innerWidth < 480 : false

  if (isVerySmall) {
    return (
      <div className={cn("fixed left-1/2 -translate-x-1/2 z-50", className)} style={{ bottom: 18 }}>
        {!expandedMobile ? (
          <Button
            aria-label="Open navigation"
            onClick={() => setExpandedMobile(true)}
            className="w-12 h-12 rounded-full bg-background/40 backdrop-blur-md border border-border flex items-center justify-center shadow-md"
            size="icon"
            variant="ghost"
          >
            <Icons.Menu size={18} />
          </Button>
        ) : (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setExpandedMobile(false)} aria-hidden />
            <div className="mx-auto flex items-center gap-3 bg-background/40 border border-border backdrop-blur-lg py-2 px-3 rounded-full shadow-lg z-50">
              {items.map((item, idx) => {
                const Icon = item.icon ? (Icons as any)[item.icon] : undefined
                return (
                  <span key={item.name} className="inline-flex" style={{ transitionDelay: `${0.06 * idx}s` }}>
                    <Link href={item.url} onClick={() => { setActiveTab(item.name); setExpandedMobile(false) }}>
                      <Button className={cn("p-2 rounded-full text-foreground/80 hover:text-primary")} size="icon" variant="ghost">
                        {Icon ? <Icon size={18} /> : <Icons.Circle size={18} />}
                      </Button>
                    </Link>
                  </span>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  // Desktop: render dock centered at bottom
  return (
    <div className={cn("fixed left-1/2 -translate-x-1/2 z-50", className)} style={{ bottom: 18 }}>
      <Dock className="items-end pb-2">
  {/* Leading controls (cursor toggle, etc.) */}
        <DockItem className="aspect-square rounded-full bg-transparent">
          <DockIcon>
            <div className="p-2">
              <CursorToggle />
            </div>
          </DockIcon>
          <DockLabel>Cursor</DockLabel>
        </DockItem>

        {items.map((item) => {
          const Icon = item.icon ? (Icons as any)[item.icon] : undefined
          const isActive = activeTab === item.name

          return (
            <DockItem key={item.name} className={cn('aspect-square rounded-full', isActive ? 'ring-2 ring-sky-400' : '')}>
              <DockLabel>{item.name}</DockLabel>
              <DockIcon>
                <Link href={item.url} onClick={() => setActiveTab(item.name)}>
                  {Icon ? <Icon className='h-full w-full text-neutral-600 dark:text-neutral-300' /> : <Icons.Circle className='h-full w-full' />}
                </Link>
              </DockIcon>
            </DockItem>
          )
        })}
      </Dock>
    </div>
  )
}

function CursorToggle() {
  // Don't access `localStorage` during render — read it after mount to avoid
  // hydration mismatches between server and client. Start with a stable
  // default (false) and sync from storage in an effect.
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem("splashCursor.enabled");
      if (v !== null) setEnabled(v === "1");
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("splashCursor.enabled", enabled ? "1" : "0");
    } catch (e) {}
  }, [enabled]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // During SSR we render a neutral placeholder to avoid accidental
  // hydration mismatches; once mounted the actual icon reflects state.
  return (
    <Button
      aria-label={enabled ? "Disable splash cursor" : "Enable splash cursor"}
      onClick={() => {
        const newVal = !enabled;
        setEnabled(newVal);
        try {
          localStorage.setItem("splashCursor.enabled", newVal ? "1" : "0");
        } catch (e) {}
        try {
          window.dispatchEvent(new CustomEvent("splashCursor:change", { detail: { enabled: newVal } }));
        } catch (e) {}
      }}
      className="w-10 h-10 rounded-full bg-background/30 flex items-center justify-center text-slate-200/90 hover:bg-background/40"
      title={enabled ? "Disable fancy cursor" : "Enable fancy cursor"}
      size="icon"
      variant="ghost"
    >
      {mounted ? (enabled ? <Icons.Eye size={16} /> : <Icons.EyeOff size={16} />) : <span className="w-4 h-4 block" />}
    </Button>
  )
}

export default DockNav
