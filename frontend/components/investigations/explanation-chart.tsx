"use client"

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  data: Record<string, number>
}

export default function ExplanationChart({ data }: Props) {
  const entries = Object.entries(data || {})
    .map(([k, v]) => ({ name: k, value: Math.abs(v), raw: v }))
    .sort((a, b) => b.value - a.value)

  if (entries.length === 0) return null

  return (
    <div style={{ width: '100%', height: 160 }} className="mt-3">
      <ResponsiveContainer>
        <BarChart data={entries} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={120} />
          <Tooltip formatter={(val: number, name: string, props: any) => [props.payload.raw.toFixed(4), name]} />
          <Bar dataKey="value" fill="#3b82f6">
            {entries.map((entry, idx) => (
              <Cell key={`c-${idx}`} fill={entry.raw >= 0 ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
