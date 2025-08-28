"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Flow, ClassificationLogEntry, Policy } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FlowDetailPanelProps {
  flow: Flow | null
  classificationLogs: ClassificationLogEntry[]
  policies: Policy[]
  onClose: () => void
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

export function FlowDetailPanel({ flow, classificationLogs, policies, onClose, className }: FlowDetailPanelProps) {
  if (!flow) return null

  const flowLogs = classificationLogs.filter((log) => log.message.includes(flow.id))
  const flowPolicy = policies.find((policy) => policy.flow_id === flow.id)

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display">Flow Investigation</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Flow Overview */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Flow Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Flow ID:</span>
              <div className="font-mono mt-1">{flow.id}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <div className="mt-1">{flow.status}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Source IP:</span>
              <div className="font-mono mt-1">{flow.source_ip}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Destination:</span>
              <div className="font-mono mt-1">
                {flow.dest_ip}:{flow.dest_port}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Application Type:</span>
              <div className="mt-1">
                <Badge variant="outline" className="text-xs">
                  {flow.app_type}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Classification Engine:</span>
              <div className="mt-1">
                {flow.engine ? (
                  <Badge variant="secondary" className={cn("text-xs", getEngineColor(flow.engine))}>
                    {flow.engine}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Not classified</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Applied Policy */}
        {flowPolicy && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Applied QoS Policy</h4>
            <div className="bg-muted/20 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">DSCP Class:</span>
                  <div className="font-mono mt-1 text-chart-2">{flowPolicy.dscp_class}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Traffic Class:</span>
                  <div className="font-mono mt-1 text-chart-2">{flowPolicy.tc_class}</div>
                </div>
              </div>
              {flowPolicy.explanation && (
                <div className="mt-3">
                  <span className="text-muted-foreground text-xs">Policy Rationale:</span>
                  <div className="text-xs mt-1 italic">{flowPolicy.explanation}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Classification Timeline */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Classification Timeline</h4>
          <div className="space-y-3">
            {flowLogs.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No classification logs found for this flow
              </div>
            ) : (
              flowLogs.map((log, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/20">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${log.engine === "Sentry" ? "bg-chart-2" : "bg-primary"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{log.timestamp}</span>
                      {log.engine && (
                        <Badge variant="secondary" className={cn("text-xs", getEngineColor(log.engine))}>
                          {log.engine}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{log.message}</p>
                    {log.explanation && <p className="text-xs text-muted-foreground mt-1 italic">{log.explanation}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Investigation Actions */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Investigation Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              Export Flow Data
            </Button>
            <Button variant="outline" size="sm">
              Create Investigation
            </Button>
            <Button variant="outline" size="sm">
              Reclassify Flow
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
