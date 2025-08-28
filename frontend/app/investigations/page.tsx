"use client"

import { useState } from "react"
import { useLiveStatus } from "@/hooks/use-live-status"
// Sidebar removed — navigation is now site-wide via NavBar and top-left logo
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { Investigation } from "@/lib/types"
import { cn } from "@/lib/utils"
import ExplanationChart from '@/components/investigations/explanation-chart'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { useEffect } from 'react'

export default function InvestigationsPage() {
  const { data, loading, error } = useLiveStatus()
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const investigations: Investigation[] = (data?.investigations || []).map((i: any, idx: number) => ({
    id: i.get('flow_id', `inv_${idx}`) || i.flow_id || `inv_${idx}`,
    flow_id: i.flow_id || i.get?.('flow_id') || i.flow_id || 'unknown',
    timestamp: i.timestamp || new Date().toISOString(),
    details: i.vanguard_explanation || i.sentry_explanation || JSON.stringify(i.features || i) || 'No details',
    status: i.status || 'open',
    shap: i.shap || undefined,
  }))

  const filteredInvestigations = investigations.filter((inv) => filterStatus === "all" || inv.status === filterStatus)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-chart-3 text-white"
      case "in-progress":
        return "bg-chart-4 text-white"
      case "resolved":
        return "bg-chart-2 text-white"
      case "escalated":
        return "bg-chart-5 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusCounts = () => {
  const open = investigations.filter((inv) => inv.status === "open").length
  const inProgress = investigations.filter((inv) => inv.status === "in-progress").length
  const resolved = investigations.filter((inv) => inv.status === "resolved").length
  const escalated = investigations.filter((inv) => inv.status === "escalated").length
  const total = investigations.length

  return { total, open, inProgress, resolved, escalated }
  }

  const statusCounts = getStatusCounts()

// Small client component to trigger Vanguard analysis and display the result
function GenerateVanguardButton({ investigation }: { investigation: any }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<{ app_type: string; confidence: number; explanation: string } | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // reset on investigation change
    setAnalysis(null)
    setLoading(false)
    setOpen(false)
  }, [investigation.flow_id])

  const run = async () => {
    setLoading(true)
    setOpen(true)
    setAnalysis(null)
    try {
      // Use the existing POST endpoint (no SSE) and display the returned analysis
      const res = await api.getVanguardAnalysis(investigation.flow_id)
      if (res) {
        setAnalysis({ app_type: res.app_type, confidence: res.confidence, explanation: res.explanation })
        toast({ title: 'Vanguard analysis ready', description: `App: ${res.app_type} (conf ${Math.round((res.confidence || 0) * 100)}%)` })
      } else {
        toast({ title: 'Vanguard analysis', description: 'No analysis returned', variant: 'destructive' })
      }
    } catch (err: any) {
      console.error('Vanguard analysis failed', err)
      toast({ title: 'Vanguard analysis failed', description: err?.message || String(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={run} disabled={loading}>
        {loading ? 'Analyzing...' : 'Generate Vanguard Analysis'}
      </Button>

      <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
        <DialogTrigger asChild>
          {/* invisible trigger; we open programmatically */}
          <span />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vanguard Analysis — {investigation.flow_id}</DialogTitle>
              <DialogDescription>Natural language explanation and model SHAP breakdown.</DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            {loading ? (
              <div className="flex items-center space-x-3">
                <LoadingSpinner />
                <div className="text-sm text-muted-foreground">Vanguard is running — awaiting response...</div>
              </div>
            ) : analysis ? (
              <div>
                <div className="text-sm font-medium">Prediction: {analysis.app_type} <span className="text-xs text-muted-foreground">({Math.round(analysis.confidence*100)}%)</span></div>
                <div className="mt-2 text-sm leading-relaxed">{analysis.explanation}</div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No analysis yet.</div>
            )}

            {investigation.shap && (
              <div>
                <div className="text-sm font-medium">Model SHAP Explanation</div>
                <div className="mt-2">
                  <ExplanationChart data={investigation.shap} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
            </div>
          </DialogFooter>
          <DialogClose />
        </DialogContent>
      </Dialog>
    </>
  )
}

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
            <h1 className="text-3xl font-display font-bold text-balance">Flow Investigations</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage network flow anomalies and classification investigations
            </p>
          </div>

          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-display">Investigation Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold font-mono">{statusCounts.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold font-mono text-chart-3">{statusCounts.open}</div>
                  <div className="text-xs text-muted-foreground">Open</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold font-mono text-chart-4">{statusCounts.inProgress}</div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold font-mono text-chart-2">{statusCounts.resolved}</div>
                  <div className="text-xs text-muted-foreground">Resolved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold font-mono text-chart-5">{statusCounts.escalated}</div>
                  <div className="text-xs text-muted-foreground">Escalated</div>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="flex items-center space-x-4 pt-4 border-t border-border mt-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-sm bg-background border border-border rounded px-2 py-1"
                  >
                    <option value="all">All</option>
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="escalated">Escalated</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  {loading && <LoadingSpinner size="sm" />}
                  <span className="text-sm text-muted-foreground">{filteredInvestigations.length} investigations</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investigations List */}
          <div className="space-y-4">
            {filteredInvestigations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="space-y-2">
                    <div className="text-muted-foreground">No investigations found</div>
                    <div className="text-xs text-muted-foreground">
                      {filterStatus !== "all"
                        ? "Try adjusting your filters"
                        : "All network flows are operating normally"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredInvestigations.map((investigation) => (
                <Card key={investigation.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold">Investigation {investigation.id}</h3>
                        <Badge variant="secondary" className={cn("text-xs", getStatusColor(investigation.status))}>
                          {investigation.status.replace("-", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(investigation.timestamp).toLocaleString()}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Related Flow:</span>
                        <div className="font-mono text-sm mt-1">{investigation.flow_id}</div>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Investigation Details:</span>
                        <div className="text-sm mt-1 leading-relaxed">{investigation.details}</div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Button variant="outline" size="sm">
                          View Flow Details
                        </Button>
                        <Button variant="outline" size="sm">
                          Update Status
                        </Button>
                        <Button variant="outline" size="sm">
                          Add Notes
                        </Button>
                          {investigation.status === "resolved" && (
                            <Button variant="outline" size="sm">
                              Export Report
                            </Button>
                          )}
                          <GenerateVanguardButton investigation={investigation} />
                      </div>
                    {/* Explanation chart when shap exists */}
                    {investigation.shap && (
                      <div className="mt-4">
                        <span className="text-sm font-medium text-muted-foreground">Model Explanation</span>
                        <ExplanationChart data={investigation.shap} />
                      </div>
                    )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
