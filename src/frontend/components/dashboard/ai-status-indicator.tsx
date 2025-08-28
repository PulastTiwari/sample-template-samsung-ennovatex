"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AIStatusIndicatorProps {
  sentryActive: boolean
  vanguardActive: boolean
  totalClassifications: number
  accuracy: number
  className?: string
}

export function AIStatusIndicator({
  sentryActive,
  vanguardActive,
  totalClassifications,
  accuracy,
  className,
}: AIStatusIndicatorProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display">Classification Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-chart-2" />
            <span className="text-sm font-medium">Sentry (LightGBM)</span>
          </div>
          <Badge variant={sentryActive ? "default" : "secondary"} className="bg-chart-2 text-white">
            {sentryActive ? "ACTIVE" : "OFFLINE"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={cn("w-2 h-2 rounded-full", vanguardActive ? "bg-primary" : "bg-muted")} />
            <span className="text-sm font-medium">Vanguard</span>
          </div>
          <Badge variant={vanguardActive ? "default" : "secondary"} className="bg-primary text-primary-foreground">
            {vanguardActive ? "ACTIVE" : "STANDBY"}
          </Badge>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Classifications Today</span>
            <span className="font-mono font-medium">{totalClassifications.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">Accuracy Rate</span>
            <span className="font-mono font-medium text-chart-2">{accuracy.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
