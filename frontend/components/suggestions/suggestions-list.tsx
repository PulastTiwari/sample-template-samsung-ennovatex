"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SuggestionCard } from "./suggestion-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { Suggestion } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SuggestionsListProps {
  suggestions: Suggestion[]
  loading?: boolean
  onSuggestionUpdate: (updatedSuggestion: Suggestion) => void
  className?: string
}

export function SuggestionsList({ suggestions, loading = false, onSuggestionUpdate, className }: SuggestionsListProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"votes" | "status" | "app">("votes")

  const filteredAndSortedSuggestions = useMemo(() => {
    let filtered = suggestions

    if (filterStatus !== "all") {
      filtered = filtered.filter((suggestion) => suggestion.status === filterStatus)
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "votes":
          return b.votes - a.votes
        case "status":
          return a.status.localeCompare(b.status)
        case "app":
          return a.suggested_app.localeCompare(b.suggested_app)
        default:
          return 0
      }
    })
  }, [suggestions, filterStatus, sortBy])

  const getStatusCounts = () => {
    const counts = suggestions.reduce(
      (acc, suggestion) => {
        acc[suggestion.status] = (acc[suggestion.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    return {
      pending: counts.pending || 0,
      approved: counts.approved || 0,
      denied: counts.denied || 0,
      total: suggestions.length,
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-display">Policy Suggestions</CardTitle>
            <div className="flex items-center space-x-2">
              {loading && <LoadingSpinner size="sm" />}
              <span className="text-sm text-muted-foreground">{filteredAndSortedSuggestions.length} suggestions</span>
            </div>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono">{statusCounts.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-chart-3">{statusCounts.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-chart-2">{statusCounts.approved}</div>
              <div className="text-xs text-muted-foreground">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-chart-5">{statusCounts.denied}</div>
              <div className="text-xs text-muted-foreground">Denied</div>
            </div>
          </div>

          {/* Filters and Sorting */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm bg-background border border-border rounded px-2 py-1"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "votes" | "status" | "app")}
                  className="text-sm bg-background border border-border rounded px-2 py-1"
                >
                  <option value="votes">Votes</option>
                  <option value="status">Status</option>
                  <option value="app">Application</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Suggestions Grid */}
      {filteredAndSortedSuggestions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <LoadingSpinner size="sm" />
                <span className="text-muted-foreground">Loading suggestions...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-muted-foreground">No policy suggestions found</div>
                <div className="text-xs text-muted-foreground">
                  {filterStatus !== "all"
                    ? "Try adjusting your filters"
                    : "The AI system will generate suggestions based on network patterns"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAndSortedSuggestions.map((suggestion) => (
            <SuggestionCard key={suggestion.id} suggestion={suggestion} onUpdate={onSuggestionUpdate} />
          ))}
        </div>
      )}
    </div>
  )
}
