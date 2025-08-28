"use client"

import { cn } from "@/lib/utils"

import { useState } from "react"
import { useLiveStatus } from "@/hooks/use-live-status"
import { LiveTrafficTable } from "@/components/traffic/live-traffic-table"
import { FlowDetailPanel } from "@/components/traffic/flow-detail-panel"
// Sidebar removed — navigation is now site-wide via NavBar and top-left logo
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Flow } from "@/lib/types"

export default function TrafficPage() {
  const { data, loading, error } = useLiveStatus()
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null)

  if (error) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 p-6">
          <Alert variant="destructive">
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              Unable to connect to Sentinel-QoS backend. Please ensure the API server is running on localhost:8000.
              <br />
              <span className="text-xs mt-2 block">Error: {error}</span>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">

      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-display font-bold text-balance">Traffic Monitor</h1>
            <p className="text-muted-foreground mt-1">
              Real-time network flow monitoring and AI-powered classification analysis
            </p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Traffic Table */}
            <div className={cn("", selectedFlow ? "xl:col-span-2" : "xl:col-span-3")}>
              <LiveTrafficTable flows={data?.active_flows || []} loading={loading} onFlowSelect={setSelectedFlow} />
            </div>

            {/* Flow Detail Panel */}
            {selectedFlow && (
              <div className="xl:col-span-1">
                <FlowDetailPanel
                  flow={selectedFlow}
                  classificationLogs={data?.classification_log || []}
                  policies={data?.active_policies || []}
                  onClose={() => setSelectedFlow(null)}
                />
              </div>
            )}
          </div>

          {/* Traffic Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border p-6">
              <h3 className="text-lg font-display font-semibold mb-2">Classification Engines</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sentry Classifications:</span>
                  <span className="font-mono">
                    {data?.classification_log.filter((log) => log.engine === "Sentry").length || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vanguard Classifications:</span>
                  <span className="font-mono">
                    {data?.classification_log.filter((log) => log.engine === "Vanguard").length || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border p-6">
              <h3 className="text-lg font-display font-semibold mb-2">Flow Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Flows:</span>
                  <span className="font-mono">{data?.active_flows.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Policies Applied:</span>
                  <span className="font-mono">{data?.active_policies.length || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border p-6">
              <h3 className="text-lg font-display font-semibold mb-2">System Health</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Classification Rate:</span>
                  <span className="font-mono text-chart-2">94.7%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Response Time:</span>
                  <span className="font-mono">12ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
