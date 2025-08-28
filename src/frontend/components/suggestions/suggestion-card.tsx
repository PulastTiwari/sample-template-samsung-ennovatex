"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api, ApiError } from "@/lib/api"
import type { Suggestion } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SuggestionCardProps {
  suggestion: Suggestion
  onUpdate: (updatedSuggestion: Suggestion) => void
  className?: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-chart-2 text-white"
    case "denied":
      return "bg-chart-5 text-white"
    case "pending":
      return "bg-chart-3 text-white"
    default:
      return "bg-muted text-muted-foreground"
  }
}

const getDscpColor = (dscp: string) => {
  if (dscp.includes("EF")) return "text-chart-5" // Expedited Forwarding - highest priority
  if (dscp.includes("AF4")) return "text-chart-4" // Assured Forwarding Class 4
  if (dscp.includes("AF3")) return "text-chart-3" // Assured Forwarding Class 3
  if (dscp.includes("AF2")) return "text-chart-2" // Assured Forwarding Class 2
  if (dscp.includes("AF1")) return "text-chart-1" // Assured Forwarding Class 1
  return "text-muted-foreground" // Best Effort
}

export function SuggestionCard({ suggestion, onUpdate, className }: SuggestionCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null)

  const handleApprove = async () => {
    setLoading(true)
    setError(null)
    setOptimisticStatus("approved")

    try {
      const result = await api.approveSuggestion(suggestion.id)
      onUpdate({ ...suggestion, status: result.status as "approved" | "denied" | "pending" })
    } catch (err) {
      setOptimisticStatus(null)
      const errorMessage =
        err instanceof ApiError ? `Failed to approve suggestion (${err.status}): ${err.message}` : "Approval failed"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDeny = async () => {
    setLoading(true)
    setError(null)
    setOptimisticStatus("denied")

    try {
      const result = await api.denySuggestion(suggestion.id)
      onUpdate({ ...suggestion, status: result.status as "approved" | "denied" | "pending" })
    } catch (err) {
      setOptimisticStatus(null)
      const errorMessage =
        err instanceof ApiError ? `Failed to deny suggestion (${err.status}): ${err.message}` : "Denial failed"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const currentStatus = optimisticStatus || suggestion.status
  const isActionable = currentStatus === "pending" && !loading

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-display">Policy Suggestion</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Profile: {suggestion.profile_id}</p>
          </div>
          <Badge variant="secondary" className={cn("text-xs", getStatusColor(currentStatus))}>
            {currentStatus.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Suggestion Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Suggested Application</span>
            <div className="mt-1">
              <Badge variant="outline" className="text-sm">
                {suggestion.suggested_app}
              </Badge>
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-muted-foreground">Community Votes</span>
            <div className="mt-1 flex items-center space-x-2">
              <span className="text-lg font-bold font-mono">{suggestion.votes}</span>
              <span className="text-xs text-muted-foreground">{suggestion.votes === 1 ? "vote" : "votes"}</span>
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-muted-foreground">DSCP Class</span>
            <div className="mt-1">
              <span className={cn("font-mono font-bold text-sm", getDscpColor(suggestion.suggested_dscp))}>
                {suggestion.suggested_dscp}
              </span>
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-muted-foreground">Traffic Class</span>
            <div className="mt-1">
              <span className="font-mono font-medium text-sm">{suggestion.suggested_tc}</span>
            </div>
          </div>
        </div>

        {/* Rationale */}
        <div>
          <span className="text-sm font-medium text-muted-foreground">AI Rationale</span>
          <div className="mt-2 p-3 bg-muted/20 rounded-lg border text-sm italic">{suggestion.rationale}</div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        {isActionable && (
          <div className="flex items-center space-x-3 pt-2">
            <Button onClick={handleApprove} disabled={loading} className="flex-1" size="sm">
              {loading && optimisticStatus === "approved" ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Approving...
                </>
              ) : (
                "Approve Policy"
              )}
            </Button>
            <Button
              onClick={handleDeny}
              disabled={loading}
              variant="outline"
              className="flex-1 bg-transparent"
              size="sm"
            >
              {loading && optimisticStatus === "denied" ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Denying...
                </>
              ) : (
                "Deny"
              )}
            </Button>
          </div>
        )}

        {/* Status Message for Non-Actionable Items */}
        {!isActionable && currentStatus !== "pending" && (
          <div className="text-center py-2 text-sm text-muted-foreground">This suggestion has been {currentStatus}</div>
        )}
      </CardContent>
    </Card>
  )
}
