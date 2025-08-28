"use client"

import { useState, useEffect } from "react"
import { useLiveStatus } from "@/hooks/use-live-status"
import { SuggestionsList } from "@/components/suggestions/suggestions-list"
import { SuggestionAnalytics } from "@/components/suggestions/suggestion-analytics"
// Sidebar removed — navigation is now site-wide via NavBar and top-left logo
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { api, ApiError } from "@/lib/api"
import type { Suggestion } from "@/lib/types"

export default function SuggestionsPage() {
  const { data, loading: statusLoading, error: statusError } = useLiveStatus()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setError(null)
        const fetchedSuggestions = await api.listSuggestions()
        setSuggestions(fetchedSuggestions)
      } catch (err) {
        const errorMessage =
          err instanceof ApiError
            ? `Failed to load suggestions (${err.status}): ${err.message}`
            : "Failed to load suggestions"
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [])

  const handleSuggestionUpdate = (updatedSuggestion: Suggestion) => {
    setSuggestions((prev) =>
      prev.map((suggestion) => (suggestion.id === updatedSuggestion.id ? updatedSuggestion : suggestion)),
    )
  }

  if (statusError || error) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 p-6">
          <Alert variant="destructive">
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {statusError
                ? "Unable to connect to Sentinel-QoS backend. Please ensure the API server is running on localhost:8000."
                : error}
              <br />
              <span className="text-xs mt-2 block">Error: {statusError || error}</span>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
  <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-display font-bold text-balance">Policy Suggestions</h1>
            <p className="text-muted-foreground mt-1">
              AI-generated QoS policy recommendations based on network traffic patterns and community feedback
            </p>
          </div>

          {/* Analytics */}
          <SuggestionAnalytics suggestions={suggestions} />

          {/* Suggestions List */}
          <SuggestionsList suggestions={suggestions} loading={loading} onSuggestionUpdate={handleSuggestionUpdate} />
        </div>
      </main>
    </div>
  )
}
