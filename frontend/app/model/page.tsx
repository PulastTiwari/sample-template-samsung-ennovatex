"use client"

import { cn } from "@/lib/utils"

import { ModelInfoCard } from "@/components/model/model-info-card"
import { TrainingInstructions } from "@/components/model/training-instructions"
import { FeatureImportance } from "@/components/model/feature-importance"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function ModelPage() {
  // Mock model versions data
  const modelVersions = [
    {
      version: "v2.1.0",
      date: "2024-01-15",
      accuracy: 94.7,
      status: "active",
      notes: "Improved video streaming classification",
    },
    {
      version: "v2.0.3",
      date: "2023-12-10",
      accuracy: 93.2,
      status: "deprecated",
      notes: "Enhanced gaming traffic detection",
    },
    {
      version: "v2.0.2",
      date: "2023-11-05",
      accuracy: 91.8,
      status: "deprecated",
      notes: "Added VoIP classification support",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-chart-2 text-white"
      case "deprecated":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-chart-3 text-white"
    }
  }

  return (
    <div className="flex h-screen">

      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-display font-bold text-balance">Model Management</h1>
            <p className="text-muted-foreground mt-1">
              Monitor, analyze, and manage the AI classification models powering Sentinel-QoS
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Model Information */}
            <ModelInfoCard />

            {/* Model Versions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-display">Model Versions</CardTitle>
                <p className="text-sm text-muted-foreground">History of deployed classification models</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {modelVersions.map((version) => (
                    <div
                      key={version.version}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-mono font-medium">{version.version}</span>
                          <Badge variant="secondary" className={cn("text-xs", getStatusColor(version.status))}>
                            {version.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{version.notes}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(version.date).toLocaleDateString()} • {version.accuracy}% accuracy
                        </div>
                      </div>
                      {version.status === "deprecated" && (
                        <Button variant="ghost" size="sm" className="text-xs">
                          Restore
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Importance */}
          <FeatureImportance />

          {/* Training Instructions */}
          <TrainingInstructions />

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-display">System Health & Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold font-mono text-chart-2">99.2%</div>
                  <div className="text-xs text-muted-foreground">Model Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold font-mono">12ms</div>
                  <div className="text-xs text-muted-foreground">Avg Inference Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold font-mono text-chart-4">1.2M</div>
                  <div className="text-xs text-muted-foreground">Classifications Today</div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/20 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Recommendations</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-chart-2 mt-1.5 flex-shrink-0" />
                    <span>Model performance is optimal. Next retraining recommended in 30 days.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-chart-3 mt-1.5 flex-shrink-0" />
                    <span>Consider adding more IoT device traffic samples to improve edge case handling.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1 h-1 rounded-full bg-chart-1 mt-1.5 flex-shrink-0" />
                    <span>Monitor classification confidence scores for potential drift detection.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
