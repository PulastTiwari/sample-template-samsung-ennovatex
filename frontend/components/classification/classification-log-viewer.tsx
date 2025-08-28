"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { ClassificationLogEntry } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ClassificationLogViewerProps {
  logs: ClassificationLogEntry[]
  loading?: boolean
  className?: string
}

export function ClassificationLogViewer({ logs, loading = false, className }: ClassificationLogViewerProps) {
  const [filterEngine, setFilterEngine] = useState<string>("all")
  const [showExplanations, setShowExplanations] = useState(true)
  const [maxEntries, setMaxEntries] = useState(50)

  const filteredLogs = useMemo(() => {
    let filtered = logs

    if (filterEngine !== "all") {
      filtered = filtered.filter((log) => log.engine === filterEngine)
    }

    return filtered.slice(0, maxEntries)
  }, [logs, filterEngine, maxEntries])

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

  const getLogTypeIcon = (message: string) => {
    if (message.includes("classified")) return "[classified]"
    if (message.includes("policy")) return "[policy]"
    if (message.includes("error")) return "[error]"
    if (message.includes("warning")) return "[warning]"
    return "[info]"
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString()
    } catch {
      return timestamp
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-display">AI Classification Log</CardTitle>
          <div className="flex items-center space-x-2">
            {loading && <LoadingSpinner size="sm" />}
            <span className="text-sm text-muted-foreground">{filteredLogs.length} entries</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Engine:</span>
              <select
                value={filterEngine}
                onChange={(e) => setFilterEngine(e.target.value)}
                className="text-sm bg-background border border-border rounded px-2 py-1"
              >
                <option value="all">All</option>
                <option value="Sentry">Sentry</option>
                <option value="Vanguard">Vanguard</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <select
                value={maxEntries}
                onChange={(e) => setMaxEntries(Number.parseInt(e.target.value))}
                className="text-sm bg-background border border-border rounded px-2 py-1"
              >
                <option value={25}>25 entries</option>
                <option value={50}>50 entries</option>
                <option value={100}>100 entries</option>
                <option value={200}>200 entries</option>
              </select>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExplanations(!showExplanations)}
            className="text-xs"
          >
            {showExplanations ? "Hide" : "Show"} Explanations
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Loading classification logs...</span>
                </div>
              ) : (
                <div>
                  <div className="text-sm">No classification logs found</div>
                  <div className="text-xs mt-1">
                    {filterEngine !== "all" ? "Try adjusting your filters" : "Waiting for AI classifications..."}
                  </div>
                </div>
              )}
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 rounded-lg bg-muted/10 border border-border/50 hover:bg-muted/20 transition-colors"
              >
                <div className="text-base mt-0.5">{getLogTypeIcon(log.message)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{formatTimestamp(log.timestamp)}</span>
                    {log.engine && (
                      <Badge variant="secondary" className={cn("text-xs", getEngineColor(log.engine))}>
                        {log.engine}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-foreground leading-relaxed">{log.message}</p>

                  {showExplanations && log.explanation && (
                    <div className="mt-2 p-2 bg-background/50 rounded border text-xs text-muted-foreground italic">
                      <span className="font-medium">AI Explanation:</span> {log.explanation}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {logs.length > maxEntries && (
          <div className="text-center pt-4 border-t border-border mt-4">
            <span className="text-xs text-muted-foreground">
              Showing {maxEntries} of {logs.length} total entries
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
