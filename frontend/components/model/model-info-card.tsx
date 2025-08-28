"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface ModelInfoCardProps {
  className?: string
}

// Mock model data - in a real app this would come from the API
const mockModelInfo = {
  name: "Sentry LightGBM Classifier",
  version: "v2.1.0",
  trainedAt: "2024-01-15T10:30:00Z",
  accuracy: 94.7,
  precision: 92.3,
  recall: 96.1,
  f1Score: 94.2,
  totalSamples: 125000,
  featureCount: 12,
  modelSize: "2.4 MB",
  status: "active",
  features: [
    "packet_count",
    "avg_pkt_len",
    "duration_seconds",
    "bytes_total",
    "protocol_tcp",
    "protocol_udp",
    "port_443",
    "port_80",
    "port_22",
    "flow_ratio",
    "inter_arrival_time",
    "payload_entropy",
  ],
}

export function ModelInfoCard({ className }: ModelInfoCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-chart-2 text-white"
      case "training":
        return "bg-chart-3 text-white"
      case "deprecated":
        return "bg-chart-5 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 95) return "text-chart-2"
    if (score >= 90) return "text-chart-4"
    if (score >= 85) return "text-chart-3"
    return "text-chart-5"
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-display">{mockModelInfo.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Primary traffic classification model</p>
          </div>
          <Badge variant="secondary" className={cn("text-xs", getStatusColor(mockModelInfo.status))}>
            {mockModelInfo.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Model Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Version</span>
            <div className="font-mono text-sm mt-1">{mockModelInfo.version}</div>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Model Size</span>
            <div className="font-mono text-sm mt-1">{mockModelInfo.modelSize}</div>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Training Date</span>
            <div className="text-sm mt-1">{formatDate(mockModelInfo.trainedAt)}</div>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Training Samples</span>
            <div className="font-mono text-sm mt-1">{mockModelInfo.totalSamples.toLocaleString()}</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Performance Metrics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={cn("text-2xl font-bold font-mono", getPerformanceColor(mockModelInfo.accuracy))}>
                {mockModelInfo.accuracy}%
              </div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
            <div className="text-center">
              <div className={cn("text-2xl font-bold font-mono", getPerformanceColor(mockModelInfo.precision))}>
                {mockModelInfo.precision}%
              </div>
              <div className="text-xs text-muted-foreground">Precision</div>
            </div>
            <div className="text-center">
              <div className={cn("text-2xl font-bold font-mono", getPerformanceColor(mockModelInfo.recall))}>
                {mockModelInfo.recall}%
              </div>
              <div className="text-xs text-muted-foreground">Recall</div>
            </div>
            <div className="text-center">
              <div className={cn("text-2xl font-bold font-mono", getPerformanceColor(mockModelInfo.f1Score))}>
                {mockModelInfo.f1Score}%
              </div>
              <div className="text-xs text-muted-foreground">F1 Score</div>
            </div>
          </div>
        </div>

        {/* Feature Information */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Model Features ({mockModelInfo.featureCount})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {mockModelInfo.features.map((feature) => (
              <Badge key={feature} variant="outline" className="text-xs justify-center">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        {/* Model Health Alert */}
        <Alert>
          <AlertDescription className="text-sm">
            <strong>Model Health:</strong> The current model is performing well with {mockModelInfo.accuracy}% accuracy.
            Last retrained{" "}
            {Math.floor((Date.now() - new Date(mockModelInfo.trainedAt).getTime()) / (1000 * 60 * 60 * 24))} days ago.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" size="sm">
            View Confusion Matrix
          </Button>
          <Button variant="outline" size="sm">
            Export Model Info
          </Button>
          <Button variant="outline" size="sm">
            Download Model
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
