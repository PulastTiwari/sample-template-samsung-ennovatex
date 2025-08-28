"use client"

import { useLiveStatus } from "@/hooks/use-live-status"
import { ManualClassifier } from "@/components/classification/manual-classifier"
import { ClassificationLogViewer } from "@/components/classification/classification-log-viewer"
import { AIEngineStatus } from "@/components/classification/ai-engine-status"
// Sidebar removed — navigation is now site-wide via NavBar and top-left logo
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ClassifyPage() {
  const { data, loading, error } = useLiveStatus()

  if (error) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 p-6">
          <Alert variant="destructive">
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              Unable to connect to Sentinel-QoS backend. Please ensure the API server is running on localhost:8000.
              <br />
              <span className="text-xs mt-2 block">Error: {error}</span>
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
            <h1 className="text-3xl font-display font-bold text-balance">AI Classification System</h1>
            <p className="text-muted-foreground mt-1">
              Two-stage AI engine for intelligent network traffic classification and analysis
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Manual Classifier */}
            <ManualClassifier />

            {/* AI Engine Status */}
            <AIEngineStatus logs={data?.classification_log || []} />
          </div>

          {/* Classification Log */}
          <ClassificationLogViewer logs={data?.classification_log || []} loading={loading} />
        </div>
      </main>
    </div>
  )
}
