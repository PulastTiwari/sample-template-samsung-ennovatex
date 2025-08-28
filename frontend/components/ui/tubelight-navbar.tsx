"use client"

import React, { useEffect, useState } from "react"
import { motion, useReducedMotion, Variants } from "framer-motion"
import Link from "next/link"
import * as Icons from "lucide-react"
import { Button } from '@/components/ui/button'
import { cn } from "@/lib/utils"
// LLM health indicator removed from navbar
import { Menu } from "lucide-react"

interface NavItem {
  name: string
  url: string
  icon?: string // icon name (serializable)
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function NavBar({ items, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0]?.name ?? "")
  const [isMobile, setIsMobile] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const [expandedMobile, setExpandedMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // entrance animation settings
  const entrance = prefersReducedMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: {} as any }
    : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { type: 'spring' as const, stiffness: 120, damping: 18, mass: 0.6 } as any }

  const containerVariants: Variants = prefersReducedMotion
    ? { hidden: {}, show: {} }
    : {
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06, delayChildren: 0.06 } },
      }

  const itemVariants: Variants = prefersReducedMotion
    ? { hidden: {}, show: {} }
    : {
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 20 } },
      }

  // condensed pill behavior for very small screens
  const isVerySmall = typeof window !== 'undefined' ? window.innerWidth < 480 : false

  // If very small and not expanded, show a condensed pill that toggles the full bar
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
            <Menu size={18} />
          </Button>
        ) : (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setExpandedMobile(false)}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 140, damping: 20 }}
              className="mx-auto flex items-center gap-3 bg-background/40 border border-border backdrop-blur-lg py-2 px-3 rounded-full shadow-lg z-50"
            >
              {items.map((item, idx) => {
                const Icon = item.icon ? (Icons as any)[item.icon] : undefined
                const isActive = activeTab === item.name
                return (
                  <motion.span key={item.name} className={cn("inline-flex")}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * idx }}
                  >
                            <Link
                              href={item.url}
                              onClick={() => {
                                setActiveTab(item.name)
                                setExpandedMobile(false)
                              }}
                            >
                              <Button className={cn("p-2 rounded-full text-foreground/80 hover:text-primary")} size="icon" variant="ghost">
                                {Icon ? <Icon size={18} /> : <Icons.Circle size={18} />}
                              </Button>
                            </Link>
                  </motion.span>
                )
              })}
            </motion.div>
          </>
        )}
      </div>
    )
  }

  // prepare short labels for small screens
  const shortLabels: Record<string, string> = {
    Dashboard: "Dash",
    "Traffic Monitor": "Traffic",
    "AI Classification": "AI",
    Suggestions: "Ideas",
    "Model Status": "Models",
    Investigations: "Cases",
  }

  return (
    <motion.nav
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className={cn("fixed left-1/2 -translate-x-1/2 z-50", className)}
      style={{ bottom: 24 }}
      aria-hidden={false}
    >
      <motion.div
        {...entrance}
        className="flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-xl py-1 px-2 sm:py-1 sm:px-3 rounded-full shadow-lg"
      >
  {/* LLM status removed from navbar to avoid calling /admin/llm-health */}
        {/* Splash cursor toggle */}
        <div className="flex items-center mr-2">
          <CursorToggle />
        </div>
        {items.map((item) => {
          const Icon = item.icon ? (Icons as any)[item.icon] : undefined
          const isActive = activeTab === item.name

          return (
            <motion.div key={item.name} variants={itemVariants}>
              <Link
                href={item.url}
                onClick={() => setActiveTab(item.name)}
                className={cn(
                  // alignment and spacing
                  "relative flex items-center gap-2 text-sm font-semibold rounded-full transition-colors",
                  // use landing palette: subtle slate text, brighter on hover
                  "text-slate-300 hover:text-slate-50",
                  isActive && "bg-slate-700/40 text-slate-50",
                  "px-3 py-2 sm:px-4 sm:py-2",
                )}
              >
                {/* icon visible always (smaller screens show icon), short label on sm, full label on md+ */}
                <span className="inline-flex items-center justify-center">
                  {Icon ? <Icon size={18} strokeWidth={2.2} /> : <Icons.Circle size={18} strokeWidth={2.2} />}
                </span>

                <span className="hidden sm:inline md:hidden text-slate-100/90">{shortLabels[item.name] ?? item.name}</span>
                <span className="hidden md:inline">{item.name}</span>

                {isActive && (
                  <motion.div
                    layoutId="lamp"
                    className="absolute inset-0 w-full bg-slate-50/6 rounded-full -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-50/40 rounded-t-full">
                      <div className="absolute w-12 h-6 bg-slate-50/20 rounded-full blur-md -top-2 -left-2" />
                      <div className="absolute w-8 h-6 bg-slate-50/20 rounded-full blur-md -top-1" />
                      <div className="absolute w-4 h-4 bg-slate-50/20 rounded-full blur-sm top-0 left-2" />
                    </div>
                  </motion.div>
                )}
              </Link>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.nav>
  )
}

function CursorToggle() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem("splashCursor.enabled");
      return v === null ? true : v === "1";
    } catch (e) {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("splashCursor.enabled", enabled ? "1" : "0");
    } catch (e) {
      // ignore
    }
  }, [enabled]);

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
      {enabled ? (
        <Icons.Eye size={16} />
      ) : (
        <Icons.EyeOff size={16} />
      )}
    </Button>
  );
}

export default NavBar
