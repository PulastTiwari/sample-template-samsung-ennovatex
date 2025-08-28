"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api, ApiError } from "@/lib/api"
import type { FlowFeatures, ClassificationResult } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ManualClassifierProps {
  className?: string
}

export function ManualClassifier({ className }: ManualClassifierProps) {
  const [features, setFeatures] = useState<FlowFeatures>({
    source_ip: "192.168.1.100",
    dest_ip: "8.8.8.8",
    dest_port: 443,
    packet_count: 150,
    avg_pkt_len: 800.5,
    duration_seconds: 15.2,
    bytes_total: 120000,
    protocol: "TCP",
  })

  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClassify = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const classification = await api.postClassify(features)
      setResult(classification)
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? `Classification failed (${err.status}): ${err.message}` : "Classification failed"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FlowFeatures, value: string | number) => {
    setFeatures((prev) => ({
      ...prev,
      [field]: value,
    }))
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-chart-2"
    if (confidence >= 0.7) return "text-chart-4"
    if (confidence >= 0.5) return "text-chart-3"
    return "text-chart-5"
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-display">Manual Flow Classification</CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the AI classification system with custom network flow parameters
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Source IP</label>
            <input
              type="text"
              value={features.source_ip}
              onChange={(e) => handleInputChange("source_ip", e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm font-mono"
              placeholder="192.168.1.100"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Destination IP</label>
            <input
              type="text"
              value={features.dest_ip}
              onChange={(e) => handleInputChange("dest_ip", e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm font-mono"
              placeholder="8.8.8.8"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Destination Port</label>
            <input
              type="number"
              value={features.dest_port}
              onChange={(e) => handleInputChange("dest_port", Number.parseInt(e.target.value) || 0)}
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm font-mono"
              placeholder="443"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Protocol</label>
            <select
              value={features.protocol || "TCP"}
              onChange={(e) => handleInputChange("protocol", e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm"
            >
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Packet Count</label>
            <input
              type="number"
              value={features.packet_count}
              onChange={(e) => handleInputChange("packet_count", Number.parseInt(e.target.value) || 0)}
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm font-mono"
              placeholder="150"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Avg Packet Length</label>
            <input
              type="number"
              step="0.1"
              value={features.avg_pkt_len}
              onChange={(e) => handleInputChange("avg_pkt_len", Number.parseFloat(e.target.value) || 0)}
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm font-mono"
              placeholder="800.5"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Duration (seconds)</label>
            <input
              type="number"
              step="0.1"
              value={features.duration_seconds}
              onChange={(e) => handleInputChange("duration_seconds", Number.parseFloat(e.target.value) || 0)}
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm font-mono"
              placeholder="15.2"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Total Bytes</label>
            <input
              type="number"
              value={features.bytes_total}
              onChange={(e) => handleInputChange("bytes_total", Number.parseInt(e.target.value) || 0)}
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-lg text-sm font-mono"
              placeholder="120000"
            />
          </div>
        </div>

        {/* Classify Button */}
        <div className="flex justify-center">
          <Button onClick={handleClassify} disabled={loading} className="px-8">
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Classifying...
              </>
            ) : (
              "Classify Flow"
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        {result && (
          <div className="bg-muted/20 rounded-lg p-6 space-y-4">
            <h4 className="text-lg font-display font-semibold">Classification Result</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Flow ID:</span>
                <div className="font-mono text-sm mt-1">{result.flow_id}</div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Classification Engine:</span>
                <div className="mt-1">
                  <Badge variant="secondary" className={cn("text-xs", getEngineColor(result.engine))}>
                    {result.engine || "Unknown"}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Application Type:</span>
                <div className="mt-1">
                  <Badge variant="outline" className="text-sm">
                    {result.app_type}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Confidence Score:</span>
                <div className="mt-1">
                  <span className={cn("text-lg font-bold font-mono", getConfidenceColor(result.confidence))}>
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {result.explanation && (
              <div>
                <span className="text-sm text-muted-foreground">AI Explanation:</span>
                <div className="mt-2 p-3 bg-background rounded border text-sm italic">{result.explanation}</div>
              </div>
            )}

            {/* Confidence Visualization */}
            <div>
              <span className="text-sm text-muted-foreground">Confidence Level:</span>
              <div className="mt-2 w-full bg-muted rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-500",
                    result.confidence >= 0.9
                      ? "bg-chart-2"
                      : result.confidence >= 0.7
                        ? "bg-chart-4"
                        : result.confidence >= 0.5
                          ? "bg-chart-3"
                          : "bg-chart-5",
                  )}
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
