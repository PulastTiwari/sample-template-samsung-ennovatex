"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { Flow } from "@/lib/types"
import { cn } from "@/lib/utils"

interface LiveTrafficOverviewProps {
  flows: Flow[]
  loading?: boolean
  className?: string
}

const getEngineColor = (engine?: string) => {
  switch (engine) {
    case "Sentry":
      return "bg-chart-2 text-white"
    case "Vanguard":
      return "bg-primary text-primary-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

const getStatusColor = (status: string) => {
  if (status.includes("Policy Applied")) return "text-chart-2"
  if (status.includes("Classified")) return "text-chart-4"
  return "text-muted-foreground"
}

export function LiveTrafficOverview({ flows, loading = false, className }: LiveTrafficOverviewProps) {
  const safeFlows = Array.isArray(flows) ? flows : []
  const recentFlows = safeFlows.slice(0, 5)

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display">Live Traffic Overview</CardTitle>
          {loading && <LoadingSpinner size="sm" />}
        </div>
      </CardHeader>
      <CardContent>
        {recentFlows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-sm">No active flows detected</div>
            <div className="text-xs mt-1">Waiting for network traffic...</div>
          </div>
        ) : (
          <div className="space-y-3">
            {recentFlows.map((flow) => (
              <div
                key={flow.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono font-medium truncate">
                      {flow.source_ip} → {flow.dest_ip}:{flow.dest_port}
                    </span>
                    {flow.engine && (
                      <Badge variant="secondary" className={cn("text-xs", getEngineColor(flow.engine))}>
                        {flow.engine}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-muted-foreground">{flow.app_type}</span>
                    <span className={cn("text-xs font-medium", getStatusColor(flow.status))}>{flow.status}</span>
                  </div>
                </div>
              </div>
            ))}

            {safeFlows.length > 5 && (
              <div className="text-center pt-2">
                <span className="text-xs text-muted-foreground">+{safeFlows.length - 5} more flows active</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
