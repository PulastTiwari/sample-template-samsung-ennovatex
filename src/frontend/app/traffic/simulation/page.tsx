"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function SimulationPage() {
  const [videoPct, setVideoPct] = useState(50)
  const [totalGb, setTotalGb] = useState(1)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Record<string, number>>({})

  async function run() {
    setLoading(true)
    try {
      const res = await api.runSimulation(videoPct, totalGb)
      setResults(res.simulation_results || {})
    } catch (e) {
      console.error('Simulation failed', e)
    } finally {
      setLoading(false)
    }
  }

  const data = Object.entries(results).map(([k, v]) => ({ name: k, value: v }))

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">What-if Traffic Simulation</h1>
      <Card>
        <CardHeader>
          <CardTitle>Simulation Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm">Percentage of Video Traffic: {videoPct}%</label>
              <input type="range" min={0} max={100} value={videoPct} onChange={(e) => setVideoPct(Number(e.target.value))} className="w-full" />
            </div>

            <div>
              <label className="text-sm">Total Data Volume (GB)</label>
              <input type="number" min={1} value={totalGb} onChange={(e) => setTotalGb(Number(e.target.value))} className="w-32 p-2 border rounded" />
            </div>

            <div>
              <Button onClick={run} disabled={loading}>{loading ? 'Running…' : 'Run Simulation'}</Button>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Results</h4>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={160} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6">
                      {data.map((entry, idx) => (
                        <Cell key={`c-${idx}`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
