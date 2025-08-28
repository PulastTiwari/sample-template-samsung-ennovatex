"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { Flow } from "@/lib/types"
import { cn } from "@/lib/utils"

interface LiveTrafficTableProps {
  flows: Flow[]
  loading?: boolean
  onFlowSelect?: (flow: Flow) => void
  className?: string
}

type SortField = "id" | "source_ip" | "dest_ip" | "dest_port" | "app_type" | "status"
type SortDirection = "asc" | "desc"

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

const getStatusColor = (status?: string) => {
  const s = (status || "").toLowerCase()
  if (s.includes("policy applied")) return "text-chart-2"
  if (s.includes("classified")) return "text-chart-4"
  if (s.includes("processing")) return "text-chart-3"
  return "text-muted-foreground"
}

const getAppTypeColor = (appType?: string | null) => {
  const type = (appType || "").toLowerCase()
  if (type.includes("video")) return "bg-chart-4/10 text-chart-4 border-chart-4/20"
  if (type.includes("audio")) return "bg-chart-2/10 text-chart-2 border-chart-2/20"
  if (type.includes("web")) return "bg-chart-1/10 text-chart-1 border-chart-1/20"
  if (type.includes("game")) return "bg-primary/10 text-primary border-primary/20"
  return "bg-muted/10 text-muted-foreground border-muted/20"
}

export function LiveTrafficTable({ flows, loading = false, onFlowSelect, className }: LiveTrafficTableProps) {
  const [sortField, setSortField] = useState<SortField>("id")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [filterEngine, setFilterEngine] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredAndSortedFlows = useMemo(() => {
    const safeFlows = Array.isArray(flows) ? flows : []
    let filtered = safeFlows

    if (filterEngine !== "all") {
      filtered = filtered.filter((flow) => flow.engine === filterEngine)
    }

    if (filterStatus !== "all") {
      const fs = filterStatus.toLowerCase()
      filtered = filtered.filter((flow) => ((flow.status || "").toLowerCase().includes(fs)))
    }

    return filtered.sort((a, b) => {
      let aValue: string | number = a[sortField] || ""
      let bValue: string | number = b[sortField] || ""

      if (sortField === "dest_port") {
        aValue = Number(aValue)
        bValue = Number(bValue)
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return sortDirection === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
    })
  }, [flows, sortField, sortDirection, filterEngine, filterStatus])

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent"
    >
      {children}
      {sortField === field && <span className="ml-1 text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>}
    </Button>
  )

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-display">Live Traffic Monitor</CardTitle>
          <div className="flex items-center space-x-2">
            {loading && <LoadingSpinner size="sm" />}
            <span className="text-sm text-muted-foreground">{filteredAndSortedFlows.length} flows</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 pt-2">
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
            <span className="text-sm text-muted-foreground">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm bg-background border border-border rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value="policy">Policy Applied</option>
              <option value="classified">Classified</option>
              <option value="processing">Processing</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton field="id">Flow ID</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="source_ip">Source</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="dest_ip">Destination</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="dest_port">Port</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="app_type">Application</SortButton>
                </TableHead>
                <TableHead>Engine</TableHead>
                <TableHead>
                  <SortButton field="status">Status</SortButton>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedFlows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <LoadingSpinner size="sm" />
                        <span>Loading traffic data...</span>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm">No traffic flows found</div>
                        <div className="text-xs mt-1">
                          {filterEngine !== "all" || filterStatus !== "all"
                            ? "Try adjusting your filters"
                            : "Waiting for network activity..."}
                        </div>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedFlows.map((flow) => (
                  <TableRow key={flow.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs">{flow.id}</TableCell>
                    <TableCell className="font-mono text-sm">{flow.source_ip}</TableCell>
                    <TableCell className="font-mono text-sm">{flow.dest_ip}</TableCell>
                    <TableCell className="font-mono text-sm">{flow.dest_port}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", getAppTypeColor(flow.app_type))}>
                        {flow.app_type ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {flow.engine ? (
                        <Badge variant="secondary" className={cn("text-xs", getEngineColor(flow.engine))}>
                          {flow.engine}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={cn("text-xs font-medium", getStatusColor(flow.status))}>{flow.status ?? "-"}</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFlowSelect?.(flow)}
                        className="text-xs h-7 px-2"
                      >
                        Investigate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
