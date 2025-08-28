"use client"

import { useState, useEffect, useCallback } from "react"
import type { StatusResponse } from "@/lib/types"
import { api, ApiError } from "@/lib/api"

interface UseLiveStatusOptions {
  pollInterval?: number
  enabled?: boolean
}

interface UseLiveStatusReturn {
  data: StatusResponse | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  isDemo?: boolean
}

// Helper to generate Flow[] consistent with lib/types.ts
function generateMockFlows(count: number) {
  const appTypes = ["video_stream", "gaming", "file_transfer", "best_effort"]
  const engines = ["Sentry", "Vanguard"] as const

  return Array.from({ length: count }).map((_, i) => ({
    id: `flow_${String(i + 1).padStart(3, "0")}`,
    source_ip: `192.168.1.${100 + i}`,
    dest_ip: `203.0.113.${45 + i}`,
    dest_port: 8000 + i,
    status: i % 2 === 0 ? "established" : "open",
    app_type: appTypes[i % appTypes.length],
    engine: engines[i % engines.length],
  }))
}

const mockStatusData: StatusResponse = {
  active_flows: generateMockFlows(2),
  classification_log: [
    {
      timestamp: new Date(Date.now() - 30000).toISOString(),
      message: "Classified video streaming traffic (confidence: 94.2%)",
      explanation: "High bandwidth usage pattern detected",
      engine: "Sentry",
    },
    {
      timestamp: new Date(Date.now() - 45000).toISOString(),
      message: "Complex traffic pattern analyzed (confidence: 97.8%)",
      explanation: "Analysis identified gaming traffic with low latency requirements",
      engine: "Vanguard",
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      message: "Bulk transfer classified as best effort (confidence: 89.1%)",
      explanation: "Large file transfer pattern with no time sensitivity",
      engine: "Sentry",
    },
  ],
  active_policies: [
    {
      flow_id: "flow_001",
      app_type: "Video Streaming",
      dscp_class: "AF41",
      tc_class: "1:10",
    },
    {
      flow_id: "flow_002",
      app_type: "Gaming",
      dscp_class: "EF",
      tc_class: "1:20",
    },
    {
      flow_id: "flow_003",
      app_type: "File Transfer",
      dscp_class: "AF11",
      tc_class: "1:30",
    },
  ],
  metrics: {
    high_prio: {
      packets: Math.floor(Math.random() * 5000) + 2000,
      bandwidth: Math.floor(Math.random() * 100) + 50,
    },
    video_stream: {
      packets: Math.floor(Math.random() * 8000) + 3000,
      bandwidth: Math.floor(Math.random() * 200) + 100,
    },
    best_effort: {
      packets: Math.floor(Math.random() * 15000) + 8000,
      bandwidth: Math.floor(Math.random() * 150) + 75,
    },
    low_prio: {
      packets: Math.floor(Math.random() * 3000) + 1000,
      bandwidth: Math.floor(Math.random() * 50) + 20,
    },
  },
  investigations: [],
}

export function useLiveStatus({ pollInterval = 3000, enabled = true }: UseLiveStatusOptions = {}): UseLiveStatusReturn {
  const [data, setData] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      setError(null)
      const status = await api.fetchStatus()
      setData(status)
      setIsDemo(false)
    } catch (err) {
      if (err instanceof Error && err.message.includes("Failed to fetch")) {
        console.log("[v0] API unavailable, using demo data")
        setData({
          ...mockStatusData,
          // Add some variation to make it feel live
          active_flows: generateMockFlows(Math.floor(Math.random() * 5) + 1),
          metrics: {
            high_prio: {
              packets: Math.floor(Math.random() * 5000) + 2000,
              bandwidth: Math.floor(Math.random() * 100) + 50,
            },
            video_stream: {
              packets: Math.floor(Math.random() * 8000) + 3000,
              bandwidth: Math.floor(Math.random() * 200) + 100,
            },
            best_effort: {
              packets: Math.floor(Math.random() * 15000) + 8000,
              bandwidth: Math.floor(Math.random() * 150) + 75,
            },
            low_prio: {
              packets: Math.floor(Math.random() * 3000) + 1000,
              bandwidth: Math.floor(Math.random() * 50) + 20,
            },
          },
        })
        setIsDemo(true)
        setError(null) // Clear error since we have fallback data
      } else {
        const errorMessage =
          err instanceof ApiError ? `API Error (${err.status}): ${err.message}` : "Failed to fetch status"
        setError(errorMessage)
        console.error("Status fetch error:", err)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    // Initial fetch
    fetchStatus()

    // Set up polling
    const interval = setInterval(fetchStatus, pollInterval)

    return () => clearInterval(interval)
  }, [fetchStatus, pollInterval, enabled])

  return {
    data,
    loading,
    error,
    refetch: fetchStatus,
    isDemo,
  }
}
