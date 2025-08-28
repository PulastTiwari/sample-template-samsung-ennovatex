"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Suggestion } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SuggestionAnalyticsProps {
  suggestions: Suggestion[]
  className?: string
}

export function SuggestionAnalytics({ suggestions, className }: SuggestionAnalyticsProps) {
  const getAppTypeDistribution = () => {
    const distribution = suggestions.reduce(
      (acc, suggestion) => {
        acc[suggestion.suggested_app] = (acc[suggestion.suggested_app] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(distribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  }

  const getDscpDistribution = () => {
    const distribution = suggestions.reduce(
      (acc, suggestion) => {
        acc[suggestion.suggested_dscp] = (acc[suggestion.suggested_dscp] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(distribution).sort(([, a], [, b]) => b - a)
  }

  const getApprovalRate = () => {
    if (suggestions.length === 0) return 0
    const approved = suggestions.filter((s) => s.status === "approved").length
    return (approved / suggestions.length) * 100
  }

  const getAverageVotes = () => {
    if (suggestions.length === 0) return 0
    const totalVotes = suggestions.reduce((sum, s) => sum + s.votes, 0)
    return totalVotes / suggestions.length
  }

  const appTypeDistribution = getAppTypeDistribution()
  const dscpDistribution = getDscpDistribution()
  const approvalRate = getApprovalRate()
  const averageVotes = getAverageVotes()

  const getDscpColor = (dscp: string) => {
    if (dscp.includes("EF")) return "text-chart-5"
    if (dscp.includes("AF4")) return "text-chart-4"
    if (dscp.includes("AF3")) return "text-chart-3"
    if (dscp.includes("AF2")) return "text-chart-2"
    if (dscp.includes("AF1")) return "text-chart-1"
    return "text-muted-foreground"
  }

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6", className)}>
      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Suggestion Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-chart-2">{approvalRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Approval Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono">{averageVotes.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Avg Votes</div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Community Approval</span>
              <span className="font-mono">{approvalRate.toFixed(1)}%</span>
            </div>
            <Progress value={approvalRate} className="h-2" />
          </div>

          <div className="text-xs text-muted-foreground">
            Higher approval rates indicate better AI suggestion quality and community consensus on policy decisions.
          </div>
        </CardContent>
      </Card>

      {/* Application Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Top Application Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {appTypeDistribution.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">No data available</div>
            ) : (
              appTypeDistribution.map(([appType, count]) => {
                const percentage = (count / suggestions.length) * 100
                return (
                  <div key={appType} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <Badge variant="outline" className="text-xs">
                        {appType}
                      </Badge>
                      <span className="font-mono text-xs">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-1" />
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* DSCP Class Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">DSCP Class Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dscpDistribution.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">No data available</div>
            ) : (
              dscpDistribution.map(([dscp, count]) => {
                const percentage = (count / suggestions.length) * 100
                return (
                  <div key={dscp} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span className={cn("font-mono font-bold", getDscpColor(dscp))}>{dscp}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-muted rounded-full h-1">
                        <div
                          className="h-1 bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs w-12 text-right">{count}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {suggestions
              .filter((s) => s.status !== "pending")
              .slice(0, 5)
              .map((suggestion) => (
                <div key={suggestion.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        suggestion.status === "approved" ? "bg-chart-2 text-white" : "bg-chart-5 text-white",
                      )}
                    >
                      {suggestion.status.toUpperCase()}
                    </Badge>
                    <span className="truncate">{suggestion.suggested_app}</span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{suggestion.votes} votes</span>
                </div>
              ))}
            {suggestions.filter((s) => s.status !== "pending").length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">No recent activity</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
