"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface FeatureImportanceProps {
  className?: string
}

// Mock feature importance data - in a real app this would come from the model
const mockFeatureImportance = [
  { feature: "avg_pkt_len", importance: 0.234, description: "Average packet length in bytes" },
  { feature: "bytes_total", importance: 0.187, description: "Total bytes transferred in flow" },
  { feature: "duration_seconds", importance: 0.156, description: "Flow duration in seconds" },
  { feature: "packet_count", importance: 0.143, description: "Total number of packets in flow" },
  { feature: "payload_entropy", importance: 0.089, description: "Entropy of packet payload data" },
  { feature: "inter_arrival_time", importance: 0.067, description: "Average time between packets" },
  { feature: "port_443", importance: 0.045, description: "Boolean: uses HTTPS port 443" },
  { feature: "protocol_tcp", importance: 0.034, description: "Boolean: uses TCP protocol" },
  { feature: "flow_ratio", importance: 0.028, description: "Ratio of upstream to downstream packets" },
  { feature: "port_80", importance: 0.012, description: "Boolean: uses HTTP port 80" },
  { feature: "protocol_udp", importance: 0.003, description: "Boolean: uses UDP protocol" },
  { feature: "port_22", importance: 0.002, description: "Boolean: uses SSH port 22" },
]

export function FeatureImportance({ className }: FeatureImportanceProps) {
  const getImportanceColor = (importance: number) => {
    if (importance >= 0.15) return "bg-chart-5"
    if (importance >= 0.1) return "bg-chart-4"
    if (importance >= 0.05) return "bg-chart-3"
    if (importance >= 0.02) return "bg-chart-2"
    return "bg-chart-1"
  }

  const getImportanceLevel = (importance: number) => {
    if (importance >= 0.15) return { level: "Critical", color: "bg-chart-5 text-white" }
    if (importance >= 0.1) return { level: "High", color: "bg-chart-4 text-white" }
    if (importance >= 0.05) return { level: "Medium", color: "bg-chart-3 text-white" }
    if (importance >= 0.02) return { level: "Low", color: "bg-chart-2 text-white" }
    return { level: "Minimal", color: "bg-chart-1 text-white" }
  }

  const maxImportance = Math.max(...mockFeatureImportance.map((f) => f.importance))

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-display">Feature Importance Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Relative importance of each feature in the Sentry classification model
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Feature List */}
        <div className="space-y-3">
          {mockFeatureImportance.map((item, index) => {
            const percentage = (item.importance / maxImportance) * 100
            const importanceLevel = getImportanceLevel(item.importance)

            return (
              <div key={item.feature} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-mono font-medium">{item.feature}</span>
                    <Badge variant="secondary" className={cn("text-xs", importanceLevel.color)}>
                      {importanceLevel.level}
                    </Badge>
                  </div>
                  <span className="text-sm font-mono font-bold">{(item.importance * 100).toFixed(1)}%</span>
                </div>

                <div className="space-y-1">
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary Statistics */}
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-semibold mb-3">Feature Analysis Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold font-mono text-chart-5">
                {mockFeatureImportance.filter((f) => f.importance >= 0.1).length}
              </div>
              <div className="text-xs text-muted-foreground">High Impact Features</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold font-mono">
                {(mockFeatureImportance.slice(0, 5).reduce((sum, f) => sum + f.importance, 0) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Top 5 Features Coverage</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold font-mono text-chart-2">{mockFeatureImportance.length}</div>
              <div className="text-xs text-muted-foreground">Total Features</div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-muted/20 rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-2">Key Insights</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-start space-x-2">
              <div className="w-1 h-1 rounded-full bg-chart-2 mt-1.5 flex-shrink-0" />
              <span>
                Packet-level features (avg_pkt_len, bytes_total) are the strongest predictors of application type
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1 h-1 rounded-full bg-chart-2 mt-1.5 flex-shrink-0" />
              <span>Temporal features (duration, inter-arrival time) provide significant classification power</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1 h-1 rounded-full bg-chart-2 mt-1.5 flex-shrink-0" />
              <span>Port-based features have lower importance, indicating protocol-agnostic classification</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
