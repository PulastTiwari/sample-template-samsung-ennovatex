"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { ClassificationLogEntry } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AIEngineStatusProps {
  logs: ClassificationLogEntry[]
  className?: string
}

export function AIEngineStatus({ logs, className }: AIEngineStatusProps) {
  const sentryLogs = logs.filter((log) => log.engine === "Sentry")
  const vanguardLogs = logs.filter((log) => log.engine === "Vanguard")
  const totalClassifications = logs.length

  const sentryPercentage = totalClassifications > 0 ? (sentryLogs.length / totalClassifications) * 100 : 0
  const vanguardPercentage = totalClassifications > 0 ? (vanguardLogs.length / totalClassifications) * 100 : 0

  const getEngineHealth = (logCount: number) => {
    if (logCount === 0) return { status: "Standby", color: "bg-muted text-muted-foreground" }
    if (logCount < 10) return { status: "Low Activity", color: "bg-chart-3 text-white" }
    if (logCount < 50) return { status: "Active", color: "bg-chart-2 text-white" }
    return { status: "High Activity", color: "bg-chart-1 text-white" }
  }

  const sentryHealth = getEngineHealth(sentryLogs.length)
  const vanguardHealth = getEngineHealth(vanguardLogs.length)

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-display">AI Engine Performance</CardTitle>
        <p className="text-sm text-muted-foreground">Two-stage classification system status and metrics</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Sentry Engine */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-chart-2" />
              <h4 className="font-semibold">Sentry (LightGBM)</h4>
            </div>
            <Badge variant="secondary" className={sentryHealth.color}>
              {sentryHealth.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Classifications:</span>
              <div className="font-mono font-medium mt-1">{sentryLogs.length.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Usage Share:</span>
              <div className="font-mono font-medium mt-1">{sentryPercentage.toFixed(1)}%</div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Fast ML Classification</span>
              <span>{sentryPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={sentryPercentage} className="h-2" />
          </div>

          <div className="text-xs text-muted-foreground">
            <strong>Purpose:</strong> High-speed traffic classification using trained LightGBM model for common flow
            patterns
          </div>
        </div>

        {/* Vanguard Engine */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <h4 className="font-semibold">Vanguard</h4>
            </div>
            <Badge variant="secondary" className={vanguardHealth.color}>
              {vanguardHealth.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Classifications:</span>
              <div className="font-mono font-medium mt-1">{vanguardLogs.length.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Usage Share:</span>
              <div className="font-mono font-medium mt-1">{vanguardPercentage.toFixed(1)}%</div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Fallback & Explanations</span>
              <span>{vanguardPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={vanguardPercentage} className="h-2" />
          </div>

          <div className="text-xs text-muted-foreground">
            <strong>Purpose:</strong> Advanced reasoning for low-confidence cases and detailed explanations of
            classification decisions
          </div>
        </div>

        {/* System Overview */}
        <div className="pt-4 border-t border-border">
          <h4 className="font-semibold mb-3">System Overview</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Classifications:</span>
              <div className="font-mono font-medium mt-1 text-lg">{totalClassifications.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Hybrid Efficiency:</span>
              <div className="font-mono font-medium mt-1 text-lg text-chart-2">
                {sentryPercentage > vanguardPercentage ? "Optimized" : "Balanced"}
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 bg-muted/20 rounded-lg text-xs text-muted-foreground">
            <strong>Architecture:</strong> Sentry handles fast, confident classifications while Vanguard provides
            detailed analysis for complex or uncertain flows, ensuring both speed and accuracy.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
