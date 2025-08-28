"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface MetricsCardProps {
  title: string
  value: number
  unit: string
  change?: number
  variant?: "high_prio" | "video_stream" | "best_effort" | "low_prio"
  className?: string
}

const variantStyles = {
  high_prio: "border-chart-5 bg-chart-5/5",
  video_stream: "border-chart-4 bg-chart-4/5",
  best_effort: "border-chart-1 bg-chart-1/5",
  low_prio: "border-chart-2 bg-chart-2/5",
}

const variantColors = {
  high_prio: "bg-chart-5 text-white",
  video_stream: "bg-chart-4 text-white",
  best_effort: "bg-chart-1 text-white",
  low_prio: "bg-chart-2 text-white",
}

export function MetricsCard({ title, value, unit, change, variant = "best_effort", className }: MetricsCardProps) {
  const formatValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`
    return val.toString()
  }

  return (
    <Card className={cn("relative overflow-hidden", variantStyles[variant], className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Badge variant="secondary" className={cn("text-xs", variantColors[variant])}>
            {variant.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold font-display">{formatValue(value)}</div>
          <div className="text-sm text-muted-foreground">{unit}</div>
        </div>
        {change !== undefined && (
          <div className={cn("text-xs mt-1", change >= 0 ? "text-chart-2" : "text-chart-5")}>
            {change >= 0 ? "↗" : "↘"} {Math.abs(change)}% from last hour
          </div>
        )}
      </CardContent>
    </Card>
  )
}
