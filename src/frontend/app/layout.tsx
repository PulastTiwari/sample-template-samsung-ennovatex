import type React from "react"

import type { Metadata } from "next"
import { Source_Sans_3, Playfair_Display, Geist_Mono, Open_Sans } from "next/font/google"
import { ErrorBoundary } from "@/components/ui/error-boundary" // Added error boundary import
import DockNav from '@/components/ui/dock-nav'
import SplashCursor from "@/components/ui/splash-cursor"
import Image from "next/image"
import Link from "next/link"
import "./globals.css"

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
})

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-open-sans",
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "Sentinel-QoS | AI Network Orchestrator",
  description:
    "AI-driven Quality of Service orchestrator for intelligent network traffic classification and policy management",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${openSans.variable} ${sourceSans.variable} ${playfairDisplay.variable} ${geistMono.variable} antialiased dark`}
    >
      <body className="min-h-screen bg-background text-foreground">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <SplashCursor />

  {/* site-wide fixed dock (home is first item) */}
                    <DockNav
                      items={[
                        { name: 'Home', url: '/', icon: 'Home' },
                        { name: 'Dashboard', url: '/dashboard', icon: 'BarChart' },
                        { name: 'Traffic', url: '/traffic', icon: 'Cpu' },
                        { name: 'Classify', url: '/classify', icon: 'Tag' },
                        { name: 'Admin', url: '/admin', icon: 'Settings' },
                      ]}
                    />
      </body>
    </html>
  )
}
