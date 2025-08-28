"use client"

import { useLiveStatus } from "@/hooks/use-live-status"
import { MetricsCard } from "@/components/dashboard/metrics-card"
import { AIStatusIndicator } from "@/components/dashboard/ai-status-indicator"
import { LiveTrafficOverview } from "@/components/dashboard/live-traffic-overview"
// Sidebar removed — navigation is now site-wide via NavBar and top-left logo
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function DashboardPage() {
  const { data, loading, error } = useLiveStatus()

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-balance">AI Network Orchestrator</h1>
              <p className="text-muted-foreground mt-1">Real-time traffic classification and QoS policy management</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/traffic/simulation" onClick={() => { /* placeholder; replaced by inner button handler */ }}>
                <Button
                  onClick={() => {
                    // analytics hook (gtm/dataLayer) and toast
                    try {
                      // push to dataLayer if present for analytics
                      ;(window as any).dataLayer?.push?.({ event: 'simulation_open', videoPct: 50 })
                    } catch (e) {}
                  }}
                  className="inline-flex items-center"
                >
                  Run Simulation
                </Button>
              </Link>
              <div className="text-xs text-muted-foreground">
                Quick run: simulate traffic mixes and see classifier distribution. Sample size is bounded for demo.
              </div>
              {loading && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm">Syncing...</span>
                </div>
              )}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricsCard
              title="High Priority"
              value={data?.metrics.high_prio.packets || 0}
              unit="packets"
              variant="high_prio"
              change={12}
            />
            <MetricsCard
              title="Video Streaming"
              value={data?.metrics.video_stream.bandwidth || 0}
              unit="Mbps"
              variant="video_stream"
              change={-3}
            />
            <MetricsCard
              title="Best Effort"
              value={data?.metrics.best_effort.packets || 0}
              unit="packets"
              variant="best_effort"
              change={8}
            />
            <MetricsCard
              title="Low Priority"
              value={data?.metrics.low_prio.bandwidth || 0}
              unit="Mbps"
              variant="low_prio"
              change={-1}
            />
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI Status */}
            <AIStatusIndicator
              sentryActive={true}
              vanguardActive={data?.classification_log.some((log) => log.engine === "Vanguard") || false}
              totalClassifications={data?.classification_log.length || 0}
              accuracy={94.7}
            />

            {/* Live Traffic Overview */}
            <div className="lg:col-span-2">
              <LiveTrafficOverview flows={data?.active_flows || []} loading={loading} />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Classification Log Preview */}
            <div className="bg-card rounded-xl border p-6">
              <h3 className="text-lg font-display font-semibold mb-4">Recent Classifications</h3>
              <div className="space-y-3">
                {data?.classification_log.slice(0, 3).map((log, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/20">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${log.engine === "Sentry" ? "bg-chart-2" : "bg-primary"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{log.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{log.timestamp}</p>
                      {log.explanation && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{log.explanation}</p>
                      )}
                    </div>
                  </div>
                )) || <div className="text-center py-4 text-muted-foreground text-sm">No recent classifications</div>}
              </div>
            </div>

            {/* Active Policies Preview */}
            <div className="bg-card rounded-xl border p-6">
              <h3 className="text-lg font-display font-semibold mb-4">Active Policies</h3>
              <div className="space-y-3">
                {data?.active_policies.slice(0, 3).map((policy, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                    <div>
                      <p className="text-sm font-medium">{policy.app_type}</p>
                      <p className="text-xs text-muted-foreground">Flow: {policy.flow_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono">{policy.dscp_class}</p>
                      <p className="text-xs text-muted-foreground">{policy.tc_class}</p>
                    </div>
                  </div>
                )) || <div className="text-center py-4 text-muted-foreground text-sm">No active policies</div>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
